import { SecretStore } from "./interfaces.mjs";

const REFERENCE = /^(?:windows-credential-manager|cng):\/\/[A-Za-z0-9][A-Za-z0-9._/-]{0,255}$/;

export class ControllerSecretStore extends SecretStore {
  #resolver;

  constructor({ resolver = null } = {}) {
    super();
    if (resolver !== null && typeof resolver !== "function") throw new Error("Secret resolver must be a function.");
    this.#resolver = resolver;
  }

  describe(reference) {
    if (!REFERENCE.test(reference)) throw new Error("Secret reference is invalid or path-backed.");
    return Object.freeze({ reference, available: this.#resolver !== null, exportable_to_worker: false });
  }

  withSecret(reference, consumer) {
    this.describe(reference);
    if (typeof consumer !== "function") throw new Error("Secret consumer must be a function.");
    if (!this.#resolver) throw new Error("PENDING_MACHINE_AUTHORIZATION: controller secret store is unavailable.");
    const value = this.#resolver(reference);
    if (typeof value !== "string" || value.length === 0) throw new Error("Secret store returned no value.");
    try {
      return consumer(value);
    } finally {
      // JavaScript strings cannot be zeroed. The value is closure-scoped and is
      // never returned, logged, persisted, or included in a worker environment.
    }
  }
}
