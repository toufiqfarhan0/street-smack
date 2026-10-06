use anchor_lang::prelude::*;

#[error_code]
pub enum SmackError {
    #[msg("Fight is not open for joining")]
    FightNotJoinable,
    #[msg("Fight is already full")]
    FightFull,
    #[msg("Fight has already started or ended")]
    InvalidFightState,
    #[msg("Player is not in this fight")]
    PlayerNotInFight,
    #[msg("Invalid emote ID")]
    InvalidEmote,
    #[msg("Aura already depleted")]
    AuraDepleted,
    #[msg("Fight not finished yet")]
    FightNotFinished,
    #[msg("Player did not win this fight")]
    NotWinner,
    #[msg("Reward already claimed")]
    AlreadyClaimed,
    #[msg("Arithmetic overflow")]
    MathOverflow,
    #[msg("Unauthorized signer for session")]
    UnauthorizedSigner,
}
