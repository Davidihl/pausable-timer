import type { TimerEvent, TimerState } from "./types/index.ts";

const transitions: Record<
  TimerState,
  Partial<Record<TimerEvent, TimerState>>
> = {
  idle: {
    start: "running",
    skip: "skipped",
    abort: "aborted",
  },

  running: {
    pause: "paused",
    complete: "completed",
    skip: "skipped",
    abort: "aborted",
  },

  paused: {
    resume: "running",
    skip: "skipped",
    abort: "aborted",
  },
  completed: {},
  skipped: {},
  aborted: {},
};

export function transition(event: TimerEvent, currentState: TimerState) {
  const nextState = transitions[currentState][event];

  if (!nextState) {
    throw new Error(`Cannot set '${event}' timer while in '${currentState}'`);
  }

  return nextState;
}
