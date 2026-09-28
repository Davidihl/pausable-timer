import { transition } from "./transitions.ts";
import type {
  Timer,
  TimerConfig,
  TimerEvent,
  TimerState,
} from "./types/index.ts";

export default function createTimer(config: TimerConfig): Timer {
  console.log("config", config);
  let _startedAt: number | undefined;
  let _state: TimerState = "idle";
  let _remaining = config.duration;
  let _estimatedEnd: number | undefined;

  const start = () => {
    _state = transition("start", _state);
    _startedAt = performance.now();
    _estimatedEnd = _startedAt + _remaining;
  };
  const pause = () => {
    _state = transition("pause", _state);
  };
  const resume = () => {
    _state = transition("resume", _state);
  };
  const skip = () => {
    _state = transition("skip", _state);
  };
  const abort = () => {
    _state = transition("abort", _state);
  };

  const complete = () => {
    _state = transition("complete", _state);
  };

  const on = (event: TimerEvent) => {};
  const getRemaining = () => {
    if (_estimatedEnd === undefined) {
      return _remaining;
    }

    return Math.max(0, _estimatedEnd - performance.now());
  };

  return { start, resume, pause, skip, abort, on, getRemaining, config };
}
