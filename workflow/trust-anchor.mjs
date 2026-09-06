import crypto from "node:crypto";

// This public key is the controller identity pinned in reviewed controller code.
// Its private key is deliberately not present in the repository or bootstrap
// state. A future, separately authorized administration task must provision a
// matching controller credential before live activation can be considered.
export const PINNED_CONTROLLER_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEADnuvxytb2I4tzwiZ4lkIUYiw4tMtFzZai+OoLIkthWk=
-----END PUBLIC KEY-----
`;

export const PINNED_CONTROLLER_KEY_FINGERPRINT =
  "2b083b22e59b767683b38c305683b69511ba80956e9ac1d6efe7bc9f331806a1";

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
