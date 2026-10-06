use anchor_lang::prelude::*;
use crate::state::{QueueState, QueueVault};
use crate::{QUEUE_SEED, QUEUE_VAULT_SEED};

#[derive(Accounts)]
#[instruction(stake: u64)]
pub struct OpenQueue<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = QueueState::LEN,
        seeds = [QUEUE_SEED, &stake.to_le_bytes()],
        bump
    )]
    pub queue: Account<'info, QueueState>,

    #[account(
        init,
        payer = payer,
        space = QueueVault::LEN,
        seeds = [QUEUE_VAULT_SEED, queue.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, QueueVault>,

    pub system_program: Program<'info, System>,
}

pub fn handle_open_queue(ctx: Context<OpenQueue>, stake: u64) -> Result<()> {
    let queue = &mut ctx.accounts.queue;
    queue.stake = stake;
    queue.count = 0;
    queue.awaiting_deal = false;
    queue.bump = ctx.bumps.queue;

    let vault = &mut ctx.accounts.vault;
    vault.queue = ctx.accounts.queue.key();
    vault.bump = ctx.bumps.vault;

    msg!("street-smack: matchmaking queue open for {} lamports stake", stake);
    Ok(())
}
