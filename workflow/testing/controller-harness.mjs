import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createSignedGrantInternal, validateGrantAgainstAnchorInternal } from "../internal/authority-engine.mjs";
import { setActivationForAdministrationInternal } from "../internal/controller-state-engine.mjs";
import { publicKeyFingerprint } from "../trust-anchor.mjs";

// TEST-ONLY trust domain. Production modules never import this file and never
// accept this engine or its paths as authority.
const TEST_KEYS = crypto.generateKeyPairSync("ed25519");
const TEST_PUBLIC_KEY_PEM = TEST_KEYS.publicKey.export({ type: "spki", format: "pem" });
const TEST_PRIVATE_KEY_PEM = TEST_KEYS.privateKey.export({ type: "pkcs8", format: "pem" });
const TEST_FINGERPRINT = publicKeyFingerprint(TEST_PUBLIC_KEY_PEM);

export function testGrantPath(stateDirectory, taskKey) {
  return path.join(stateDirectory, "grants", `${taskKey}.json`);
}

export function createTestEngine({ repoRoot, stateDirectory, taskKey, grant }) {
  return createTestEngineWithAuthority({
    repoRoot, stateDirectory, taskKey, grant, authority: testAuthorityMaterial(),
  });
}

export function createTestEngineWithAuthority({ repoRoot, stateDirectory, taskKey, grant, authority }) {
  return Object.freeze({
    repoRoot,
    stateDirectory,
    publicKeyPem: authority.publicKeyPem,
    privateKeyPem: authority.privateKeyPem,
    keyFingerprint: authority.keyFingerprint,
    loadGrant: () => {
      const file = testGrantPath(stateDirectory, taskKey);
      return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : grant;
    },
  });
}

export function createTestGrant(contract, options) {
  return createTestGrantWithAuthority(contract, options, testAuthorityMaterial());
}

export function createTestGrantWithAuthority(contract, options, authority) {
  return createSignedGrantInternal(contract, {
    ...options,
    privateKeyPem: authority.privateKeyPem,
    publicKeyPem: authority.publicKeyPem,
  });
}

export function validateTestGrant(contract, grant, { repoRoot, verifyCard = true, now = new Date() } = {}) {
  return validateGrantAgainstAnchorInternal(contract, grant, {
    repoRoot, verifyCard, now,
    trustedPublicKeyPem: TEST_PUBLIC_KEY_PEM,
    trustedFingerprint: TEST_FINGERPRINT,
  });
}

export function setTestActivation(stateDirectory, active, options) {
  return setActivationForAdministrationInternal(stateDirectory, active, options);
}

export function testTrustAnchor() {
  return { publicKeyPem: TEST_PUBLIC_KEY_PEM, keyFingerprint: TEST_FINGERPRINT };
}

export function testAuthorityMaterial() {
  return {
    publicKeyPem: TEST_PUBLIC_KEY_PEM,
    privateKeyPem: TEST_PRIVATE_KEY_PEM,
    keyFingerprint: TEST_FINGERPRINT,
  };
}
