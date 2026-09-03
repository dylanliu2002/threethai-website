---
name: task-closeout
description: Perform permitted administrative closeout after an independent APPROVED result; do not alter implementation, findings, scope, acceptance criteria, or activation state.
---

# Task Closeout

1. Validate independent approval and exact reviewed base/head, contract revision,
   validation digest and policy revision before changing anything.
2. Modify only `administrative_files` explicitly authorized in the machine
   contract. Preserve append-only worklog history and unrelated board entries.
3. Never change implementation, findings, permissions, allowlists, acceptance
   criteria, routing or activation. Stop if implementation changed after review.
4. Run administrative scope/whitespace/Git identity gates. Keep approval and
   closeout identities separate:

   ```text
   Reviewed Head: <approved implementation SHA>
   Closeout Head: <administrative SHA>
   ```

5. Prepare Git/PR actions only when each exact permission is present. Merge,
   production, DNS, secrets and external actions remain separate human gates.
6. Return strict structured closeout evidence and an idempotency key; never
   treat merge alone as approval.
