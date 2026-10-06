/**
 * Talking to Solana and to a MagicBlock Ephemeral Rollup.
 *
 * Three endpoints:
 *   base   - Solana Devnet (fights, stakes custody in L1 Vault PDA, settlement).
 *   router - answers "is this account delegated, and to which rollup?"
 *   rollup - the fqdn the router hands back. Everything mid-game (0 gas hot loop).
 */

import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import * as nacl from "tweetnacl";
import bs58 from "bs58";
import * as fs from "fs";

export const BASE_RPC = "https://rpc.magicblock.app/devnet";
export const ROUTER_RPC = "https://devnet-router.magicblock.app/";

/** MagicBlock's devnet TEE validator — Intel TDX hardware-enforced private rollup */
export const TEE_VALIDATOR = new PublicKey("MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo");

export async function rpc(url: string, method: string, params: unknown): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await response.json();
  if (body.error) throw new Error(`${method}: ${body.error.message ?? JSON.stringify(body.error)}`);
  return body.result;
}

export interface Delegation {
  isDelegated: boolean;
  fqdn?: string;
  authority?: string;
  owner?: string;
}

export async function delegationOf(account: PublicKey): Promise<Delegation> {
  const r = await rpc(ROUTER_RPC, "getDelegationStatus", [account.toBase58()]);
  return {
    isDelegated: !!r?.isDelegated,
    fqdn: r?.fqdn,
    authority: r?.delegationRecord?.authority,
    owner: r?.delegationRecord?.owner,
  };
}

/** Raw account data, or null when the endpoint refuses to show it (e.g. sealed accounts) */
export async function accountData(
  url: string,
  key: PublicKey,
  token?: string,
): Promise<Uint8Array | null> {
  const value = await rpc(authed(url, token), "getAccountInfo", [
    key.toBase58(),
    { encoding: "base64", commitment: "confirmed" },
  ]);
  if (!value?.value) return null;
  return Uint8Array.from(Buffer.from(value.value.data[0], "base64"));
}

export async function lamportsOf(url: string, key: PublicKey): Promise<number | null> {
  const value = await rpc(url, "getAccountInfo", [
    key.toBase58(),
    { encoding: "base64", commitment: "confirmed" },
  ]);
  return value?.value?.lamports ?? null;
}

function authed(url: string, token?: string): string {
  const base = url.replace(/\/$/, "");
  return token ? `${base}/?token=${encodeURIComponent(token)}` : base;
}

/**
 * Prove to a private rollup which key is asking.
 * Used to verify 0-member sealed accounts refuse readers.
 */
export async function authenticate(fqdn: string, signer: Keypair): Promise<string> {
  const base = fqdn.replace(/\/$/, "");
  const pubkey = signer.publicKey.toBase58();

  const ch = await (await fetch(`${base}/auth/challenge?pubkey=${pubkey}`)).json();
  if (typeof ch.challenge !== "string") throw new Error("no challenge from the rollup");

  const signature = nacl.sign.detached(new TextEncoder().encode(ch.challenge), signer.secretKey);
  const login = await (
    await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pubkey,
        challenge: ch.challenge,
        signature: bs58.encode(signature),
      }),
    })
  ).json();

  if (typeof login.token !== "string") throw new Error("login refused by the rollup");
  return login.token;
}

export async function send(url: string, tx: Transaction, signers: Keypair[]): Promise<string> {
  const conn = new Connection(url, "confirmed");
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.sign(...signers);
  return conn.sendRawTransaction(tx.serialize());
}

export async function confirm(url: string, sig: string): Promise<void> {
  const conn = new Connection(url, "confirmed");
  const latest = await conn.getLatestBlockhash("confirmed");
  await conn.confirmTransaction({ signature: sig, ...latest }, "confirmed");
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function loadKeypair(path: string): Keypair {
  try {
    const raw = fs.readFileSync(path, "utf-8");
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(raw)));
  } catch {
    return Keypair.generate();
  }
}
