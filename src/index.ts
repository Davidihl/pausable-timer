export type TimerState = 'idle' | 'running' | 'paused' | 'done';

export class PausableTimer {
  #callback: () => void;
  #delay: number;
  #remaining: number;
  #startedAt = 0;
  #handle: ReturnType<typeof setTimeout> | undefined;
  #state: TimerState = 'idle';

  constructor(callback: () => void, delay: number) {
    this.#callback = callback;
    this.#delay = delay;
    this.#remaining = delay;
  }

  get state(): TimerState {
    return this.#state;
  }

  /** Milliseconds left until the callback fires. */
  get remaining(): number {
    if (this.#state === 'running') {
      return Math.max(0, this.#remaining - (Date.now() - this.#startedAt));
    }
    return this.#remaining;
  }

  start(): this {
    if (this.#state !== 'idle') return this;
    this.#remaining = this.#delay;
    this.#schedule();
    return this;
  }

  pause(): this {
    if (this.#state !== 'running') return this;
    this.#remaining = this.remaining;
    clearTimeout(this.#handle);
    this.#handle = undefined;
    this.#state = 'paused';
    return this;
  }

  resume(): this {
    if (this.#state !== 'paused') return this;
    this.#schedule();
    return this;
  }

  clear(): this {
    clearTimeout(this.#handle);
    this.#handle = undefined;
    this.#remaining = this.#delay;
    this.#state = 'idle';
    return this;
  }

  #schedule(): void {
    this.#startedAt = Date.now();
    this.#state = 'running';
    this.#handle = setTimeout(() => {
      this.#handle = undefined;
      this.#remaining = 0;
      this.#state = 'done';
      this.#callback();
    }, this.#remaining);
  }
}
