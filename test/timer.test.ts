import { afterEach, beforeEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import createTimer from "../src/timer.ts";

// mock.timers.tick(ms) jumps Date to the end of the window before running
// callbacks, so advance in 1ms steps to let each timer see its own time
const advance = (ms: number) => {
  for (let i = 0; i < ms; i++) mock.timers.tick(1);
};

describe("createTimer", () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ["setTimeout", "Date"] });
    // mock.timers doesn't cover performance.now, so drive it from the mocked clock
    mock.method(performance, "now", () => Date.now());
  });
  afterEach(() => {
    mock.timers.reset();
    mock.restoreAll();
  });

  it("completes after the duration", () => {
    const timer = createTimer({ duration: 1000 });
    const onComplete = mock.fn();
    timer.on("complete", onComplete);
    timer.start();

    advance(999);
    assert.equal(onComplete.mock.callCount(), 0);
    advance(1);
    assert.equal(onComplete.mock.callCount(), 1);
    assert.equal(timer.getRemaining(), 0);
  });

  it("ticks on interval boundaries of the remaining time, ending at 0", () => {
    const timer = createTimer({ duration: 3500, interval: 1000 });
    const remaining: number[] = [];
    timer.on("tick", ({ remaining: r }) => remaining.push(r));
    timer.start();

    advance(3500);
    assert.deepEqual(remaining, [3000, 2000, 1000, 0]);
  });

  it("stops ticking while paused and resumes with the remaining time", () => {
    const timer = createTimer({ duration: 3000, interval: 1000 });
    const remaining: number[] = [];
    const onComplete = mock.fn();
    timer.on("tick", ({ remaining: r }) => remaining.push(r));
    timer.on("complete", onComplete);
    timer.start();

    advance(1400);
    timer.pause();
    assert.equal(timer.getRemaining(), 1600);

    advance(5000);
    assert.deepEqual(remaining, [2000]);
    assert.equal(onComplete.mock.callCount(), 0);

    timer.resume();
    advance(1599);
    assert.deepEqual(remaining, [2000, 1000]);
    assert.equal(onComplete.mock.callCount(), 0);
    advance(1);
    assert.deepEqual(remaining, [2000, 1000, 0]);
    assert.equal(onComplete.mock.callCount(), 1);
  });

  it("emits lifecycle events in order", () => {
    const timer = createTimer({ duration: 1000 });
    const events: string[] = [];
    for (const type of ["start", "pause", "resume", "complete"] as const) {
      timer.on(type, () => events.push(type));
    }

    timer.start();
    advance(300);
    timer.pause();
    timer.resume();
    advance(700);
    assert.deepEqual(events, ["start", "pause", "resume", "complete"]);
  });

  for (const action of ["skip", "abort"] as const) {
    it(`fires nothing after ${action}`, () => {
      const timer = createTimer({ duration: 3000, interval: 1000 });
      const onTick = mock.fn();
      const onComplete = mock.fn();
      const onAction = mock.fn();
      timer.on("tick", onTick);
      timer.on("complete", onComplete);
      timer.on(action, onAction);
      timer.start();

      advance(500);
      timer[action]();
      advance(5000);

      assert.equal(onAction.mock.callCount(), 1);
      assert.equal(onTick.mock.callCount(), 0);
      assert.equal(onComplete.mock.callCount(), 0);
    });
  }

  it("throws on invalid actions without starting timers", () => {
    const timer = createTimer({ duration: 1000 });
    const onComplete = mock.fn();
    timer.on("complete", onComplete);

    assert.throws(() => timer.pause(), /Cannot set 'pause' timer while in 'idle'/);
    assert.throws(() => timer.resume());
    advance(2000);
    assert.equal(onComplete.mock.callCount(), 0);
    assert.equal(timer.getRemaining(), 1000);
  });

  it("stops calling a listener after unsubscribe", () => {
    const timer = createTimer({ duration: 3000, interval: 1000 });
    const onTick = mock.fn();
    const off = timer.on("tick", onTick);
    timer.start();

    advance(1000);
    off();
    advance(2000);
    assert.equal(onTick.mock.callCount(), 1);
  });

  it("starts ticking when a tick listener is added mid-run", () => {
    const timer = createTimer({ duration: 3000, interval: 1000 });
    timer.start();
    advance(1500);

    const remaining: number[] = [];
    timer.on("tick", ({ remaining: r }) => remaining.push(r));
    advance(1500);
    assert.deepEqual(remaining, [1000, 0]);
  });

  it("reports the state through the lifecycle", () => {
    const timer = createTimer({ duration: 1000 });
    assert.equal(timer.getState(), "idle");

    assert.throws(() => timer.pause());
    assert.equal(timer.getState(), "idle");

    timer.start();
    assert.equal(timer.getState(), "running");
    advance(300);
    timer.pause();
    assert.equal(timer.getState(), "paused");
    timer.resume();
    assert.equal(timer.getState(), "running");
    advance(700);
    assert.equal(timer.getState(), "completed");
  });

  for (const [action, state] of [
    ["skip", "skipped"],
    ["abort", "aborted"],
  ] as const) {
    it(`is ${state} after ${action}`, () => {
      const timer = createTimer({ duration: 1000 });
      timer.start();
      timer[action]();
      assert.equal(timer.getState(), state);
    });
  }
});
