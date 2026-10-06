/**
 * Building instructions straight from the generated Anchor IDL.
 */

import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export interface IdlAccount {
  name: string;
  signer?: boolean;
  writable?: boolean;
  address?: string;
  pda?: { seeds: any[]; program?: { kind: string; value?: number[] } };
}

export interface IdlInstruction {
  name: string;
  discriminator: number[];
  accounts: IdlAccount[];
  args: { name: string; type: any }[];
}

export interface Idl {
  address: string;
  instructions: IdlInstruction[];
  accounts?: { name: string; discriminator: number[] }[];
}

export type Named = Record<string, PublicKey>;

export class Program {
  readonly id: PublicKey;

  constructor(private readonly idl: Idl) {
    this.id = new PublicKey(idl.address);
  }

  instruction(name: string): IdlInstruction {
    const ix = this.idl.instructions.find((i) => i.name === name);
    if (!ix) throw new Error(`no instruction "${name}" in the IDL`);
    return ix;
  }

  accountDiscriminator(name: string): Uint8Array {
    const a = this.idl.accounts?.find((x) => x.name === name);
    if (!a) throw new Error(`no account "${name}" in the IDL`);
    return Uint8Array.from(a.discriminator);
  }

  pda(seeds: (Uint8Array | Buffer)[], program = this.id): PublicKey {
    return PublicKey.findProgramAddressSync(seeds as Buffer[], program)[0];
  }

  build(name: string, named: Named, args: Uint8Array = new Uint8Array(0)): TransactionInstruction {
    const ix = this.instruction(name);

    const keys = ix.accounts.map((account) => {
      const pubkey = this.resolve(name, account, named);
      return {
        pubkey,
        isSigner: !!account.signer,
        isWritable: !!account.writable,
      };
    });

    const data = new Uint8Array(8 + args.length);
    data.set(ix.discriminator, 0);
    data.set(args, 8);

    return new TransactionInstruction({ programId: this.id, keys, data: Buffer.from(data) });
  }

  private resolve(ixName: string, account: IdlAccount, named: Named): PublicKey {
    if (named[account.name]) return named[account.name];
    if (account.address) return new PublicKey(account.address);

    if (account.pda) {
      const seeds = account.pda.seeds.map((seed) => this.seed(ixName, account, seed, named));
      return this.pda(seeds, this.pdaProgram(ixName, account, named));
    }

    throw new Error(
      `${ixName}: no address for account "${account.name}" - pass it in explicitly`,
    );
  }

  private pdaProgram(_ixName: string, account: IdlAccount, named: Named): PublicKey {
    const prog = account.pda?.program;
    if (!prog) return this.id;
    if (prog.kind === "const" && prog.value) return new PublicKey(Uint8Array.from(prog.value));
    if (prog.kind === "account") {
      const found = named[prog.value as unknown as string];
      if (found) return found;
    }
    return this.id;
  }

  private seed(ixName: string, account: IdlAccount, seed: any, named: Named): Buffer {
    if (seed.kind === "const") return Buffer.from(seed.value);
    if (seed.kind === "account") {
      const target = named[seed.path];
      if (target) return target.toBuffer();
      const parent = named[account.name];
      if (parent) return parent.toBuffer();
    }
    if (seed.kind === "arg") {
      const val = named[seed.path];
      if (val) return val.toBuffer();
    }
    throw new Error(`${ixName}.${account.name}: unresolved seed ${JSON.stringify(seed)}`);
  }
}

export function u64(n: bigint): Uint8Array {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(n);
  return Uint8Array.from(b);
}

export function u8(n: number): Uint8Array {
  return new Uint8Array([n]);
}

export function optionPubkey(k: PublicKey | null | undefined): Uint8Array {
  if (!k) return new Uint8Array([0]);
  const b = new Uint8Array(33);
  b[0] = 1;
  b.set(k.toBytes(), 1);
  return b;
}

export function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((acc, a) => acc + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}
