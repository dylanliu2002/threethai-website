export class WorkerRunner {
  plan(_request) { throw new Error("WorkerRunner.plan is not implemented."); }
  async run(_request) { throw new Error("WorkerRunner.run is not implemented."); }
}

export class Signer {
  get available() { return false; }
  get reference() { throw new Error("Signer.reference is not implemented."); }
  get fingerprint() { throw new Error("Signer.fingerprint is not implemented."); }
  sign(_payload) { throw new Error("Signer.sign is not implemented."); }
  verify(_payload, _signature) { throw new Error("Signer.verify is not implemented."); }
}

export class InferenceGateway {
  authorize(_lease, _request) { throw new Error("InferenceGateway.authorize is not implemented."); }
  async forward(_lease, _request) { throw new Error("InferenceGateway.forward is not implemented."); }
}

export class WorkspaceProjector {
  project(_request) { throw new Error("WorkspaceProjector.project is not implemented."); }
  verify(_manifest, _destination) { throw new Error("WorkspaceProjector.verify is not implemented."); }
}

export class EvidenceImporter {
  plan(_bundle, _authority) { throw new Error("EvidenceImporter.plan is not implemented."); }
  apply(_plan, _authority) { throw new Error("EvidenceImporter.apply is not implemented."); }
}

export class SecretStore {
  describe(_reference) { throw new Error("SecretStore.describe is not implemented."); }
  withSecret(_reference, _consumer) { throw new Error("SecretStore.withSecret is not implemented."); }
}
