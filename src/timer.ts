import { transition } from "./transitions.ts";
import type {
  Timer,
  TimerConfig,
  TimerEvent,
  TimerEventMap,
  TimerListener,
  TimerState,
} from "./types/index.ts";

type Handle = ReturnType<typeof setTimeout>;

export default function createTimer(config: TimerConfig): Timer {
  let _state: TimerState = "idle";
  let _remaining = config.duration;
  let _estimatedEnd: number | undefined;
  const _interval = config.interval || 1000;

  let _completeHandle: Handle | undefined;
  let _tickHandle: Handle | undefined;

  const _listeners = new Map<TimerEvent, Set<TimerListener<any>>>();

  const emit = <K extends TimerEvent>(type: K, payload: TimerEventMap[K]) => {
    const listeners = _listeners.get(type);
    if (!listeners) return;
    for (const listener of [...listeners]) listener(payload);
  };

  const hasTickListeners = () => (_listeners.get("tick")?.size ?? 0) > 0;

  const getRemaining = () => {
    if (_estimatedEnd === undefined) {
      return _remaining;
    }

    return Math.max(0, _estimatedEnd - performance.now());
  };

  const scheduleTick = () => {
    if (_state !== "running" || !hasTickListeners()) return;

    const remaining = getRemaining();
    let delay = remaining % _interval;
    if (delay < 1) delay += _interval;
    if (delay >= remaining) return;

    _tickHandle = setTimeout(onTick, delay);
  };

  const onTick = () => {
    _tickHandle = undefined;
    scheduleTick();
    emit("tick", { remaining: getRemaining() });
  };

  const finish = () => {
    clear();
    _state = transition("complete", _state);
    _remaining = 0;
    _estimatedEnd = undefined;
    if (hasTickListeners()) emit("tick", { remaining: 0 });
    emit("complete", undefined);
  };

  const schedule = () => {
    _estimatedEnd = performance.now() + _remaining;
    _completeHandle = setTimeout(finish, _remaining);
    scheduleTick();
  };

  const clear = () => {
    clearTimeout(_completeHandle);
    clearTimeout(_tickHandle);
    _completeHandle = undefined;
    _tickHandle = undefined;
  };

  const start = () => {
    _state = transition("start", _state);
    schedule();
    emit("start", undefined);
  };

  const pause = () => {
    _state = transition("pause", _state);
    _remaining = getRemaining();
    _estimatedEnd = undefined;
    clear();
    emit("pause", undefined);
  };

  const resume = () => {
    _state = transition("resume", _state);
    schedule();
    emit("resume", undefined);
  };

  const skip = () => {
    _state = transition("skip", _state);
    clear();
    _remaining = 0;
    _estimatedEnd = undefined;
    emit("skip", undefined);
  };

  const abort = () => {
    _state = transition("abort", _state);
    _remaining = getRemaining();
    _estimatedEnd = undefined;
    clear();
    emit("abort", undefined);
  };

  const getState = () => {
    return _state;
  };

  const on = <K extends TimerEvent>(type: K, listener: TimerListener<K>) => {
    let listeners = _listeners.get(type);
    if (!listeners) {
      listeners = new Set();
      _listeners.set(type, listeners);
    }
    listeners.add(listener);

    // first tick listener on an already running timer starts the tick loop
    if (type === "tick" && _tickHandle === undefined) scheduleTick();

    return () => {
      listeners.delete(listener);
    };
  };

  return {
    start,
    resume,
    pause,
    skip,
    abort,
    on,
    getRemaining,
    getState,
    config,
  };
}
