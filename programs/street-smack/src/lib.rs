//! Street Smack — Real-time meme aura battle on Solana.
//! Powered by MagicBlock Ephemeral Rollups (ER) & Private ER (TEE).
//!
//! Four features make this a MagicBlock game rather than a standard web game:
//!
//! 1. **Private Ephemeral Rollup (PER) & Sealed Moves.** Traps and secret moves live
//!    in an account sealed with an ephemeral permission having zero members.
//!    The program inside the TEE enclave can read it; everyone outside (including
//!    adversaries and RPC nodes) is refused. No front-running bots!
//!
//! 2. **VRF Dealing and Sudden Death.** Verifiable randomness deals players into
//!    teams without collusion, and flips the sudden-death coin between tied teams.
//!
//! 3. **Session Keys.** One wallet signature seats you; every in-rollup emote attack
//!    is instant, gasless, and signless.
//!
//! 4. **Non-Delegated L1 Vault PDA.** The money never leaves Solana. Stakes sit in a
//!    vault PDA that is never delegated. Settlement happens on the base layer.

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

pub use instructions::*;
pub use state::*;

declare_id!("Smack11111111111111111111111111111111111111");

pub const FIGHT_SEED: &[u8] = b"fight";
pub const VAULT_SEED: &[u8] = b"vault";
pub const SEAT_SEED: &[u8] = b"seat";
pub const AMBUSH_SEED: &[u8] = b"ambush";
pub const QUEUE_SEED: &[u8] = b"queue";
pub const QUEUE_VAULT_SEED: &[u8] = b"qvault";
pub const BADGE_SEED: &[u8] = b"badge";

pub const PUBLIC_VALIDATOR: Pubkey = pubkey!("MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo");
pub const EPHEMERAL_RENT_BUFFER: u64 = 200_000;

#[ephemeral_rollups_sdk::anchor::ephemeral]
#[program]
pub mod street_smack {
    use super::*;

    /* ------------------------------------------------------------ Solana Base Layer */

    /// Open a fight room on Solana L1.
    pub fn create_fight(
        ctx: Context<CreateFight>,
        fight_id: u64,
        char_a: u8,
        char_b: u8,
        stake_lamports: u64,
    ) -> Result<()> {
        room::handle_create_fight(ctx, fight_id, char_a, char_b, stake_lamports)
    }

    /// Deposit stake into L1 Vault PDA and register session key.
    pub fn join_fight(ctx: Context<JoinFight>, fight_id: u64, preferred_team: u8) -> Result<()> {
        room::handle_join_fight(ctx, fight_id, preferred_team)
    }

    /* ------------------------------------------------------------ Matchmaking Line */

    /// Open a matchmaking queue for a given stake tier.
    pub fn open_queue(ctx: Context<OpenQueue>, stake: u64) -> Result<()> {
        queue::handle_open_queue(ctx, stake)
    }

    /* ------------------------------------------------------------ Rollup Hot Loop */

    /// Seal an ambush trap in Private ER with a zero-member permission.
    pub fn seal_ambush(ctx: Context<SealAmbush>, fight_id: u64) -> Result<()> {
        play::handle_seal_ambush(ctx, fight_id)
    }

    /// Cast an emote attack on the Ephemeral Rollup with sub-20ms latency and 0 gas.
    pub fn cast_emote(
        ctx: Context<CastEmote>,
        fight_id: u64,
        emote_id: u8,
        raw_damage: u32,
    ) -> Result<()> {
        play::handle_cast_emote(ctx, fight_id, emote_id, raw_damage)
    }

    /* ------------------------------------------------------------ Base Layer Settlement */

    /// Settle the pot from the non-delegated L1 Vault PDA and mint victory NFT trophy.
    pub fn claim_reward(ctx: Context<ClaimReward>, fight_id: u64) -> Result<()> {
        settle::handle_claim_reward(ctx, fight_id)
    }
}
