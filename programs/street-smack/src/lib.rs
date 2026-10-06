use anchor_lang::prelude::*;
use anchor_lang::system_program;

pub mod errors;
pub mod state;

use errors::*;
use state::*;

declare_id!("Smack11111111111111111111111111111111111111");

#[program]
pub mod street_smack {
    use super::*;

    /// 1. Initialize a new fight on Solana L1 (or Ephemeral Rollup)
    pub fn create_fight(
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
        fight.aura_a = 10_000; // 100%
        fight.aura_b = 10_000; // 100%
        fight.damage_a = 0;
        fight.damage_b = 0;
        fight.tx_count = 0;
        fight.seed = 0;
        fight.winner = 0;
        fight.player_count = 0;
        fight.team_a_count = 0;
        fight.team_b_count = 0;
        fight.start_slot = 0;
        fight.end_slot = 0;
        fight.bump = ctx.bumps.fight;

        let vault = &mut ctx.accounts.vault;
        vault.fight_id = fight_id;
        vault.total_staked = 0;
        vault.fee_collected = 0;
        vault.bump = ctx.bumps.vault;

        emit!(FightCreatedEvent {
            fight_id,
            creator: ctx.accounts.creator.key(),
            char_a,
            char_b,
            stake_lamports,
        });

        Ok(())
    }

