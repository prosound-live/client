import { toBytes, toHex } from "viem";
import { getPublicKey } from "@noble/secp256k1";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

export async function GET() {
  if (!PRIVATE_KEY) {
    return new Response("PRIVATE_KEY is not set", { status: 500 });
  }

  // Ensure the private key has 0x prefix for viem's toBytes
  const privateKeyHex = PRIVATE_KEY.startsWith("0x")
    ? PRIVATE_KEY
    : `0x${PRIVATE_KEY}`;

  const privateKeyBytes = toBytes(privateKeyHex);
  const publicKeyBytes = getPublicKey(privateKeyBytes, false); // false = uncompressed
  const publicKey = toHex(publicKeyBytes).slice(2);

  return Response.json({ publicKey });
}
