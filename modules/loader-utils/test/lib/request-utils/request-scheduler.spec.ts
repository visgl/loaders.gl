import {RequestScheduler} from '@loaders.gl/loader-utils';
import {expect, test} from 'vitest';
import {advanceTimersAndFlush, withFakeTimers} from '@loaders.gl/test-utils/vitest';

test('RequestScheduler#constructor', () => {
  const requestScheduler = new RequestScheduler();
  expect(requestScheduler).toBeTruthy();
});
test('RequestScheduler#scheduleRequest', async () => {
  await withFakeTimers(async () => {
    const requestScheduler = new RequestScheduler({maxRequests: 1});
    expect(requestScheduler).toBeTruthy();

    const firstRequestPromise = requestScheduler.scheduleRequest({id: 1});
    await advanceTimersAndFlush();

    let requestToken = await firstRequestPromise;
    expect(requestToken, 'should issue request').toBeTruthy();
    if (!requestToken) {
      return;
    }

    expect(requestScheduler.activeRequestCount, 'active request count').toBe(1);
    requestToken.done();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
    requestToken.done();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);

    const cancelledRequestPromise = requestScheduler.scheduleRequest({id: 2}, () => -1);
    await advanceTimersAndFlush();

    requestToken = await cancelledRequestPromise;
    expect(requestToken, 'should not issue request with negative priority').toBeFalsy();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);

    let priority4 = 0;
    const thirdRequestPromise = requestScheduler.scheduleRequest({id: 3});
    const fourthRequestPromise = requestScheduler.scheduleRequest({id: 4}, () => priority4);

    await advanceTimersAndFlush();

    const thirdRequestToken = await thirdRequestPromise;
    expect(thirdRequestToken, 'should issue request').toBeTruthy();
    if (!thirdRequestToken) {
      return;
    }

    expect(requestScheduler.activeRequestCount, 'active request count').toBe(1);
    priority4 = -1;
    thirdRequestToken.done();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);

    await advanceTimersAndFlush();

    expect(await fourthRequestPromise).toBeFalsy();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
  });
});
test('RequestScheduler#debounce', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({debounceTime: 0, maxRequests: 1});
    const schedulerDebounced = new RequestScheduler({debounceTime: 10, maxRequests: 1});
    const request1 = scheduler.scheduleRequest({id: 1});
    const request2 = schedulerDebounced.scheduleRequest({id: 2});
    const request3 = schedulerDebounced.scheduleRequest({id: 3});

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'issues default request').toBe(1);
    expect(schedulerDebounced.activeRequestCount, 'delays debounced requests').toBe(0);

    await advanceTimersAndFlush(10);

    expect(schedulerDebounced.activeRequestCount, 'issues first debounced request after delay').toBe(
      1
    );

    const token1 = await request1;
    const token2 = await request2;
    expect(token1, 'should issue first request').toBeTruthy();
    expect(token2, 'should issue second request').toBeTruthy();
    if (!token1 || !token2) {
      return;
    }

    token1.done();
    token2.done();
    expect(scheduler.activeRequestCount, 'no active requests on scheduler #1').toBe(0);
    expect(schedulerDebounced.activeRequestCount, 'no active requests on scheduler #2').toBe(0);

    await advanceTimersAndFlush(10);

    expect(schedulerDebounced.activeRequestCount, 'issues final debounced request after delay').toBe(
      1
    );

    const token3 = await request3;
    expect(token3, 'should issue final request').toBeTruthy();
    if (!token3) {
      return;
    }

    token3.done();
  });
});
test('RequestScheduler#setProps - update maxRequests', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({maxRequests: 2});
    const request1 = scheduler.scheduleRequest({id: 1});
    const request2 = scheduler.scheduleRequest({id: 2});
    const request3 = scheduler.scheduleRequest({id: 3});

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'issues 2 requests initially').toBe(2);
    scheduler.setProps({maxRequests: 3});

    const token1 = await request1;
    const token2 = await request2;
    expect(token1, 'should issue first request').toBeTruthy();
    expect(token2, 'should issue second request').toBeTruthy();
    if (!token1 || !token2) {
      return;
    }

    token1.done();
    token2.done();

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'issues 3rd request after maxRequests increased').toBe(1);
    const token3 = await request3;
    expect(token3, 'should issue 3rd request').toBeTruthy();
    if (!token3) {
      return;
    }

    token3.done();
  });
});
test('RequestScheduler#setProps - update debounceTime', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({debounceTime: 0, maxRequests: 1});
    const request1 = scheduler.scheduleRequest({id: 1});

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'issues request immediately with debounceTime: 0').toBe(1);
    const token1 = await request1;
    expect(token1, 'issues immediate request').toBeTruthy();
    token1?.done();

    scheduler.setProps({debounceTime: 10});
    const request2 = scheduler.scheduleRequest({id: 2});

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'delays request with debounceTime: 10').toBe(0);

    await advanceTimersAndFlush(10);

    expect(scheduler.activeRequestCount, 'issues request after debounce delay').toBe(1);
    const token2 = await request2;
    expect(token2, 'issues debounced request').toBeTruthy();
    token2?.done();
  });
});
test('RequestScheduler#setProps - update throttleRequests', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({throttleRequests: true, maxRequests: 1});
    const request1 = scheduler.scheduleRequest({id: 1});
    const request2 = scheduler.scheduleRequest({id: 2});

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'throttles with throttleRequests: true').toBe(1);
    const token1 = await request1;
    expect(token1, 'issues first request').toBeTruthy();
    token1?.done();

    scheduler.setProps({throttleRequests: false});
    const request3 = scheduler.scheduleRequest({id: 3});
    const token3 = await request3;
    expect(token3, 'issues request immediately with throttleRequests: false').toBeTruthy();
    expect(scheduler.activeRequestCount, 'unthrottled requests are not tracked').toBe(0);
    token3?.done();

    await advanceTimersAndFlush();

    const token2 = await request2;
    expect(token2, 'queued request resolves after slot frees').toBeTruthy();
    token2?.done();
  });
});
test('RequestScheduler#setProps - preserves active requests', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({maxRequests: 2});
    const request1 = scheduler.scheduleRequest({id: 1});
    const request2 = scheduler.scheduleRequest({id: 2});

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'issues 2 requests').toBe(2);
    scheduler.setProps({maxRequests: 1});
    expect(scheduler.activeRequestCount, 'preserves active requests after setProps').toBe(2);

    const token1 = await request1;
    const token2 = await request2;
    expect(token1, 'preserves first active request').toBeTruthy();
    expect(token2, 'preserves second active request').toBeTruthy();
    if (!token1 || !token2) {
      return;
    }

    token1.done();
    token2.done();
    expect(scheduler.activeRequestCount, 'completes all active requests').toBe(0);

    const request3 = scheduler.scheduleRequest({id: 3});
    const request4 = scheduler.scheduleRequest({id: 4});

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'new requests respect updated maxRequests').toBe(1);
    const token3 = await request3;
    expect(token3, 'issues first queued request').toBeTruthy();
    token3?.done();

    await advanceTimersAndFlush();

    expect(scheduler.activeRequestCount, 'issues queued request after slot frees').toBe(1);
    const token4 = await request4;
    expect(token4, 'issues second queued request').toBeTruthy();
    token4?.done();
  });
});
