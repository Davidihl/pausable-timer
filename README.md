# pausable-timer

A `setTimeout` that can be paused and resumed. ESM-only, zero dependencies.

## Install

```sh
npm install pausable-timer
```

## Usage

```js
import { PausableTimer } from 'pausable-timer';

const timer = new PausableTimer(() => console.log('done'), 5000).start();

timer.pause();
console.log(timer.remaining); // ms left
timer.resume();
timer.clear();
```

## Development

```sh
npm test          # node:test
npm run typecheck
npm run build     # emits dist/
```
