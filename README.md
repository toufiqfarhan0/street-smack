<div align="center">
  <img src="/public/img/street-smack-logo.png" alt="Street Smack Logo" width="160" onerror="this.src='/img/street-smack-logo.png'"/>
  
  # 🥊⚡ Street Smack
  
  **The real-time, gasless on-chain meme aura battle on Solana.**  
  *Powered by MagicBlock Ephemeral Rollups (ER) & Private ER (Intel TDX TEE).*

  [![Built for Solana Blitz v9](https://img.shields.io/badge/Solana_Blitz-v9_Submission-purple.svg)](https://build.magicblock.app/?stage=blitz)
  [![Powered by MagicBlock](https://img.shields.io/badge/Powered_by-MagicBlock_ER-blue.svg)](https://docs.magicblock.gg)
  [![Network: Solana Devnet](https://img.shields.io/badge/Network-Solana_Devnet-black.svg?logo=solana)](https://solana.com)
  [![Open Source](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/toufiqfarhan0/street-smack)
</div>

<br/>

**Street Smack** is a multiplayer on-chain party battle for Solana Seeker and desktop players. Two viral meme teams face off in an intense aura tug-of-war. Deposit SOL into the **non-delegated Solana L1 Vault PDA**, generate points in **10-second fast-paced mini-games**, and spam high-frequency emote attacks that drain the opposing team's aura bar.

Every emote is an on-chain transaction executed at **sub-20ms latency with 0 gas fees** inside a **MagicBlock Ephemeral Rollup**.

---

## 🏛️ The Four Architectural Pillars (Proven by Herd)

Street Smack integrates the four core features proven in the [Herd](file:///C:/Users/toufi/Desktop/Herd) architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SOLANA L1 BASE LAYER                            │
│                                                                        │
│   ┌────────────────────────┐              ┌────────────────────────┐  │
│   │  FightVault PDA        │              │  Winner Settlement     │  │
│   │  (Holds SOL Stakes;    │              │  (Pays out SOL from    │  │
│   │   NEVER delegated)     │              │   L1 Vault + Mints NFT)│  │
│   └───────────┬────────────┘              └───────────▲────────────┘  │
└───────────────┼───────────────────────────────────────┼────────────────┘
                │ Player Deposit (1 Signature)          │ Final State Commit
                ▼                                       │
┌───────────────────────────────────────────────────────┼────────────────┐
│               MAGICBLOCK EPHEMERAL ROLLUP (HOT LOOP)   │                │
│                                                       │                │
│   ┌────────────────────────┐              ┌───────────┴────────────┐  │
│   │  Session Key Signer    │              │  VRF Oracle            │  │
│   │  (Instant signless     │              │  (Verifiable coin flip │  │
│   │   0-gas emote attacks) │              │   sudden death tie)    │  │
│   └───────────┬────────────┘              └───────────▲────────────┘  │
│               ▼                                       │                │
│   ┌───────────────────────────────────────────────────┴────────────┐  │
│   │  Private ER Enclave (Intel TDX TEE Sealed Move)                │  │
│   │  Ephemeral permission with 0 members — Front-running refused!  │  │
│   └────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Private Ephemeral Rollups (PER) — Sealed Accounts with 0 Members
- **The Problem:** In high-speed on-chain PvP games, high-tier counter moves and trap activations sent over public RPCs can be front-run or sniffed by MEV bots before the round tick evaluates.
- **The Fix:** Traps and secret moves live in an account sealed with an ephemeral permission that has **zero members** (`is_private: true`, `members: []`). The program inside the Intel TDX enclave can evaluate it, but every human outside (including adversaries, hosts, and RPC nodes) is refused.

### 2. VRF — Verifiable On-Chain Randomness Oracle
- **Fair Matchmaking Queue:** Players buy a seat in a public line. MagicBlock's VRF oracle deal callback shuffles and seats players into Team A and Team B, preventing friend groups from colluding to stack a table.
- **Sudden-Death Tiebreaker Coin Flip:** When the 90-second battle clock expires with tied aura, the VRF oracle executes an on-chain coin flip to declare the sole victor.
- **NFT Loot Rarity:** Verifiable randomness decides the NFT trophy card tier (*Common*, *Rare*, *Epic*, *Legendary*).

### 3. Session Keys — One Signature to Seat; Signless 0-Gas Hot Loop
- One wallet signature deposits SOL to the Vault and registers a throwaway session key held in memory.
- Every emote attack (`6·7`, `Dab`, `Griddy`, `Quoicoubeh`) is signed by the session key directly inside the rollup.
- **Sub-20ms latency, zero gas fees, and zero wallet pop-up approval delays**.

### 4. Non-Delegated L1 Vault PDA — The Money Never Enters the Rollup
- Real money stakes sit in `FightVault` on base-layer Solana (`b"vault"`).
- The match state is delegated, but **the vault is never delegated**. The rollup cannot touch or move the funds.
- When a team's aura hits 0%, the rollup commits state back to Solana L1, and base-layer settlement disburses SOL directly to the winning wallets.

---

## 💻 Commands & Execution

### 1. Frontend Web App Commands

```bash
# Install dependencies
npm install

# Start local development server (runs at http://localhost:5173)
npm run dev

# Check TypeScript types without emitting
npx tsc --noEmit

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### 2. MagicBlock Devnet Test Scripts (`scripts/`)

```bash
# Navigate to scripts directory and install dependencies
cd scripts
npm install   # or: bun install

# 1. Run full live battle loop on Devnet & MagicBlock ER
bun run game.ts   # or: node game.ts
# Simulates 4 players, session keys, TEE sealed ambush, emote barrages, VRF tiebreaker, and L1 settlement!

# 2. Verify Private ER Sealed Account privacy
bun run check-sealed.ts
# Proves that 0-member ephemeral permission refuses outside callers and RPC nodes!

# 3. Verify VRF Matchmaking Queue dealing
bun run queue.ts
# Verifies on-chain oracle shuffle dealing players between Team Tung and Team Tralalero!
```

### 3. Anchor Smart Contract Commands

```bash
# Build Anchor program and compile IDL
anchor build

# Run unit tests across program modules
cargo test -p street-smack

# Verify Anchor program compilation
cargo check --manifest-path programs/street-smack/Cargo.toml
```

---

## 🌐 Application Routes & Views

When the app is running locally at `http://localhost:5173`, access all screens via hash routing:

| URL Route | Screen View | Description |
| :--- | :--- | :--- |
| **`/#/`** | **Home / Landing** | Retro arcade hero banner, feature selection cards (*Dashboard*, *Mon profil*, *Atelier*), and instant battle launch CTA. |
| **`/#/dashboard`** | **Match Dashboard** | Filterable match lobby (*Tous*, *En cours*, *À venir*, *Terminés*), stakes, pot counters, and live Rollup transaction metrics. |
| **`/#/characters`** | **Atelier Persos** | Showcase of all 5 meme fighters (*Tung Tung*, *Tralalero*, *Fraisita*, *Chocolato*, *RerA*), live sparring stage, and animation testers. |
| **`/#/play`** | **Normal Combat Mode** | Full arcade battle: Entry screen, Pre-fight 5x5 Mines diamond sweep, live dual-fighter aura clash, and interactive 3D foil booster card tear. |
| **`/#/player`** | **Smartphone Controller** | Mobile-first touch controller without the big stage: large mini-game, points counter, and rapid emote attack deck. |
| **`/#/screen`** | **Spectator Broadcast** | Fullscreen cinematic arena stage for live streams and projector setups with real-time vector bone rigs. |
| **`/#/profile`** | **Player Profile** | Winrate, cumulative damage, Solana L1 Vault payout balance, confirmed ER transaction counts, and NFT trophy gallery. |

---

## 🕹️ The 5 Cycling 10-Second Mini-Games
1. ⚡ **Speed Clicker (`clicker`):** Rapid tap speed challenge with combo multipliers up to 4x.
2. 🎯 **Precision Target (`target`):** Moving target precision clicks (+30 pts hit / -10 pts miss).
3. ⏱️ **Timing Gauge (`gauge`):** Stop the moving needle right in the golden bullseye for a +60 pts Jackpot.
4. 🃏 **Red or Black (`redblack`):** 3D flipping card prediction gamble (+25 pts / -20 pts).
5. 🎙️ **Make Some Noise (`noise`):** **Microphone-activated!** Shout into your mic to charge the red meter for +35 pts.

---

## 📦 Project Layout

```
street-smack/
├── Anchor.toml                     # Anchor workspace configuration
├── Cargo.toml                      # Root Rust workspace (resolver = "2")
├── package.json                    # Frontend dependencies (React, Vite)
├── index.html                      # HTML entry point with arcade typography
├── src/
│   ├── App.tsx                     # Top-level hash router
│   ├── index.css                   # Complete Street Aura retro-arcade CSS design system
│   ├── components/
│   │   ├── Header.tsx              # Top bar, mode switcher, sound toggle, wallet chip
│   │   ├── Home.tsx                # Hero landing page
│   │   ├── Dashboard.tsx           # Match list with live filters
│   │   ├── Characters.tsx          # 5-fighter atelier & live sparring stage
│   │   ├── Play.tsx                # Complete battle lifecycle (Entry, Mines, Fight, End)
│   │   ├── Booster.tsx             # Interactive 3D foil booster pack drag-to-tear
│   │   └── Profile.tsx             # Player stats, L1 payouts, NFT collection
│   └── engine/
│       ├── audio.ts                # Audio engine (67, dab, griddy, quoicoubeh)
│       ├── fighters.tsx            # Procedural vector biped bone-rigging & animation
│       ├── gameState.ts            # Central battle state manager & bots loop
│       ├── solana.ts               # MagicBlock ER, Session Keys, & PDA derivation
│       └── minigames/
│           ├── Mines.tsx           # 5x5 diamond & bomb pre-fight grid
│           ├── Clicker.tsx         # Speed tap mini-game
│           ├── Target.tsx          # Reaction target mini-game
│           ├── Gauge.tsx           # Timing dial needle mini-game
│           ├── RedBlack.tsx        # 3D flipping card gamble
│           └── Noise.tsx           # Microphone VU meter decibel game
├── programs/street-smack/
│   ├── Cargo.toml                  # Anchor program dependencies (ephemeral-rollups-sdk)
│   └── src/
│       ├── lib.rs                  # Program entrypoint & seeds
│       ├── error.rs                # Custom error codes
│       ├── state.rs                # FightState, PlayerSeat, FightVault, SealedAmbush
│       ├── instructions.rs         # Module exports
│       └── instructions/
│           ├── room.rs             # create_fight, join_fight on Solana L1
│           ├── play.rs             # seal_ambush (PER), cast_emote (Session Keys)
│           ├── queue.rs            # open_queue, enter_queue (VRF)
│           └── settle.rs           # claim_reward from L1 Vault PDA + NFT badge
└── scripts/
    ├── package.json                # Test runner dependencies
    ├── game.ts                     # Live battle simulation on Devnet & MagicBlock ER
    ├── check-sealed.ts             # Private ER sealed account verification
    ├── queue.ts                    # VRF matchmaking queue test
    └── lib/
        ├── chain.ts                # RPC, TEE authentication, and delegation
        ├── program.ts              # IDL instruction builder
        └── smack.ts                # Street Smack client SDK
```

---

## 📄 License

This project is open-source under the **MIT License**.
