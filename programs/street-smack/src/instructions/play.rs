use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::access_control::instructions::CreateEphemeralPermissionCpi;
use ephemeral_rollups_sdk::access_control::structs::{EphemeralMembersArgs, Member};
use ephemeral_rollups_sdk::consts::{EPHEMERAL_VAULT_ID, MAGIC_PROGRAM_ID, PERMISSION_PROGRAM_ID};

use crate::error::SmackError;
use crate::state::{FightState, FightStatus, PlayerSeat, SealedAmbush};
use crate::{AMBUSH_SEED, FIGHT_SEED, SEAT_SEED};

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct SealAmbush<'info> {
    #[account(
        mut,
        seeds = [FIGHT_SEED, fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,

    #[account(
        mut,
        seeds = [AMBUSH_SEED, fight_id.to_le_bytes().as_ref(), session.key().as_ref()],
        bump = ambush.bump
    )]
    pub ambush: Account<'info, SealedAmbush>,

    pub session: Signer<'info>,

    /// CHECK: derived and validated by permission program
    #[account(mut)]
    pub permission: UncheckedAccount<'info>,

    /// CHECK: collects ER-local rent; address-constrained
    #[account(mut, address = EPHEMERAL_VAULT_ID)]
    pub ephemeral_vault: UncheckedAccount<'info>,

    /// CHECK: runtime builtin; address-constrained
    #[account(address = MAGIC_PROGRAM_ID)]
    pub magic_program: UncheckedAccount<'info>,

    /// CHECK: access-control program; address-constrained
    #[account(address = PERMISSION_PROGRAM_ID)]
    pub permission_program: UncheckedAccount<'info>,
}

/// Pillar 1: Private ER Sealed Account.
/// An ephemeral permission with 0 members seals the move inside Intel TDX TEE.
/// Anonymous callers and RPC node operators are rejected; only the enclave program executes it.
pub fn handle_seal_ambush(ctx: Context<SealAmbush>, fight_id: u64) -> Result<()> {
    let bump = ctx.accounts.ambush.bump;
    let session_key = ctx.accounts.session.key();
    let fight_bytes = fight_id.to_le_bytes();
    let seeds: &[&[u8]] = &[AMBUSH_SEED, &fight_bytes, session_key.as_ref(), &[bump]];

    CreateEphemeralPermissionCpi {
        permissioned_account: ctx.accounts.ambush.to_account_info(),
        permission: ctx.accounts.permission.to_account_info(),
        payer: ctx.accounts.ambush.to_account_info(),
        vault: ctx.accounts.ephemeral_vault.to_account_info(),
        magic_program: ctx.accounts.magic_program.to_account_info(),
        permission_program: ctx.accounts.permission_program.to_account_info(),
        args: EphemeralMembersArgs {
            is_private: true,
            members: Vec::<Member>::new(), // 0 members: program-only execution!
        },
    }
    .invoke_signed(&[seeds])?;

    msg!("street-smack: ambush trap sealed in Private ER for fight #{}", fight_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct CastEmote<'info> {
    #[account(
        mut,
        seeds = [FIGHT_SEED, fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,

    #[account(
        mut,
        seeds = [SEAT_SEED, fight_id.to_le_bytes().as_ref(), session.key().as_ref()],
        bump = seat.bump
    )]
    pub seat: Account<'info, PlayerSeat>,

    /// Pillar 3: Session Key signer — Instant, zero gas inside Rollup
    pub session: Signer<'info>,
}

pub fn handle_cast_emote(
    ctx: Context<CastEmote>,
    _fight_id: u64,
    emote_id: u8,
    raw_damage: u32,
) -> Result<()> {
    let fight = &mut ctx.accounts.fight;
    require!(fight.status == FightStatus::Live, SmackError::NotLive);
    require!(emote_id < 4, SmackError::InvalidEmote);

    let seat = &mut ctx.accounts.seat;
    seat.damage = seat.damage.saturating_add(raw_damage as u64);
    seat.emotes[emote_id as usize] = seat.emotes[emote_id as usize].saturating_add(1);

    fight.tx_count = fight.tx_count.saturating_add(1);
    let drain = (raw_damage * 35).min(10_000);

    if seat.team == 1 {
        fight.damage_b = fight.damage_b.saturating_add(raw_damage as u64);
        if fight.aura_b <= drain {
            fight.aura_b = 0;
            fight.status = FightStatus::Finished;
            fight.winner = 1;
        } else {
            fight.aura_b = fight.aura_b.saturating_sub(drain);
        }
    } else {
        fight.damage_a = fight.damage_a.saturating_add(raw_damage as u64);
        if fight.aura_a <= drain {
            fight.aura_a = 0;
            fight.status = FightStatus::Finished;
            fight.winner = 2;
        } else {
            fight.aura_a = fight.aura_a.saturating_sub(drain);
        }
    }

    Ok(())
}
