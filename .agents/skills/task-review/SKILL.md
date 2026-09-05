---
name: task-review
description: Independently review an implementation already in REVIEW for Three Thai; do not implement, contribute fixes, reuse the implementation run, or authorize activation.
---

# Independent Task Review

1. Require a controller-created fresh run/thread, external Grant, review
   capability and current lease/fence; Reviewer Role differs from Owner Role.
2. Read durable repository evidence: governance, contract revision, Task Card,
   reviewed base/head, diff and validation record. Do not rely on private chat.
3. Prefer read-only repository access. Do not modify implementation or broaden
   permissions. A renamed implementation session is not independent review.
4. Check scope, acceptance criteria, deterministic validation, factual integrity,
   secrets, risk, rollback and exact reviewed SHA binding.
5. Return strict structured evidence with one outcome: `APPROVED`,
   `CHANGES_REQUESTED`, or `BLOCKED`. Durable findings are required for changes.
6. Model prose never creates approval. The controller record binds contract and
   authorization revisions/digests, reviewer run, reviewed base/head,
   validation and non-empty evidence digests. Any substantive change invalidates it.
