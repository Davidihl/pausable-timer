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

export type TimerEvent =
  | "start"
  | "pause"
  | "resume"
  | "complete"
  | "skip"
  | "abort"
  | "tick";

export type Timer = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  abort: () => void;
  on: (event: TimerEvent) => void;
  duration: number;
  getRemaining: () => number;
};
