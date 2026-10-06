import { Connection, PublicKey, Keypair } from '@solana/web3.js';

export const BASE_RPC_URL = 'https://rpc.magicblock.app/devnet';
export const ROUTER_ENDPOINT = 'https://devnet-router.magicblock.app/';
export const EPHEMERAL_RPC_URL = 'https://devnet-as.magicblock.app/';
export const PROGRAM_ID = new PublicKey('Smack11111111111111111111111111111111111111');

export interface SessionKeyInfo {
  publicKey: PublicKey;
  keypair: Keypair;
}

export class SolanaService {
  public baseConnection: Connection;
  public erConnection: Connection;
  private sessionKey: SessionKeyInfo | null = null;

  constructor() {
    this.baseConnection = new Connection(BASE_RPC_URL, 'confirmed');
    this.erConnection = new Connection(EPHEMERAL_RPC_URL, 'confirmed');
    this.initSessionKey();
  }

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
        // regenerate
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

  // Derive Fight State PDA
  public getFightPda(fightId: number): [PublicKey, number] {
    const fightIdBuf = Buffer.alloc(8);
    fightIdBuf.writeBigUInt64LE(BigInt(fightId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('fight'), fightIdBuf],
      PROGRAM_ID
    );
  }

  // Derive Vault PDA (Never delegated; holds real SOL custody on L1)
  public getVaultPda(fightId: number): [PublicKey, number] {
    const fightIdBuf = Buffer.alloc(8);
    fightIdBuf.writeBigUInt64LE(BigInt(fightId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), fightIdBuf],
      PROGRAM_ID
    );
  }

  // Derive Player Seat PDA
  public getSeatPda(fightId: number, playerPubkey: PublicKey): [PublicKey, number] {
    const fightIdBuf = Buffer.alloc(8);
    fightIdBuf.writeBigUInt64LE(BigInt(fightId));
    return PublicKey.findProgramAddressSync(
      [Buffer.from('seat'), fightIdBuf, playerPubkey.toBuffer()],
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