    /// 2. Join a fight by depositing stake into the L1 Vault PDA
    pub fn join_fight(ctx: Context<JoinFight>, fight_id: u64, preferred_team: u8) -> Result<()> {
        let fight = &mut ctx.accounts.fight;
        require!(
            fight.status == FightStatus::Scheduled || fight.status == FightStatus::Live,
            SmackError::FightNotJoinable
        );

        let stake = fight.stake_lamports;
        if stake > 0 {
            // Transfer lamports from payer to Vault PDA
            system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    system_program::Transfer {
                        from: ctx.accounts.payer.to_account_info(),
                        to: ctx.accounts.vault.to_account_info(),
                    },
                ),
                stake,
            )?;
            ctx.accounts.vault.total_staked = ctx
                .accounts
                .vault
                .total_staked
                .checked_add(stake)
                .ok_or(SmackError::MathOverflow)?;
        }

        // Determine assigned team
        let assigned_team = if preferred_team == 1 || preferred_team == 2 {
            preferred_team
        } else if fight.team_a_count <= fight.team_b_count {
            1
        } else {
            2
        };

        if assigned_team == 1 {
            fight.team_a_count = fight.team_a_count.saturating_add(1);
        } else {
            fight.team_b_count = fight.team_b_count.saturating_add(1);
        }
        fight.player_count = fight.player_count.saturating_add(1);

        let seat = &mut ctx.accounts.seat;
        seat.fight_id = fight_id;
        seat.player = ctx.accounts.player.key(); // session key or player pubkey
        seat.owner = ctx.accounts.payer.key();   // owner wallet
        seat.team = assigned_team;
        seat.damage = 0;
        seat.emotes = [0, 0, 0, 0];
        seat.claimed = false;
        seat.bump = ctx.bumps.seat;

        emit!(PlayerJoinedEvent {
            fight_id,
            player: ctx.accounts.player.key(),
            owner: ctx.accounts.payer.key(),
            team: assigned_team,
        });

        Ok(())
    }

    /// 3. Start fight countdown
    pub fn start_fight(ctx: Context<StartFight>, _fight_id: u64, seed: u64) -> Result<()> {
        let fight = &mut ctx.accounts.fight;
        require!(
            fight.status == FightStatus::Scheduled,
            SmackError::InvalidFightState
        );
        fight.status = FightStatus::Live;
        fight.seed = seed;
        fight.start_slot = Clock::get()?.slot;

        emit!(FightStartedEvent {
            fight_id: fight.fight_id,
            seed,
            start_slot: fight.start_slot,
        });

        Ok(())
    }

    /// 4. Hot Loop on Ephemeral Rollup: Cast an emote with Session Key (0 Gas, Sub-20ms!)
    pub fn cast_emote(
        ctx: Context<CastEmote>,
        _fight_id: u64,
        emote_id: u8,
        raw_damage: u32,
    ) -> Result<()> {
        let fight = &mut ctx.accounts.fight;
        require!(fight.status == FightStatus::Live, SmackError::InvalidFightState);

        let seat = &mut ctx.accounts.seat;
        require!(seat.team == 1 || seat.team == 2, SmackError::PlayerNotInFight);

        require!(emote_id < 4, SmackError::InvalidEmote);

        // Update player stats
        seat.damage = seat.damage.saturating_add(raw_damage as u64);
        seat.emotes[emote_id as usize] = seat.emotes[emote_id as usize].saturating_add(1);

        // Damage calculation (target is opposing team)
        fight.tx_count = fight.tx_count.saturating_add(1);

        let damage_drain = (raw_damage * 35).min(10_000); // scaled aura drain

        if seat.team == 1 {
            // Team A attacks Team B
            fight.damage_b = fight.damage_b.saturating_add(raw_damage as u64);
            if fight.aura_b <= damage_drain {
                fight.aura_b = 0;
                fight.status = FightStatus::Finished;
                fight.winner = 1; // Team A wins
                fight.end_slot = Clock::get()?.slot;
            } else {
                fight.aura_b = fight.aura_b.saturating_sub(damage_drain);
            }
        } else {
            // Team B attacks Team A
            fight.damage_a = fight.damage_a.saturating_add(raw_damage as u64);
            if fight.aura_a <= damage_drain {
                fight.aura_a = 0;
                fight.status = FightStatus::Finished;
                fight.winner = 2; // Team B wins
                fight.end_slot = Clock::get()?.slot;
            } else {
                fight.aura_a = fight.aura_a.saturating_sub(damage_drain);
            }
        }

        emit!(EmoteCastedEvent {
            fight_id: fight.fight_id,
            player: seat.player,
            team: seat.team,
            emote_id,
            raw_damage,
            aura_a: fight.aura_a,
            aura_b: fight.aura_b,
            winner: fight.winner,
        });

        Ok(())
    }

    /// 5. Conclude match when timer expires or aura hits 0
    pub fn finish_fight(ctx: Context<FinishFight>, _fight_id: u64, forced_winner: u8) -> Result<()> {
        let fight = &mut ctx.accounts.fight;
        require!(fight.status == FightStatus::Live, SmackError::InvalidFightState);

        fight.status = FightStatus::Finished;
        fight.end_slot = Clock::get()?.slot;

        if fight.winner == 0 {
            if forced_winner != 0 {
                fight.winner = forced_winner;
            } else if fight.aura_a > fight.aura_b {
                fight.winner = 1;
            } else if fight.aura_b > fight.aura_a {
                fight.winner = 2;
            } else {
                fight.winner = 1; // Tiebreaker
            }
        }

        emit!(FightFinishedEvent {
            fight_id: fight.fight_id,
            winner: fight.winner,
            tx_count: fight.tx_count,
            end_slot: fight.end_slot,
        });

        Ok(())
    }

    /// 6. Settle and claim rewards on Solana L1 + mint victory NFT badge
    pub fn claim_reward(ctx: Context<ClaimReward>, fight_id: u64) -> Result<()> {
        let fight = &ctx.accounts.fight;
        require!(fight.status == FightStatus::Finished, SmackError::FightNotFinished);

        let seat = &mut ctx.accounts.seat;
        require!(!seat.claimed, SmackError::AlreadyClaimed);
        require!(seat.team == fight.winner, SmackError::NotWinner);

        let vault = &mut ctx.accounts.vault;
        let total_staked = vault.total_staked;

        // Winning team calculation
        let winning_team_count = if fight.winner == 1 {
            fight.team_a_count.max(1)
        } else {
            fight.team_b_count.max(1)
        };

        // Platform fee: 5%
        let platform_fee = total_staked.checked_mul(5).unwrap_or(0) / 100;
        let distributable = total_staked.saturating_sub(platform_fee);
        let payout = distributable / (winning_team_count as u64);

        if payout > 0 {
            **vault.to_account_info().try_borrow_mut_lamports()? = vault
                .to_account_info()
                .lamports()
                .checked_sub(payout)
                .ok_or(SmackError::MathOverflow)?;

            **ctx.accounts.payer.to_account_info().try_borrow_mut_lamports()? = ctx
                .accounts
                .payer
                .to_account_info()
                .lamports()
                .checked_add(payout)
                .ok_or(SmackError::MathOverflow)?;
        }

        seat.claimed = true;

        // Compute damage share basis points
        let total_team_damage = if fight.winner == 1 {
            fight.damage_b.max(1)
        } else {
            fight.damage_a.max(1)
        };
        let share_bps = ((seat.damage * 10_000) / total_team_damage).min(10_000) as u16;

        // Determine NFT badge rarity: Common (0), Rare (1), Epic (2), Legendary (3), Mythic (4)
        let rarity = if share_bps >= 4000 {
            4 // Mythic: >= 40% of team damage
        } else if share_bps >= 2500 {
            3 // Legendary: >= 25%
        } else if share_bps >= 1500 {
            2 // Epic: >= 15%
        } else if share_bps >= 800 {
            1 // Rare: >= 8%
        } else {
            0 // Common
        };

        let badge = &mut ctx.accounts.badge;
        badge.fight_id = fight_id;
        badge.owner = ctx.accounts.payer.key();
        badge.character = if fight.winner == 1 { fight.char_a } else { fight.char_b };
        badge.rarity = rarity;
        badge.damage_share_bps = share_bps;
        badge.amount_won_lamports = payout;
        badge.minted_at = Clock::get()?.unix_timestamp;
        badge.bump = ctx.bumps.badge;

        emit!(RewardClaimedEvent {
            fight_id,
            owner: ctx.accounts.payer.key(),
            payout,
            rarity,
            share_bps,
        });

        Ok(())
    }
}

