import { Address, Hex } from "viem";
import { z } from "zod";

import { DaimoLinkNote } from "./daimoLink";

export const zAddress = z
  .string()
  .regex(/^0x[0-9a-f]{40}$/i)
  .refine((s): s is Address => true);

export enum AddrLabel {
  Faucet = "team daimo",
  PaymentLink = "payment link",
  Paymaster = "fee",
  Coinbase = "coinbase",
}

/** Subset of EAccount for Daimo accounts, which always have a name. */
export interface DAccount {
  addr: Address;
  name: string;
}

export const zHex = z
  .string()
  .regex(/^0x[0-9a-f]*$/i)
  .refine((s): s is Hex => true);

export const zBigIntStr = z
  .string()
  .regex(/^[0-9]+$/i)
  .refine((s): s is BigIntStr => true);

export type BigIntStr = `${bigint}`;

export const zDollarStr = z
  .string()
  .regex(/^\d+(\.\d+)?$/i)
  .refine((s): s is DollarStr => true);

// TODO: use this in place of string / `${number}` everywhere applicable
export type DollarStr = `${number}`;

export const zTrackedRequest = z.object({
  requestId: zBigIntStr,
  amount: zBigIntStr,
});

export type TrackedRequest = z.infer<typeof zTrackedRequest>;

export interface TrackedNote extends DaimoLinkNote {
  opHash?: Hex;
}

export const zKeyData = z.object({
  pubKey: zHex, // DER Format
  addedAt: z.number(),
  slot: z.number(),
});

export type KeyData = z.infer<typeof zKeyData>;

export const zUserOpHex = z.object({
  sender: zAddress,
  nonce: zHex,
  initCode: zHex,
  callData: zHex,
  callGasLimit: zHex,
  verificationGasLimit: zHex,
  preVerificationGas: zHex,
  maxFeePerGas: zHex,
  maxPriorityFeePerGas: zHex,
  paymasterAndData: zHex,
  signature: zHex,
});

export type UserOpHex = z.infer<typeof zUserOpHex>;

export const zRecommendedExchange = z.object({
  cta: z.string(),
  url: z.string(),
});

export type RecommendedExchange = z.infer<typeof zRecommendedExchange>;

export const zEmailAddress = z.string().email();

export type EmailAddress = z.infer<typeof zEmailAddress>;

// From https://stackoverflow.com/a/29767609
const phoneNumberRegex = new RegExp(
  /^\+?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4,6}$/im
);

export const zPhoneNumber = z.string().regex(phoneNumberRegex);

export type PhoneNumber = z.infer<typeof zPhoneNumber>;

// Farcaster profile summary, linked to Daimo account via signature.
// The Daimo address is the nonce in the signed message.
export const zFarcasterLinkedAccount = z.object({
  // All LinkedAccounts will have (type, key).
  type: z.literal("farcaster"),
  id: z.string(),

  // Remaining fields are app-specific.
  fid: z.number(),
  custody: zAddress,
  message: z.string(),
  signature: zHex,
  verifications: z.array(zAddress),
  username: z.string().optional(),
  displayName: z.string().optional(),
  pfpUrl: z.string().optional(),
  bio: z.string().optional(),
});

export type FarcasterLinkedAccount = z.infer<typeof zFarcasterLinkedAccount>;

export const zLinkedAccount = zFarcasterLinkedAccount;

export type LinkedAccount = z.infer<typeof zLinkedAccount>;

// Represents a link from a Daimo account to an external account.
export const zProfileLink = z.object({
  addr: zAddress,
  linkedAccount: zLinkedAccount,
});

export type ProfileLink = z.infer<typeof zProfileLink>;
