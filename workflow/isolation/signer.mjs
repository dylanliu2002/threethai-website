import crypto from "node:crypto";
import { Signer } from "./interfaces.mjs";

function normalizedPayload(payload) {
  return Buffer.isBuffer(payload) ? payload : Buffer.from(String(payload));
}

export class ProtectedControllerSigner extends Signer {
  #adapter;

  constructor({ reference, fingerprint, adapter = null }) {
    super();
    if (!/^cng:\/\//.test(reference)) throw new Error("Controller signer must use a protected keystore reference.");
    if (!/^[0-9a-f]{64}$/.test(fingerprint)) throw new Error("Controller signer fingerprint is invalid.");
    if (adapter !== null && (typeof adapter.sign !== "function" || typeof adapter.verify !== "function")) {
      throw new Error("Signer adapter must provide sign and verify functions.");
    }
    this.referenceValue = reference;
    this.fingerprintValue = fingerprint;
    this.#adapter = adapter;
    Object.freeze(this);
  }

  get available() { return this.#adapter !== null; }
  get reference() { return this.referenceValue; }
  get fingerprint() { return this.fingerprintValue; }

  sign(payload) {
    if (!this.#adapter) throw new Error("PENDING_MACHINE_AUTHORIZATION: protected controller signer is unavailable.");
    return this.#adapter.sign(normalizedPayload(payload));
  }

  verify(payload, signature) {
    if (!this.#adapter) throw new Error("PENDING_MACHINE_AUTHORIZATION: protected controller signer is unavailable.");
    return this.#adapter.verify(normalizedPayload(payload), signature);
  }
}

export function createMemorySignerForTests({ privateKeyPem, publicKeyPem, reference = "cng://test/memory" }) {
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const fingerprint = crypto.createHash("sha256").update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
  return new ProtectedControllerSigner({
    reference,
    fingerprint,
    adapter: {
      sign: (payload) => crypto.sign(null, payload, privateKeyPem).toString("base64"),
      verify: (payload, signature) => crypto.verify(null, payload, publicKey, Buffer.from(signature, "base64")),
    },
  });
}
