# Pausable Timer for nodejs

[![CI](https://github.com/Davidihl/pausable-timer/actions/workflows/ci.yml/badge.svg)](https://github.com/Davidihl/pausable-timer/actions/workflows/ci.yml)

A `setTimeout` that can be paused, resumed, skipped and aborted, with typed events and optional ticks.

- Measures remaining time against the clock (`performance.now()`), so the countdown doesn't drift.
- Ticks land on interval boundaries of the remaining time (e.g. 3000, 2000, 1000, 0).
- No dependencies and no `node:events`, so it also works in the browser.

## Install

```sh
npm install @davidihl/pausable-timer
```

Requires Node.js 18 or later.

## Usage

```ts
import { createTimer } from "@davidihl/pausable-timer";

const timer = createTimer({ duration: 10_000, interval: 1000 });

timer.on("tick", ({ remaining }) => {
  console.log(`${Math.ceil(remaining / 1000)}s left`);
});

timer.on("complete", () => {
  console.log("done");
});

timer.start();
```

### Pause and resume

The remaining time is frozen while the timer is paused.

```ts
const timer = createTimer({ duration: 5000 });
timer.start();

// 2 seconds later
timer.pause();
timer.getRemaining(); // ~3000

// any time later
timer.resume(); // completes ~3000ms from now
```

### Skip and abort

Both stop the timer for good, and `complete` never fires. `skip` sets the remaining time to 0. `abort` keeps the remaining time from the moment it was called.

```ts
timer.skip();
// or
timer.abort();
```

### Listening to lifecycle events

Every action emits an event of the same name after the state has changed:

```ts
timer.on("start", () => console.log("started"));
timer.on("pause", () => console.log("paused at", timer.getRemaining()));
timer.on("resume", () => console.log("resumed with", timer.getRemaining()));
timer.on("skip", () => console.log("skipped"));
timer.on("abort", () => console.log("aborted at", timer.getRemaining()));
timer.on("complete", () => console.log("done"));
```

### Unsubscribing

`on()` returns a function that removes the listener:

```ts
const off = timer.on("tick", ({ remaining }) => render(remaining));

// later
off();
```

This works well as a React effect cleanup:

```ts
useEffect(
  () => timer.on("tick", ({ remaining }) => setRemaining(remaining)),
  [timer],
);
```

## API

### `createTimer(config)`

| Option     | Type     | Default | Description                        |
| ---------- | -------- | ------- | ---------------------------------- |
| `duration` | `number` | -       | Total time in milliseconds.        |
| `interval` | `number` | `1000`  | Time between `tick` events, in ms. |

Returns a `Timer`:

| Member               | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `start()`            | Starts the countdown.                                |
| `pause()`            | Pauses and freezes the remaining time.               |
| `resume()`           | Continues from the remaining time.                   |
| `skip()`             | Ends the timer immediately; remaining becomes 0.     |
| `abort()`            | Ends the timer immediately; remaining is kept.       |
| `on(type, listener)` | Adds a listener and returns an unsubscribe function. |
| `getRemaining()`     | Remaining time in milliseconds.                      |
| `config`             | The config the timer was created with.               |

### Events

| Event      | Payload                 | When                                                        |
| ---------- | ----------------------- | ----------------------------------------------------------- |
| `tick`     | `{ remaining: number }` | On every interval boundary while running, plus a final `0`. |
| `start`    | -                       | After `start()`.                                            |
| `pause`    | -                       | After `pause()`.                                            |
| `resume`   | -                       | After `resume()`.                                           |
| `skip`     | -                       | After `skip()`.                                             |
| `abort`    | -                       | After `abort()`.                                            |
| `complete` | -                       | When the duration### States                                 |

Allowed transitions, from the current state (rows) by action (columns):

| Current state | `start()` | `pause()` | `resume()` | `skip()`  | `abort()` | duration ends |
| ------------- | --------- | --------- | ---------- | --------- | --------- | ------------- |
| `idle`        | `running` | -         | -          | `skipped` | `aborted` | -             |
| `running`     | -         | `paused`  | -          | `skipped` | `aborted` | `completed`   |
| `paused`      | -         | -         | `running`  | `skipped` | `aborted` | -             |
| `completed`   | -         | -         | -          | -         | -         | -             |
| `skipped`     | -         | -         | -          | -         | -         | -             |
| `aborted`     | -         | -         | -          | -         | -         | -             |

- means not allowed: the call throws and no event is emitted. `completed`, `skipped` and `aborted` are final.

An action that isn't allowed in the current state (e.g. `pause()` while `idle`) throws, and no event is emitted.
