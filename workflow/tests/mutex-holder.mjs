import { withStateMutexInternal } from "../internal/controller-state-engine.mjs";

const [stateDirectory, holdText = "0"] = process.argv.slice(2);
const holdMilliseconds = Number(holdText);

function block(milliseconds) {
  const memory = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(memory, 0, 0, milliseconds);
}

try {
  withStateMutexInternal(stateDirectory, () => {
    const acquiredAt = Date.now();
    process.stdout.write(`${JSON.stringify({ event: "acquired", acquired_at_ms: acquiredAt })}\n`);
    block(holdMilliseconds);
    const criticalEndAt = Date.now();
    process.stdout.write(`${JSON.stringify({ event: "critical-end", critical_end_at_ms: criticalEndAt })}\n`);
  }, { timeoutMs: holdMilliseconds + 15_000 });
  process.stdout.write(`${JSON.stringify({ event: "released", released_at_ms: Date.now() })}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
