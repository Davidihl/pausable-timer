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

export type TimerEventMap = {
  start: void;
  pause: void;
  resume: void;
  skip: void;
  abort: void;
  complete: void;
  tick: { remaining: number };
};

export type TimerEvent = keyof TimerEventMap;

export type TimerListener<K extends TimerEvent> = (
  payload: TimerEventMap[K],
) => void;

export type Timer = {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  abort: () => void;
  on: <K extends TimerEvent>(type: K, listener: TimerListener<K>) => () => void;
  config: TimerConfig;
  getRemaining: () => number;
};
