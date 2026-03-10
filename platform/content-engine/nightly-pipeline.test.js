import test from "node:test";
import assert from "node:assert/strict";

import { createFixedClock } from "./data-pipeline-test-helpers.js";
import {
  computeNextNightlyRun,
  createNightlyScheduler,
} from "./backend-server.js";

test("computeNextNightlyRun returns the next configured UTC window", () => {
  const next = computeNextNightlyRun(
    new Date("2026-03-10T18:31:00.000Z"),
    "18:30",
  );

  assert.equal(next.toISOString(), "2026-03-11T18:30:00.000Z");
});

test("nightly scheduler computes delay and invokes detector runner without sleeping", async () => {
  const timeouts = [];
  let scheduledCallback = null;
  let runCount = 0;

  const scheduler = createNightlyScheduler({
    clock: createFixedClock("2026-03-10T18:00:00.000Z"),
    scheduleTime: "18:30",
    setTimeoutFn(callback, delay) {
      scheduledCallback = callback;
      timeouts.push(delay);
      return "timeout-1";
    },
    clearTimeoutFn() {},
    async runNow() {
      runCount += 1;
    },
    logger: { log() {}, warn() {}, error() {} },
  });

  scheduler.start();
  assert.equal(timeouts[0], 30 * 60 * 1000);

  await scheduledCallback();
  assert.equal(runCount, 1);
  assert.equal(timeouts.length, 2);
});
