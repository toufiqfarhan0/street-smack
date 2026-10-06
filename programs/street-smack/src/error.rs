use anchor_lang::prelude::*;

#[error_code]
pub enum SmackError {
    #[msg("This fight room is not taking players")]
    FightNotOpen,
    #[msg("This fight room is full")]
    FightFull,
    #[msg("You are already seated in this fight")]
    AlreadySeated,
    #[msg("A fight needs players on both teams")]
    TooFewPlayers,
    #[msg("The combat loop is not running")]
    NotLive,
    #[msg("That session key is not seated in this fight")]
    NotAPlayer,
    #[msg("Invalid emote ID")]
    InvalidEmote,
    #[msg("Not enough energy points to cast this emote")]
    NotEnoughPoints,
    #[msg("The fight is still live")]
    FightStillLive,
    #[msg("The fight has already finished")]
    FightFinished,
    #[msg("This fight has already settled payouts on Solana L1")]
    AlreadySettled,
    #[msg("Only winning team players can claim the victory share")]
    NotWinner,
    #[msg("Your reward has already been claimed")]
    AlreadyClaimed,
    #[msg("The winners passed do not match the winning team survivors")]
    WrongWinners,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Unauthorized signer for this seat")]
    UnauthorizedSigner,
    #[msg("The matchmaking queue is full")]
    QueueFull,
    #[msg("You are already waiting in the matchmaking line")]
    AlreadyWaiting,
    #[msg("You are not in the matchmaking queue")]
    NotWaiting,
    #[msg("A matchmaking deal is already out with the VRF oracle")]
    DealInFlight,
    #[msg("Not enough players are waiting in queue to deal a match")]
    NotEnoughWaiting,
    #[msg("The sudden-death coin flip has already been requested")]
    TiebreakerAlreadyRequested,
}
