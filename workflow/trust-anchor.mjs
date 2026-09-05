import crypto from "node:crypto";

// This public key is the controller identity pinned in reviewed controller code.
// Its private key is deliberately not present in the repository or bootstrap
// state. A future, separately authorized administration task must provision a
// matching controller credential before live activation can be considered.
export const PINNED_CONTROLLER_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAzVfk3s1jkjyGDXUvf3z/IWt3Z+jp/9pjSV0+ctl3QS4=
-----END PUBLIC KEY-----
`;

export const PINNED_CONTROLLER_KEY_FINGERPRINT =
  "61c82a021e0af9d63fe1e714132beae2f266547221fa9c11e564d003f301196c";

export function publicKeyFingerprint(publicKeyPem) {
  const der = crypto.createPublicKey(publicKeyPem).export({ type: "spki", format: "der" });
  return crypto.createHash("sha256").update(der).digest("hex");
}

if (publicKeyFingerprint(PINNED_CONTROLLER_PUBLIC_KEY_PEM)
  !== PINNED_CONTROLLER_KEY_FINGERPRINT) {
  throw new Error("Pinned controller trust-anchor fingerprint is invalid.");
}

export function verifyPinnedSignature(payload, signature) {
  return crypto.verify(
    null,
    Buffer.from(payload),
    PINNED_CONTROLLER_PUBLIC_KEY_PEM,
    Buffer.from(signature, "base64"),
  );
}
