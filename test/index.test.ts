import { beforeEach, afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { PausableTimer } from '../src/index.ts';

describe('PausableTimer', () => {
  beforeEach(() => mock.timers.enable({ apis: ['setTimeout', 'Date'] }));
  afterEach(() => mock.timers.reset());

  it('fires after the delay', () => {
    const cb = mock.fn();
    new PausableTimer(cb, 1000).start();
    mock.timers.tick(999);
    assert.equal(cb.mock.callCount(), 0);
    mock.timers.tick(1);
    assert.equal(cb.mock.callCount(), 1);
  });

  it('does not fire while paused and resumes with the remaining time', () => {
    const cb = mock.fn();
    const timer = new PausableTimer(cb, 1000).start();
    mock.timers.tick(400);
    timer.pause();
    assert.equal(timer.remaining, 600);
    mock.timers.tick(5000);
    assert.equal(cb.mock.callCount(), 0);
    timer.resume();
    mock.timers.tick(600);
    assert.equal(cb.mock.callCount(), 1);
    assert.equal(timer.state, 'done');
  });

  it('does not fire after clear', () => {
    const cb = mock.fn();
    const timer = new PausableTimer(cb, 1000).start();
    timer.clear();
    mock.timers.tick(2000);
    assert.equal(cb.mock.callCount(), 0);
    assert.equal(timer.state, 'idle');
  });
});