/* ---------------- Contexts ---------------- */

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct CreateFight<'info> {
    #[account(
        init,
        payer = creator,
        space = FightState::LEN,
        seeds = [b"fight", fight_id.to_le_bytes().as_ref()],
        bump
    )]
    pub fight: Account<'info, FightState>,

    #[account(
        init,
        payer = creator,
        space = FightVault::LEN,
        seeds = [b"vault", fight_id.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Account<'info, FightVault>,

    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct JoinFight<'info> {
    #[account(
        mut,
        seeds = [b"fight", fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,

    #[account(
        mut,
        seeds = [b"vault", fight_id.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, FightVault>,

    #[account(
        init,
        payer = payer,
        space = PlayerSeat::LEN,
        seeds = [b"seat", fight_id.to_le_bytes().as_ref(), player.key().as_ref()],
        bump
    )]
    pub seat: Account<'info, PlayerSeat>,

    /// CHECK: Session key or player account
    pub player: AccountInfo<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct StartFight<'info> {
    #[account(
        mut,
        seeds = [b"fight", fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct CastEmote<'info> {
    #[account(
        mut,
        seeds = [b"fight", fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,

    #[account(
        mut,
        seeds = [b"seat", fight_id.to_le_bytes().as_ref(), player.key().as_ref()],
        bump = seat.bump
    )]
    pub seat: Account<'info, PlayerSeat>,

    /// Signer can be session key or user wallet
    pub player: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct FinishFight<'info> {
    #[account(
        mut,
        seeds = [b"fight", fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(fight_id: u64)]
pub struct ClaimReward<'info> {
    #[account(
        seeds = [b"fight", fight_id.to_le_bytes().as_ref()],
        bump = fight.bump
    )]
    pub fight: Account<'info, FightState>,

    #[account(
        mut,
        seeds = [b"vault", fight_id.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, FightVault>,

    #[account(
        mut,
        seeds = [b"seat", fight_id.to_le_bytes().as_ref(), seat.player.as_ref()],
        bump = seat.bump,
        has_one = owner @ SmackError::UnauthorizedSigner
    )]
    pub seat: Account<'info, PlayerSeat>,

    #[account(
        init,
        payer = payer,
        space = WinnerNFTBadge::LEN,
        seeds = [b"badge", fight_id.to_le_bytes().as_ref(), payer.key().as_ref()],
        bump
    )]
    pub badge: Account<'info, WinnerNFTBadge>,

    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: matched via has_one on seat
    pub owner: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

/* ---------------- Events ---------------- */

#[event]
pub struct FightCreatedEvent {
    pub fight_id: u64,
    pub creator: Pubkey,
    pub char_a: u8,
    pub char_b: u8,
    pub stake_lamports: u64,
}

#[event]
pub struct PlayerJoinedEvent {
    pub fight_id: u64,
    pub player: Pubkey,
    pub owner: Pubkey,
    pub team: u8,
}

#[event]
pub struct FightStartedEvent {
    pub fight_id: u64,
    pub seed: u64,
    pub start_slot: u64,
}

#[event]
pub struct EmoteCastedEvent {
    pub fight_id: u64,
    pub player: Pubkey,
    pub team: u8,
    pub emote_id: u8,
    pub raw_damage: u32,
    pub aura_a: u32,
    pub aura_b: u32,
    pub winner: u8,
}

#[event]
pub struct FightFinishedEvent {
    pub fight_id: u64,
    pub winner: u8,
    pub tx_count: u64,
    pub end_slot: u64,
}

#[event]
pub struct RewardClaimedEvent {
    pub fight_id: u64,
    pub owner: Pubkey,
    pub payout: u64,
    pub rarity: u8,
    pub share_bps: u16,
}
