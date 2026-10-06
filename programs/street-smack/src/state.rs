use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum FightStatus {
    #[default]
    Scheduled = 0,
    Live = 1,
    Finished = 2,
    Cancelled = 3,
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
    pub const LEN: usize = 8 + // discriminator
        8 + // fight_id
        32 + // creator
        1 + // char_a
        1 + // char_b
        8 + // stake_lamports
        1 + // status
        4 + // aura_a
        4 + // aura_b
        8 + // damage_a
        8 + // damage_b
        8 + // tx_count
        8 + // seed
        1 + // winner
        4 + // player_count
        4 + // team_a_count
        4 + // team_b_count
        8 + // start_slot
        8 + // end_slot
        1 + // bump
        64; // reserved padding
}

#[account]
#[derive(Default)]
pub struct PlayerSeat {
    pub fight_id: u64,
    pub player: Pubkey,    // session key or wallet
    pub owner: Pubkey,     // primary wallet
    pub team: u8,          // 1 = A, 2 = B
    pub damage: u64,
    pub emotes: [u32; 4],  // 67, dab, griddy, quoicoubeh
    pub claimed: bool,
    pub bump: u8,
}

impl PlayerSeat {
    pub const LEN: usize = 8 + // discriminator
        8 + // fight_id
        32 + // player
        32 + // owner
        1 + // team
        8 + // damage
        16 + // emotes (4 * 4)
        1 + // claimed
        1 + // bump
        32; // reserved
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

#[account]
#[derive(Default)]
pub struct WinnerNFTBadge {
    pub fight_id: u64,
    pub owner: Pubkey,
    pub character: u8,
    pub rarity: u8,        // 0: Common, 1: Rare, 2: Epic, 3: Legendary, 4: Mythic
    pub damage_share_bps: u16, // basis points (e.g. 2450 = 24.50%)
    pub amount_won_lamports: u64,
    pub minted_at: i64,
    pub bump: u8,
}

impl WinnerNFTBadge {
    pub const LEN: usize = 8 + 8 + 32 + 1 + 1 + 2 + 8 + 8 + 1 + 32;
}
