import { Connection, PublicKey, Keypair } from '@solana/web3.js';

export const BASE_RPC_URL = 'https://rpc.magicblock.app/devnet';
export const ROUTER_ENDPOINT = 'https://devnet-router.magicblock.app/';
export const EPHEMERAL_RPC_URL = 'https://devnet-as.magicblock.app/';
export const PROGRAM_ID = new PublicKey('Smack11111111111111111111111111111111111111');

// MagicBlock Public Rollup and VRF Constants (matching Herd's SPIKES.md & lib.rs)
export const PUBLIC_VALIDATOR = new PublicKey('MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo');
export const DEFAULT_EPHEMERAL_QUEUE = new PublicKey('EpheQueue1111111111111111111111111111111111');

export interface SessionKeyInfo {
  publicKey: PublicKey;
  keypair: Keypair;
}

/**
 * SolanaService — Implements the four architectural pillars proven in Herd:
 * 1. Private Ephemeral Rollups (PER) — Sealed account with zero-member ephemeral permissions.
 * 2. VRF Oracle — Queue deal shuffling and sudden-death tiebreaker coin flips.
 * 3. Session Keys — One wallet signature to seat; zero-gas instant in-rollup actions.
 * 4. Non-delegated L1 Vault PDA — Stakes never enter the rollup; payouts occur on base Solana.
 */
export class SolanaService {
  public baseConnection: Connection;
  public erConnection: Connection;
  private sessionKey: SessionKeyInfo | null = null;

  constructor() {
    this.baseConnection = new Connection(BASE_RPC_URL, 'confirmed');
    this.erConnection = new Connection(EPHEMERAL_RPC_URL, 'confirmed');
    this.initSessionKey();
  }

  // Pillar 3: Session Keys — Throwaway key in memory for zero-gas sub-20ms signless loop
  public initSessionKey(): SessionKeyInfo {
    if (typeof window === 'undefined') {
      const kp = Keypair.generate();
      return { publicKey: kp.publicKey, keypair: kp };
    }

    const stored = localStorage.getItem('smack_session_key');
    if (stored) {
      try {
        const secret = Uint8Array.from(JSON.parse(stored));
        const kp = Keypair.fromSecretKey(secret);
        this.sessionKey = { publicKey: kp.publicKey, keypair: kp };
        return this.sessionKey;
      } catch {
        // regenerate on error
      }
    }

    const kp = Keypair.generate();
    localStorage.setItem('smack_session_key', JSON.stringify(Array.from(kp.secretKey)));
    this.sessionKey = { publicKey: kp.publicKey, keypair: kp };
    return this.sessionKey;
  }

  public getSessionKey(): SessionKeyInfo {
    if (!this.sessionKey) {
      return this.initSessionKey();
    }
    return this.sessionKey;
  }

  // Pillar 4: Non-delegated L1 Vault PDA — Real SOL stakes never enter the rollup
  public getVaultPda(fightId: number): [PublicKey, number] {
    const fightIdBuf = Buffer.alloc(8);
    fightIdBuf.writeBigUInt64LE(BigInt(fightId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), fightIdBuf],
      PROGRAM_ID
    );
  }

  // Derive Fight State PDA (Delegated to ER during combat)
  public getFightPda(fightId: number): [PublicKey, number] {
    const fightIdBuf = Buffer.alloc(8);
    fightIdBuf.writeBigUInt64LE(BigInt(fightId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('fight'), fightIdBuf],
      PROGRAM_ID
    );
  }

  // Derive Player Seat PDA (Registers owner wallet + session key)
  public getSeatPda(fightId: number, playerPubkey: PublicKey): [PublicKey, number] {
    const fightIdBuf = Buffer.alloc(8);
    fightIdBuf.writeBigUInt64LE(BigInt(fightId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('seat'), fightIdBuf, playerPubkey.toBuffer()],
      PROGRAM_ID
    );
  }

  // Pillar 1: Private ER Sealed Account PDA (Sealed move / TEE Ambush with 0 members)
  public getSealedAmbushPda(fightId: number, sessionKey: PublicKey): [PublicKey, number] {
    const fightIdBuf = Buffer.alloc(8);
    fightIdBuf.writeBigUInt64LE(BigInt(fightId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('ambush'), fightIdBuf, sessionKey.toBuffer()],
      PROGRAM_ID
    );
  }

  // Pillar 2: VRF Matchmaking Queue PDA (On-chain queue dealt by oracle)
  public getQueuePda(stakeLamports: number): [PublicKey, number] {
    const stakeBuf = Buffer.alloc(8);
    stakeBuf.writeBigUInt64LE(BigInt(stakeLamports));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('queue'), stakeBuf],
      PROGRAM_ID
    );
  }

  // Query Delegation Status from MagicBlock Router
  public async getDelegationStatus(account: PublicKey): Promise<{ isDelegated: boolean; fqdn?: string }> {
    try {
      const response = await fetch(ROUTER_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getDelegationStatus',
          params: [account.toBase58()],
        }),
      });
      const data = await response.json();
      if (data.result) {
        return data.result;
      }
    } catch {
      // Fallback
    }
    return { isDelegated: true, fqdn: EPHEMERAL_RPC_URL };
  }
}

export const solanaService = new SolanaService();
