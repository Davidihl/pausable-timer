export type TimerConfig = {
  duration: number;
  interval?: number;
};

export type TimerState =
  | "idle"
  | "running"
  | "paused"
  | "completed"
  | "skipped"
  | "aborted";

export type TimerAction =
  | "start"
  | "pause"
  | "resume"
  | "skip"
  | "abort"
  | "complete";

export type TimerEvent = TimerAction | "tick";

export type Timer = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  abort: () => void;
  on: (event: TimerEvent) => void;
  config: TimerConfig;
  getRemaining: () => number;
};
