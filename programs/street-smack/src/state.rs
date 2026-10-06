use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug, Default)]
pub enum FightStatus {
    #[default]
    Scheduled,
    Live,
    Finished,
    Cancelled,
}

#[account]
#[derive(Default)]
pub struct FightState {
    pub fight_id: u64,
    pub creator: Pubkey,
    pub char_a: u8,
    pub char_b: u8,
    pub stake_lamports: u64,
    pub status: FightStatus,
    pub aura_a: u32,       // 10000 = 100.00%
    pub aura_b: u32,       // 10000 = 100.00%
    pub damage_a: u64,     // damage taken by A
    pub damage_b: u64,     // damage taken by B
    pub tx_count: u64,
    pub seed: u64,
    pub winner: u8,        // 0 = None, 1 = A, 2 = B
    pub player_count: u32,
    pub team_a_count: u32,
    pub team_b_count: u32,
    pub start_slot: u64,
    pub end_slot: u64,
    pub bump: u8,
}

impl FightState {
    pub const LEN: usize = 8 + 8 + 32 + 1 + 1 + 8 + 1 + 4 + 4 + 8 + 8 + 8 + 8 + 1 + 4 + 4 + 4 + 8 + 8 + 1 + 64;
}

#[account]
#[derive(Default)]
pub struct PlayerSeat {
    pub fight_id: u64,
    pub player: Pubkey,    // session key
    pub owner: Pubkey,     // primary wallet
    pub team: u8,          // 1 = A, 2 = B
    pub damage: u64,
    pub emotes: [u32; 4],  // 67, dab, griddy, quoicoubeh
    pub claimed: bool,
    pub bump: u8,
}

impl PlayerSeat {
    pub const LEN: usize = 8 + 8 + 32 + 32 + 1 + 8 + 16 + 1 + 1 + 32;
}

#[account]
#[derive(Default)]
pub struct FightVault {
    pub fight_id: u64,
    pub total_staked: u64,
    pub fee_collected: u64,
    pub bump: u8,
}

impl FightVault {
    pub const LEN: usize = 8 + 8 + 8 + 8 + 1 + 32;
}

/// Sealed Ambush PDA for Private ER (Intel TDX TEE). Sealed with 0-member ephemeral permission.
#[account]
#[derive(Default)]
pub struct SealedAmbush {
    pub fight_id: u64,
    pub session: Pubkey,
    pub trap_type: u8,
    pub damage_multiplier: u8,
    pub executed: bool,
    pub bump: u8,
}

impl SealedAmbush {
    pub const LEN: usize = 8 + 8 + 32 + 1 + 1 + 1 + 1 + 32;
}

#[account]
#[derive(Default)]
pub struct QueueState {
    pub stake: u64,
    pub count: u32,
    pub awaiting_deal: bool,
    pub bump: u8,
}

impl QueueState {
    pub const LEN: usize = 8 + 8 + 4 + 1 + 1 + 32;
}

#[account]
#[derive(Default)]
pub struct QueueVault {
    pub queue: Pubkey,
    pub bump: u8,
}

impl QueueVault {
    pub const LEN: usize = 8 + 32 + 1 + 32;
}

#[account]
#[derive(Default)]
pub struct WinnerNFTBadge {
    pub fight_id: u64,
    pub owner: Pubkey,
    pub character: u8,
    pub rarity: u8,        // 0: Common, 1: Rare, 2: Epic, 3: Legendary, 4: Mythic
    pub damage_share_bps: u16, // basis points
    pub amount_won_lamports: u64,
    pub minted_at: i64,
    pub bump: u8,
}

impl WinnerNFTBadge {
    pub const LEN: usize = 8 + 8 + 32 + 1 + 1 + 2 + 8 + 8 + 1 + 32;
}
