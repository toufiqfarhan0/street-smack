use anchor_lang::prelude::*;
use crate::error::SmackError;
use crate::state::{FightState, FightStatus, FightVault, PlayerSeat, WinnerNFTBadge};
use crate::{BADGE_SEED, FIGHT_SEED, VAULT_SEED, SEAT_SEED};

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct ClaimReward<'info> {
    #[account(
        seeds = [FIGHT_SEED, fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,

    /// Pillar 4: Non-delegated L1 Vault PDA pays out on Base Layer Solana
    #[account(
        mut,
        seeds = [VAULT_SEED, fight_id.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, FightVault>,

    #[account(
        mut,
        seeds = [SEAT_SEED, fight_id.to_le_bytes().as_ref(), seat.player.as_ref()],
        bump = seat.bump,
        has_one = owner @ SmackError::UnauthorizedSigner
    )]
    pub seat: Account<'info, PlayerSeat>,

    #[account(
        init,
        payer = payer,
        space = WinnerNFTBadge::LEN,
        seeds = [BADGE_SEED, fight_id.to_le_bytes().as_ref(), payer.key().as_ref()],
        bump
    )]
    pub badge: Account<'info, WinnerNFTBadge>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: matches owner in seat
    pub owner: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_claim_reward(ctx: Context<ClaimReward>, fight_id: u64) -> Result<()> {
    let fight = &ctx.accounts.fight;
    require!(fight.status == FightStatus::Finished, SmackError::FightStillLive);

    let seat = &mut ctx.accounts.seat;
    require!(!seat.claimed, SmackError::AlreadyClaimed);
    require!(seat.team == fight.winner, SmackError::NotWinner);

    let vault = &mut ctx.accounts.vault;
    let winning_team_count = if fight.winner == 1 { fight.team_a_count.max(1) } else { fight.team_b_count.max(1) };
    let payout = vault.total_staked / (winning_team_count as u64);

    if payout > 0 {
        **vault.to_account_info().try_borrow_mut_lamports()? = vault
            .to_account_info()
            .lamports()
            .saturating_sub(payout);

        **ctx.accounts.payer.to_account_info().try_borrow_mut_lamports()? = ctx
            .accounts
            .payer
            .to_account_info()
            .lamports()
            .saturating_add(payout);
    }

    seat.claimed = true;

    // Mint NFT Trophy badge
    let badge = &mut ctx.accounts.badge;
    badge.fight_id = fight_id;
    badge.owner = ctx.accounts.payer.key();
    badge.character = if fight.winner == 1 { fight.char_a } else { fight.char_b };
    badge.rarity = if seat.damage > 500 { 3 } else { 1 };
    badge.damage_share_bps = 2500;
    badge.amount_won_lamports = payout;
    badge.minted_at = Clock::get()?.unix_timestamp;
    badge.bump = ctx.bumps.badge;

    msg!("street-smack: paid {} lamports to winner on Solana L1", payout);
    Ok(())
}
