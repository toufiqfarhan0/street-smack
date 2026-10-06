use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::error::SmackError;
use crate::state::{FightState, FightStatus, FightVault, PlayerSeat};
use crate::{FIGHT_SEED, VAULT_SEED, SEAT_SEED};

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct CreateFight<'info> {
    #[account(
        init,
        payer = creator,
        space = FightState::LEN,
        seeds = [FIGHT_SEED, fight_id.to_le_bytes().as_ref()],
        bump
    )]
    pub fight: Account<'info, FightState>,

    /// The Vault PDA holds real SOL stakes on Base Layer Solana. Never delegated!
    #[account(
        init,
        payer = creator,
        space = FightVault::LEN,
        seeds = [VAULT_SEED, fight_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Account<'info, FightVault>,

    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_fight(
    ctx: Context<CreateFight>,
    fight_id: u64,
    char_a: u8,
    char_b: u8,
    stake_lamports: u64,
) -> Result<()> {
    let fight = &mut ctx.accounts.fight;
    fight.fight_id = fight_id;
    fight.creator = ctx.accounts.creator.key();
    fight.char_a = char_a;
    fight.char_b = char_b;
    fight.stake_lamports = stake_lamports;
    fight.status = FightStatus::Scheduled;
    fight.aura_a = 10_000;
    fight.aura_b = 10_000;
    fight.damage_a = 0;
    fight.damage_b = 0;
    fight.tx_count = 0;
    fight.winner = 0;
    fight.player_count = 0;
    fight.team_a_count = 0;
    fight.team_b_count = 0;
    fight.bump = ctx.bumps.fight;

    let vault = &mut ctx.accounts.vault;
    vault.fight_id = fight_id;
    vault.total_staked = 0;
    vault.fee_collected = 0;
    vault.bump = ctx.bumps.vault;

    msg!("street-smack: fight #{} created on Solana L1", fight_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct JoinFight<'info> {
    #[account(
        mut,
        seeds = [FIGHT_SEED, fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,

    #[account(
        mut,
        seeds = [VAULT_SEED, fight_id.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, FightVault>,

    #[account(
        init,
        payer = payer,
        space = PlayerSeat::LEN,
        seeds = [SEAT_SEED, fight_id.to_le_bytes().as_ref(), session.key().as_ref()],
        bump
    )]
    pub seat: Account<'info, PlayerSeat>,

    /// Session throwaway key held in memory by player
    /// CHECK: Registered here; will sign inside Ephemeral Rollup
    pub session: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_join_fight(
    ctx: Context<JoinFight>,
    fight_id: u64,
    preferred_team: u8,
) -> Result<()> {
    let fight = &mut ctx.accounts.fight;
    require!(fight.status == FightStatus::Scheduled || fight.status == FightStatus::Live, SmackError::FightNotOpen);

    let stake = fight.stake_lamports;
    if stake > 0 {
        transfer(
            CpiContext::new(
                ctx.accounts.system_program.key(),
                Transfer {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            stake,
        )?;
        ctx.accounts.vault.total_staked = ctx.accounts.vault.total_staked.saturating_add(stake);
    }

    let team = if preferred_team == 1 || preferred_team == 2 {
        preferred_team
    } else if fight.team_a_count <= fight.team_b_count {
        1
    } else {
        2
    };

    if team == 1 {
        fight.team_a_count = fight.team_a_count.saturating_add(1);
    } else {
        fight.team_b_count = fight.team_b_count.saturating_add(1);
    }
    fight.player_count = fight.player_count.saturating_add(1);

    let seat = &mut ctx.accounts.seat;
    seat.fight_id = fight_id;
    seat.player = ctx.accounts.session.key();
    seat.owner = ctx.accounts.payer.key();
    seat.team = team;
    seat.damage = 0;
    seat.emotes = [0; 4];
    seat.claimed = false;
    seat.bump = ctx.bumps.seat;

    msg!("street-smack: player seated with session key {}", ctx.accounts.session.key());
    Ok(())
}
