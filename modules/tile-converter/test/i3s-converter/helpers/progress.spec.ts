import test from 'tape-promise/tape';
import {Progress} from '../../../src/i3s-converter/helpers/progress';

test('tile-converter(i3s)#Progress methods', async (t) => {
  let currentTimeMS: number = 0;
  /*
    Normally the Progress class takes the current time from the system and makes the necessary calculations based on it.
    While testing we can't use the usual workflow, because it would take too long.
    Instead we emulate getting the real time by using a special function to get time values specified in the test.
  */
  const getTime = () => {
    return BigInt(currentTimeMS) * BigInt(1e6);
  };
  const progress = new Progress({getTime: getTime});

  // stepsTotal has not been set yet
  t.equal(progress.getPercentString(), '');

  progress.stepsDone += 1;
  // expecting an empty string because stepsTotal has not been set yet even if stepsDone has been incremented
  t.equal(progress.getPercentString(), '');

  progress.stepsTotal += 10;
  t.equal(progress.stepsTotal, 10);

  t.equal(progress.stepsDone, 1);

  t.equal(progress.getPercent(), 10);
  t.equal(progress.getPercentString(), '10');

  currentTimeMS = 1000;
  progress.startMonitoring();

  currentTimeMS = 3672000;
  t.equal(progress.getTimeCurrentlyElapsed(), 3671000);
  progress.stopMonitoring();

  currentTimeMS = 1000; // 1s
  progress.startMonitoring();

  currentTimeMS = 11000; // 10s (elapsed)
  progress.stepsDone += 1;
  // 1 step completion took 10s
  let timeRemainingObject = progress.getTimeRemaining();
  let timeRemainingString = progress.getTimeRemainingString();
  t.notOk(timeRemainingObject?.trust);
  t.equal(timeRemainingObject?.timeRemaining, 90000);
  t.equal(timeRemainingString, '');
  t.equal(progress.getTimeCurrentlyElapsed(), 10000);

  currentTimeMS = 12000; // 11s
  progress.stepsDone += 1;
  // 2 steps completion took 11s, which is much faster
  timeRemainingObject = progress.getTimeRemaining();
  timeRemainingString = progress.getTimeRemainingString();
  t.notOk(timeRemainingObject?.trust);
  t.equal(timeRemainingObject?.timeRemaining, 44000);
  t.equal(timeRemainingString, '');
  t.equal(progress.getTimeCurrentlyElapsed(), 11000);

  currentTimeMS = 17500; // 16.5s
  progress.stepsDone += 1;
  // 3 steps completion took 16.5s. The velocity of processing has been stabilized on the 3rd step.
  timeRemainingObject = progress.getTimeRemaining();
  timeRemainingString = progress.getTimeRemainingString();
  t.ok(timeRemainingObject?.trust);
  t.equal(timeRemainingObject?.timeRemaining, 38500);
  t.equal(timeRemainingString, '38s');
  t.equal(progress.getTimeCurrentlyElapsed(), 16500);

  progress.stopMonitoring();

  currentTimeMS = 1000;
  progress.stepsTotal = 10;
  progress.startMonitoring();

  currentTimeMS = 1007; // +7 ms
  progress.stepsDone += 1;
  currentTimeMS = 1014; // +7 ms
  progress.stepsDone += 1;
  currentTimeMS = 1023; // +9 ms
  progress.stepsDone += 1;

  timeRemainingObject = progress.getTimeRemaining();
  timeRemainingString = progress.getTimeRemainingString();

  t.equal(timeRemainingObject?.timeRemaining, 53.66666666666667);
  t.equal(timeRemainingString, '53ms');

  t.end();
});
