/**
 * The Street Smack client: addresses, state decoding, and combat lifecycle.
 */

import { Keypair, PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { Program, concat, optionPubkey, u64, u8 } from "./program";

export const PERMISSION_PROGRAM = new PublicKey("ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1");
export const EPHEMERAL_QUEUE = new PublicKey("5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc");
export const BASE_QUEUE = new PublicKey("Cuj97ggrhhidhbu39TijNVqE74xvKJ69gDervRUXAxGh");

export enum FightStatus {
  Scheduled = 0,
  Live = 1,
  Finished = 2,
  Cancelled = 3,
}

export interface FightState {
  fightId: bigint;
  creator: PublicKey;
  charA: number;
  charB: number;
  stakeLamports: bigint;
  status: FightStatus;
  auraA: number;
  auraB: number;
  damageA: bigint;
  damageB: bigint;
  txCount: bigint;
  seed: bigint;
  winner: number;
  playerCount: number;
  teamACount: number;
  teamBCount: number;
}

export class StreetSmack {
  readonly program: Program;

  constructor(idl: any) {
    this.program = new Program(idl);
  }

  fight(fightId: bigint): PublicKey {
    return this.program.pda([Buffer.from("fight"), Buffer.from(u64(fightId))]);
  }

  vault(fightId: bigint): PublicKey {
    return this.program.pda([Buffer.from("vault"), Buffer.from(u64(fightId))]);
  }

  seat(fightId: bigint, player: PublicKey): PublicKey {
    return this.program.pda([Buffer.from("seat"), Buffer.from(u64(fightId)), player.toBuffer()]);
  }

  ambush(fightId: bigint, session: PublicKey): PublicKey {
    return this.program.pda([Buffer.from("ambush"), Buffer.from(u64(fightId)), session.toBuffer()]);
  }

  queue(stake: bigint): PublicKey {
    return this.program.pda([Buffer.from("queue"), Buffer.from(u64(stake))]);
  }

  badge(fightId: bigint, owner: PublicKey): PublicKey {
    return this.program.pda([Buffer.from("badge"), Buffer.from(u64(fightId)), owner.toBuffer()]);
  }

  createFight(
    creator: PublicKey,
    fightId: bigint,
    charA: number,
    charB: number,
    stakeLamports: bigint,
  ): TransactionInstruction {
    return this.program.build(
      "create_fight",
      { creator, fight: this.fight(fightId), vault: this.vault(fightId), system_program: SystemProgram.programId },
      concat(u64(fightId), u8(charA), u8(charB), u64(stakeLamports)),
    );
  }

  joinFight(
    fightId: bigint,
    payer: PublicKey,
    session: PublicKey,
    preferredTeam: number,
  ): TransactionInstruction {
    return this.program.build(
      "join_fight",
      {
        payer,
        player: session,
        fight: this.fight(fightId),
        vault: this.vault(fightId),
        seat: this.seat(fightId, session),
        system_program: SystemProgram.programId,
      },
      concat(u64(fightId), u8(preferredTeam)),
    );
  }

  castEmote(
    fightId: bigint,
    session: PublicKey,
    emoteId: number,
    rawDamage: number,
  ): TransactionInstruction {
    const rawBuf = Buffer.alloc(4);
    rawBuf.writeUInt32LE(rawDamage);

    return this.program.build(
      "cast_emote",
      {
        player: session,
        fight: this.fight(fightId),
        seat: this.seat(fightId, session),
      },
      concat(u64(fightId), u8(emoteId), Uint8Array.from(rawBuf)),
    );
  }

  claimReward(
    fightId: bigint,
    payer: PublicKey,
    owner: PublicKey,
    session: PublicKey,
  ): TransactionInstruction {
    return this.program.build(
      "claim_reward",
      {
        payer,
        owner,
        fight: this.fight(fightId),
        vault: this.vault(fightId),
        seat: this.seat(fightId, session),
        badge: this.badge(fightId, payer),
        system_program: SystemProgram.programId,
      },
      u64(fightId),
    );
  }
}
