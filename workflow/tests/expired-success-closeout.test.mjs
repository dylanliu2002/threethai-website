import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  mutateControllerStateInternal,
  readControllerStateInternal,
} from "../internal/controller-state-engine.mjs";
import { recoverExpiredSuccessfulRunLeaseInternal } from "../internal/lease-engine.mjs";
import { cleanupFixture, makeStateDirectory } from "./helpers.mjs";

const TASK_KEY = "sys-auto-pilot-001-synthetic-fixture";
const RUN_ID = "11111111-1111-4111-8111-111111111111";
const LEASE_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_RUN_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_LEASE_ID = "44444444-4444-4444-8444-444444444444";
const NOW = new Date("2026-09-10T00:10:00.000Z");

function journalEvents(stateDirectory) {
  return fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl"), "utf8")
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function fixture({ runStatus = "SUCCESS", expired = true } = {}) {
  const stateDirectory = makeStateDirectory({ active: false });
  const expiresAt = expired
    ? NOW.getTime() - 1_000
    : NOW.getTime() + 60_000;
  mutateControllerStateInternal(stateDirectory, {
    type: "test.expired-success-closeout.fixture",
    taskKey: TASK_KEY,
    runId: RUN_ID,
  }, (state) => {
    state.runs[RUN_ID] = {
      task_key: TASK_KEY,
      run_id: RUN_ID,
      lease_id: LEASE_ID,
      fencing_token: 7,
      status: runStatus,
    };
    state.tasks[TASK_KEY] = {
      current_run_id: RUN_ID,
      lease_id: LEASE_ID,
      fencing_token: 7,
    };
    state.leases[LEASE_ID] = {
      kind: "worker",
      lease_id: LEASE_ID,
      task_key: TASK_KEY,
      run_id: RUN_ID,
      fencing_token: 7,
      expires_at_ms: expiresAt,
      expires_at: new Date(expiresAt).toISOString(),
    };
    for (let index = 0; index < 5; index += 1) {
      state.reservations[`${LEASE_ID}:${index}`] = {
        class: "path",
        key: `fixture-${index}`,
        lease_id: LEASE_ID,
        task_key: TASK_KEY,
        fencing_token: 7,
        expires_at_ms: expiresAt,
      };
    }
    state.runs[OTHER_RUN_ID] = {
      task_key: "other-task",
      run_id: OTHER_RUN_ID,
      lease_id: OTHER_LEASE_ID,
      fencing_token: 8,
      status: "RUNNING",
    };
    state.leases[OTHER_LEASE_ID] = {
      kind: "worker",
      lease_id: OTHER_LEASE_ID,
      task_key: "other-task",
      run_id: OTHER_RUN_ID,
      fencing_token: 8,
      expires_at_ms: NOW.getTime() + 60_000,
    };
    state.reservations[`${OTHER_LEASE_ID}:0`] = {
      class: "path",
      key: "unrelated",
      lease_id: OTHER_LEASE_ID,
      task_key: "other-task",
      fencing_token: 8,
      expires_at_ms: NOW.getTime() + 60_000,
    };
  });
  return stateDirectory;
}

test("EXPIRED-SUCCESS-CLOSEOUT-01 releases only the expired SUCCESS run resources and preserves evidence", (t) => {
  const stateDirectory = fixture();
  t.after(() => cleanupFixture(stateDirectory));
  const before = readControllerStateInternal(stateDirectory);
  const beforeRun = structuredClone(before.runs[RUN_ID]);
  const beforeLease = structuredClone(before.leases[LEASE_ID]);
  const beforeReservations = Object.entries(before.reservations)
    .filter(([, reservation]) => reservation.lease_id === LEASE_ID)
    .map(([reservation_id, reservation]) => ({ reservation_id, ...structuredClone(reservation) }));

  const result = recoverExpiredSuccessfulRunLeaseInternal({
    stateDirectory,
    taskKey: TASK_KEY,
    runId: RUN_ID,
    leaseId: LEASE_ID,
    now: NOW,
  });
  const after = readControllerStateInternal(stateDirectory);
  assert.equal(result.recovered, true);
  assert.equal(result.already_released, false);
  assert.equal(result.released_reservations, 5);
  assert.deepEqual(after.runs[RUN_ID], beforeRun);
  assert.equal(after.leases[LEASE_ID], undefined);
  assert.equal(Object.values(after.reservations).filter((item) => item.lease_id === LEASE_ID).length, 0);
  assert.equal(after.tasks[TASK_KEY].current_run_id, RUN_ID);
  assert.equal(after.tasks[TASK_KEY].lease_id, null);
  assert.deepEqual(after.leases[OTHER_LEASE_ID], before.leases[OTHER_LEASE_ID]);
  assert.deepEqual(after.reservations[`${OTHER_LEASE_ID}:0`], before.reservations[`${OTHER_LEASE_ID}:0`]);

  const event = journalEvents(stateDirectory).at(-1);
  assert.equal(event.type, "run.expired-success-closeout-recovered");
  assert.equal(event.run_id, RUN_ID);
  assert.equal(event.payload.lease_id, LEASE_ID);
  assert.deepEqual(event.payload.released_lease, beforeLease);
  assert.deepEqual(event.payload.released_reservations, beforeReservations);
  assert.equal(event.payload.snapshot.runs[RUN_ID].status, "SUCCESS");
});

test("EXPIRED-SUCCESS-CLOSEOUT-02 exact second recovery is a no-op", (t) => {
  const stateDirectory = fixture();
  t.after(() => cleanupFixture(stateDirectory));
  recoverExpiredSuccessfulRunLeaseInternal({
    stateDirectory, taskKey: TASK_KEY, runId: RUN_ID, leaseId: LEASE_ID, now: NOW,
  });
  const beforeState = readControllerStateInternal(stateDirectory);
  const beforeJournal = fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl"));
  const result = recoverExpiredSuccessfulRunLeaseInternal({
    stateDirectory, taskKey: TASK_KEY, runId: RUN_ID, leaseId: LEASE_ID, now: NOW,
  });
  assert.equal(result.recovered, true);
  assert.equal(result.already_released, true);
  assert.deepEqual(readControllerStateInternal(stateDirectory), beforeState);
  assert.equal(
    fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl")).equals(beforeJournal),
    true,
  );
});

test("EXPIRED-SUCCESS-CLOSEOUT-03 rejects non-SUCCESS and live leases without mutation", (t) => {
  const failedDirectory = fixture({ runStatus: "FAILED" });
  const liveDirectory = fixture({ expired: false });
  t.after(() => cleanupFixture(failedDirectory, liveDirectory));
  for (const [stateDirectory, pattern] of [
    [failedDirectory, /terminal SUCCESS run/],
    [liveDirectory, /owned lease to be expired/],
  ]) {
    const beforeState = readControllerStateInternal(stateDirectory);
    const beforeJournal = fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl"));
    assert.throws(() => recoverExpiredSuccessfulRunLeaseInternal({
      stateDirectory, taskKey: TASK_KEY, runId: RUN_ID, leaseId: LEASE_ID, now: NOW,
    }), pattern);
    assert.deepEqual(readControllerStateInternal(stateDirectory), beforeState);
    assert.equal(
      fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl")).equals(beforeJournal),
      true,
    );
  }
});

test("EXPIRED-SUCCESS-CLOSEOUT-04 rejects cross-run lease reuse", (t) => {
  const stateDirectory = fixture();
  t.after(() => cleanupFixture(stateDirectory));
  const beforeState = readControllerStateInternal(stateDirectory);
  assert.throws(() => recoverExpiredSuccessfulRunLeaseInternal({
    stateDirectory,
    taskKey: TASK_KEY,
    runId: RUN_ID,
    leaseId: OTHER_LEASE_ID,
    now: NOW,
  }), /exact run and lease ownership/);
  assert.deepEqual(readControllerStateInternal(stateDirectory), beforeState);
});

test("EXPIRED-SUCCESS-CLOSEOUT-05 idempotency rejects inconsistent missing-lease state", async (t) => {
  const cases = [
    {
      name: "mismatched retained fence",
      mutate(state) {
        state.tasks[TASK_KEY].fencing_token = 8;
      },
    },
    {
      name: "competing run lease",
      mutate(state) {
        state.leases[OTHER_LEASE_ID] = {
          ...state.leases[OTHER_LEASE_ID],
          task_key: TASK_KEY,
          run_id: RUN_ID,
          fencing_token: 8,
        };
      },
    },
    {
      name: "conflicting task reservation",
      mutate(state) {
        state.reservations[`${OTHER_LEASE_ID}:conflict`] = {
          class: "path",
          key: "conflict",
          lease_id: OTHER_LEASE_ID,
          task_key: TASK_KEY,
          fencing_token: 8,
          expires_at_ms: NOW.getTime() + 60_000,
        };
      },
    },
  ];
  for (const candidate of cases) {
    await t.test(candidate.name, () => {
      const stateDirectory = fixture();
      t.after(() => cleanupFixture(stateDirectory));
      recoverExpiredSuccessfulRunLeaseInternal({
        stateDirectory, taskKey: TASK_KEY, runId: RUN_ID, leaseId: LEASE_ID, now: NOW,
      });
      mutateControllerStateInternal(stateDirectory, {
        type: "test.inconsistent-post-release-state",
        taskKey: TASK_KEY,
        runId: RUN_ID,
      }, candidate.mutate);
      const beforeState = readControllerStateInternal(stateDirectory);
      const beforeJournal = fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl"));
      assert.throws(() => recoverExpiredSuccessfulRunLeaseInternal({
        stateDirectory, taskKey: TASK_KEY, runId: RUN_ID, leaseId: LEASE_ID, now: NOW,
      }), /inconsistent partial cleanup/);
      assert.deepEqual(readControllerStateInternal(stateDirectory), beforeState);
      assert.equal(
        fs.readFileSync(path.join(stateDirectory, "controller-journal.jsonl")).equals(beforeJournal),
        true,
      );
    });
  }
});
