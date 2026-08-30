import {expect, test} from 'vitest';
import {Progress} from '../../../src/i3s-converter/helpers/progress';
// eslint-disable-next-line max-statements
test('tile-converter(i3s)#Progress methods', async () => {
  let currentTimeMS: number = 0;
  /*
      Normally the Progress class takes the current time from the system and makes the necessary calculations based on it.
      While testing we can't use the usual workflow, because it would take too long.
      Instead we emulate getting the real time by using a special function to get time values specified in the test.
    */
  const getTime = () => {
    return BigInt(currentTimeMS) * BigInt(1e6);
  };
  const progress = new Progress({getTime});
  // stepsTotal has not been set yet
  expect(progress.getPercentString()).toBe('');
  progress.stepsDone += 1;
  // expecting an empty string because stepsTotal has not been set yet even if stepsDone has been incremented
  expect(progress.getPercentString()).toBe('');
  progress.stepsTotal += 10;
  expect(progress.stepsTotal).toBe(10);
  expect(progress.stepsDone).toBe(1);
  expect(progress.getPercent()).toBe(10);
  expect(progress.getPercentString()).toBe('10');
  currentTimeMS = 1000;
  progress.startMonitoring();
  currentTimeMS = 3672000;
  expect(progress.getTimeCurrentlyElapsed()).toBe(3671000);
  progress.stopMonitoring();
  currentTimeMS = 1000; // 1s
  progress.startMonitoring();
  currentTimeMS = 11000; // 10s (elapsed)
  progress.stepsDone += 1;
  // 1 step completion took 10s
  let timeRemainingObject = progress.getTimeRemaining();
  let timeRemainingString = progress.getTimeRemainingString();
  expect(timeRemainingObject?.trust).toBeFalsy();
  expect(timeRemainingObject?.timeRemaining).toBe(90000);
  expect(timeRemainingString).toBe('');
  expect(progress.getTimeCurrentlyElapsed()).toBe(10000);
  currentTimeMS = 12000; // 11s
  progress.stepsDone += 1;
  // 2 steps completion took 11s, which is much faster
  timeRemainingObject = progress.getTimeRemaining();
  timeRemainingString = progress.getTimeRemainingString();
  expect(timeRemainingObject?.trust).toBeFalsy();
  expect(timeRemainingObject?.timeRemaining).toBe(44000);
  expect(timeRemainingString).toBe('');
  expect(progress.getTimeCurrentlyElapsed()).toBe(11000);
  currentTimeMS = 17500; // 16.5s
  progress.stepsDone += 1;
  // 3 steps completion took 16.5s. The velocity of processing has been stabilized on the 3rd step.
  timeRemainingObject = progress.getTimeRemaining();
  timeRemainingString = progress.getTimeRemainingString();
  expect(timeRemainingObject?.trust).toBeTruthy();
  expect(timeRemainingObject?.timeRemaining).toBe(38500);
  expect(timeRemainingString).toBe('38s');
  expect(progress.getTimeCurrentlyElapsed()).toBe(16500);
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
  expect(timeRemainingObject?.timeRemaining).toBe(53.66666666666667);
  expect(timeRemainingString).toBe('53ms');
});
