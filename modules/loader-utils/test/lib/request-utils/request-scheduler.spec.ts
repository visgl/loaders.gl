import {RequestScheduler} from '@loaders.gl/loader-utils';
import {expect, test} from 'vitest';

const sleep = (milliseconds = 0) => new Promise(resolve => setTimeout(resolve, milliseconds));
test('RequestScheduler#constructor', () => {
  const requestScheduler = new RequestScheduler();
  expect(requestScheduler).toBeTruthy();
});
test('RequestScheduler#scheduleRequest', async () => {
  const requestScheduler = new RequestScheduler({maxRequests: 1});
  expect(requestScheduler).toBeTruthy();
  let requestToken = await requestScheduler.scheduleRequest({id: 1});
  if (!requestToken) {
    (() => {
      throw new Error('should issue request');
    })();
    return;
  }
  expect(requestScheduler.activeRequestCount, 'active request count').toBe(1);
  requestToken.done();
  expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
  requestToken.done();
  expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
  requestToken = await requestScheduler.scheduleRequest({id: 2}, () => -1);
  expect(requestToken, 'should not issue request with negative priority').toBeFalsy();
  expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
  // The following test checks that request#4 is only issued AFTER request#3 is resolved
  // By modifying request#4's priority during request#3
  let priority4 = 0;
  const request3 = async () => {
    priority4 = -1;
  };
  const result = await Promise.all([
    requestScheduler.scheduleRequest({id: 3}).then(async reqToken => {
      if (!reqToken) {
        (() => {
          throw new Error('should issue request');
        })();
        return;
      }
      expect(requestScheduler.activeRequestCount, 'active request count').toBe(1);
      await request3();
      reqToken.done();
      expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
    }),
    // priority callback should be called after the previous one is fully resolved
    requestScheduler.scheduleRequest({id: 4}, () => priority4)
  ]);
  expect(result[1]).toBeFalsy();
  expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
});
test('RequestScheduler#debounce', async () => {
  const scheduler = new RequestScheduler({debounceTime: 0, maxRequests: 1});
  const schedulerDebounced = new RequestScheduler({debounceTime: 10, maxRequests: 1});
  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = schedulerDebounced.scheduleRequest({id: 2});
  const request3 = schedulerDebounced.scheduleRequest({id: 3});
  await sleep(0);
  expect(scheduler.activeRequestCount, 'issues default request').toBe(1);
  expect(schedulerDebounced.activeRequestCount, 'delays debounced requests').toBe(0);
  await sleep(50);
  expect(schedulerDebounced.activeRequestCount, 'issues first debounced request after delay').toBe(
    1
  );
  const token1 = await request1;
  const token2 = await request2;
  if (token1 && token2) {
    token1.done();
    token2.done();
  } else {
    (() => {
      throw new Error('should issue both initial requests');
    })();
  }
  expect(scheduler.activeRequestCount, 'no active requests on scheduler #1').toBe(0);
  expect(schedulerDebounced.activeRequestCount, 'no active requests on scheduler #2').toBe(0);
  await sleep(50);
  expect(schedulerDebounced.activeRequestCount, 'issues final debounced request after delay').toBe(
    1
  );
  const token3 = await request3;
  if (token3) {
    token3.done();
  } else {
    (() => {
      throw new Error('should issue final request');
    })();
  }
});
test('RequestScheduler#setProps - update maxRequests', async () => {
  const scheduler = new RequestScheduler({maxRequests: 2});
  // Schedule 3 requests with maxRequests = 2
  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = scheduler.scheduleRequest({id: 2});
  const request3 = scheduler.scheduleRequest({id: 3});
  await sleep(0);
  expect(scheduler.activeRequestCount, 'issues 2 requests initially').toBe(2);
  // Increase maxRequests to 3
  scheduler.setProps({maxRequests: 3});
  const token1 = await request1;
  const token2 = await request2;
  if (token1 && token2) {
    token1.done();
    token2.done();
  } else {
    (() => {
      throw new Error('should issue first 2 requests');
    })();
  }
  await sleep(0);
  expect(scheduler.activeRequestCount, 'issues 3rd request after maxRequests increased').toBe(1);
  const token3 = await request3;
  if (token3) {
    token3.done();
  } else {
    (() => {
      throw new Error('should issue 3rd request');
    })();
  }
});
test('RequestScheduler#setProps - update debounceTime', async () => {
  const scheduler = new RequestScheduler({debounceTime: 0, maxRequests: 1});
  const request1 = scheduler.scheduleRequest({id: 1});
  await sleep(0);
  expect(scheduler.activeRequestCount, 'issues request immediately with debounceTime: 0').toBe(1);
  const token1 = await request1;
  if (token1) {
    token1.done();
  }
  // Update debounceTime to 10ms
  scheduler.setProps({debounceTime: 10});
  const request2 = scheduler.scheduleRequest({id: 2});
  await sleep(0);
  expect(scheduler.activeRequestCount, 'delays request with debounceTime: 10').toBe(0);
  await sleep(20);
  expect(scheduler.activeRequestCount, 'issues request after debounce delay').toBe(1);
  const token2 = await request2;
  if (token2) {
    token2.done();
  }
});
test('RequestScheduler#setProps - update throttleRequests', async () => {
  const scheduler = new RequestScheduler({throttleRequests: true, maxRequests: 1});
  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = scheduler.scheduleRequest({id: 2});
  await sleep(0);
  expect(scheduler.activeRequestCount, 'throttles with throttleRequests: true').toBe(1);
  const token1 = await request1;
  if (token1) {
    token1.done();
  }
  // Disable throttling
  scheduler.setProps({throttleRequests: false});
  const request3 = scheduler.scheduleRequest({id: 3});
  const token3 = await request3;
  expect(token3, 'issues request immediately with throttleRequests: false').toBeTruthy();
  expect(scheduler.activeRequestCount, 'unthrottled requests are not tracked').toBe(0);
  if (token3) {
    token3.done();
  }
  await sleep(0);
  const token2 = await request2;
  if (token2) {
    token2.done();
  }
});
test('RequestScheduler#setProps - preserves active requests', async () => {
  const scheduler = new RequestScheduler({maxRequests: 2});
  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = scheduler.scheduleRequest({id: 2});
  await sleep(0);
  expect(scheduler.activeRequestCount, 'issues 2 requests').toBe(2);
  // Reduce maxRequests while requests are active
  scheduler.setProps({maxRequests: 1});
  expect(scheduler.activeRequestCount, 'preserves active requests after setProps').toBe(2);
  const token1 = await request1;
  const token2 = await request2;
  if (token1 && token2) {
    token1.done();
    token2.done();
  } else {
    (() => {
      throw new Error('should preserve active requests');
    })();
  }
  expect(scheduler.activeRequestCount, 'completes all active requests').toBe(0);
  // New requests should respect new maxRequests
  const request3 = scheduler.scheduleRequest({id: 3});
  const request4 = scheduler.scheduleRequest({id: 4});
  await sleep(0);
  expect(scheduler.activeRequestCount, 'new requests respect updated maxRequests').toBe(1);
  const token3 = await request3;
  if (token3) {
    token3.done();
  }
  await sleep(0);
  expect(scheduler.activeRequestCount, 'issues queued request after slot frees').toBe(1);
  const token4 = await request4;
  if (token4) {
    token4.done();
  }
});
