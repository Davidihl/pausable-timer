import type {
  Timer,
  TimerConfig,
  TimerEvent,
  TimerState,
} from "./types/index.ts";

export default function createTimer(config: TimerConfig): Timer {
  console.log("config", config);
  let startedAt: Date | undefined;
  let state: TimerState = "idle";

  const start = () => {};
  const pause = () => {};
  const resume = () => {};
  const skip = () => {};
  const abort = () => {};
  const on = (event: TimerEvent) => {};
  const getRemaining = () => {
    return 0;
  };

  return { start, resume, pause, skip, abort, on, getRemaining, config };
}
