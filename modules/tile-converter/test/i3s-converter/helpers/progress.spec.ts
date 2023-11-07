import test from 'tape-promise/tape';
import {Progress} from '../../../src/i3s-converter/helpers/progress';

test('tile-converter(i3s)#Progress methods', async (t) => {
  const progress = new Progress();

  // stepsTotal has not been set yet
  t.deepEqual(progress.getPercentString(), '');

  progress.stepsTotal += 10;
  t.deepEqual(progress.stepsTotal, 10);

  progress.stepsDone += 1;
  t.deepEqual(progress.stepsDone, 1);

  t.deepEqual(progress.getPercent(), 10);
  t.deepEqual(progress.getPercentString(), '10');

  // Calling a private method
  // @ts-expect-error
  progress.startTime = 1000; // 1sec
  // @ts-expect-error
  progress.stopTime = 3672000; // 1h 1m 12s

  t.deepEqual(progress.getTimeElapsed(), 3671);

  // @ts-expect-error
  progress.startTime = 1000;
  // @ts-expect-error
  progress.stopTime = 11000; // 10s
  // 1 step completion took 10s
  let timeRemainingObject = progress.getTimeRemaining();
  t.deepEqual(!!timeRemainingObject?.trust, false);
  t.deepEqual(timeRemainingObject?.timeRemaining, 90);
  t.deepEqual(Progress.timeToString(timeRemainingObject?.timeRemaining || 0), '1m 30s');
  t.deepEqual(progress.getTimeElapsed(), 10);

  // @ts-expect-error
  progress.stopTime = 12000; // 11s
  progress.stepsDone += 1;
  // 2 steps completion took 11s, which is much faster
  timeRemainingObject = progress.getTimeRemaining();
  t.deepEqual(!!timeRemainingObject?.trust, false);
  t.deepEqual(timeRemainingObject?.timeRemaining, 44);
  t.deepEqual(Progress.timeToString(timeRemainingObject?.timeRemaining || 0), '44s');
  t.deepEqual(progress.getTimeElapsed(), 11);

  // @ts-expect-error
  progress.stopTime = 17500; // 16.5s
  progress.stepsDone += 1;
  // 2 steps completion took 11s, which is much faster
  timeRemainingObject = progress.getTimeRemaining();
  t.deepEqual(!!timeRemainingObject?.trust, true);
  t.deepEqual(timeRemainingObject?.timeRemaining, 38.5);
  t.deepEqual(Progress.timeToString(timeRemainingObject?.timeRemaining || 0), '38s');
  t.deepEqual(progress.getTimeElapsed(), 16.5);

  t.end();
});
