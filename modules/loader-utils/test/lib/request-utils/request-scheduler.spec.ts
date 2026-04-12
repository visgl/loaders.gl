import {RequestScheduler} from '@loaders.gl/loader-utils';
import {expect, test} from 'vitest';
import {advanceTimersAndFlush, withFakeTimers} from '@loaders.gl/test-utils/vitest';

type RequestToken = NonNullable<Awaited<ReturnType<RequestScheduler['scheduleRequest']>>>;

async function flushScheduler(delay = 0): Promise<void> {
  await advanceTimersAndFlush(delay);
}

async function expectIssuedRequest(
  requestPromise: ReturnType<RequestScheduler['scheduleRequest']>,
  message: string
): Promise<RequestToken> {
  const requestToken = await requestPromise;
  expect(requestToken, message).toBeTruthy();
  return requestToken as RequestToken;
}

async function flushAndExpectIssuedRequest(
  requestPromise: ReturnType<RequestScheduler['scheduleRequest']>,
  message: string,
  delay = 0
): Promise<RequestToken> {
  await flushScheduler(delay);
  return await expectIssuedRequest(requestPromise, message);
}

test('RequestScheduler#constructor', () => {
  const requestScheduler = new RequestScheduler();
  expect(requestScheduler).toBeTruthy();
});
test('RequestScheduler#scheduleRequest', async () => {
  await withFakeTimers(async () => {
    const requestScheduler = new RequestScheduler({maxRequests: 1});
    expect(requestScheduler).toBeTruthy();

    const firstRequestToken = await flushAndExpectIssuedRequest(
      requestScheduler.scheduleRequest({id: 1}),
      'issues the first request'
    );

    expect(requestScheduler.activeRequestCount, 'active request count').toBe(1);
    firstRequestToken.done();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);
    firstRequestToken.done();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);

    const cancelledRequestPromise = requestScheduler.scheduleRequest({id: 2}, () => -1);
    await flushScheduler();
    await expect(cancelledRequestPromise, 'cancels request with negative priority').resolves.toBeNull();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);

    let priority4 = 0;
    const thirdRequestPromise = requestScheduler.scheduleRequest({id: 3});
    const fourthRequestPromise = requestScheduler.scheduleRequest({id: 4}, () => priority4);

    const thirdRequestToken = await flushAndExpectIssuedRequest(
      thirdRequestPromise,
      'issues queued request'
    );

    expect(requestScheduler.activeRequestCount, 'active request count').toBe(1);
    priority4 = -1;
    thirdRequestToken.done();
    expect(requestScheduler.activeRequestCount, 'active request count').toBe(0);

    await flushScheduler();
    await expect(fourthRequestPromise, 'cancels reprioritized request').resolves.toBeNull();
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

    await flushScheduler();
    expect(scheduler.activeRequestCount, 'issues default request').toBe(1);
    expect(schedulerDebounced.activeRequestCount, 'delays debounced requests').toBe(0);

    await flushScheduler(10);
    expect(schedulerDebounced.activeRequestCount, 'issues first debounced request after delay').toBe(
      1
    );

    const token1 = await expectIssuedRequest(request1, 'issues first request');
    const token2 = await expectIssuedRequest(request2, 'issues second request');

    token1.done();
    token2.done();
    expect(scheduler.activeRequestCount, 'no active requests on scheduler #1').toBe(0);
    expect(schedulerDebounced.activeRequestCount, 'no active requests on scheduler #2').toBe(0);

    await flushScheduler(10);
    expect(schedulerDebounced.activeRequestCount, 'issues final debounced request after delay').toBe(
      1
    );
    const token3 = await expectIssuedRequest(request3, 'issues final debounced request');
    token3.done();
  });
});
test('RequestScheduler#setProps - update maxRequests', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({maxRequests: 2});
    const request1 = scheduler.scheduleRequest({id: 1});
    const request2 = scheduler.scheduleRequest({id: 2});
    const request3 = scheduler.scheduleRequest({id: 3});

    await flushScheduler();

    expect(scheduler.activeRequestCount, 'issues 2 requests initially').toBe(2);
    scheduler.setProps({maxRequests: 3});

    const [token1, token2] = await Promise.all([
      expectIssuedRequest(request1, 'issues first request'),
      expectIssuedRequest(request2, 'issues second request')
    ]);
    token1.done();
    token2.done();

    await flushScheduler();
    expect(scheduler.activeRequestCount, 'issues 3rd request after maxRequests increased').toBe(1);
    const token3 = await expectIssuedRequest(request3, 'issues 3rd request after maxRequests increased');
    token3.done();
  });
});
test('RequestScheduler#setProps - update debounceTime', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({debounceTime: 0, maxRequests: 1});
    const request1 = scheduler.scheduleRequest({id: 1});

    await flushScheduler();

    expect(scheduler.activeRequestCount, 'issues request immediately with debounceTime: 0').toBe(1);
    const token1 = await expectIssuedRequest(request1, 'issues immediate request');
    token1.done();

    scheduler.setProps({debounceTime: 10});
    const request2 = scheduler.scheduleRequest({id: 2});

    await flushScheduler();
    expect(scheduler.activeRequestCount, 'delays request with debounceTime: 10').toBe(0);

    await flushScheduler(10);
    expect(scheduler.activeRequestCount, 'issues request after debounce delay').toBe(1);
    const token2 = await expectIssuedRequest(request2, 'issues debounced request');
    token2.done();
  });
});
test('RequestScheduler#setProps - update throttleRequests', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({throttleRequests: true, maxRequests: 1});
    const request1 = scheduler.scheduleRequest({id: 1});
    const request2 = scheduler.scheduleRequest({id: 2});

    await flushScheduler();

    expect(scheduler.activeRequestCount, 'throttles with throttleRequests: true').toBe(1);
    const token1 = await expectIssuedRequest(request1, 'issues first request');
    token1.done();

    scheduler.setProps({throttleRequests: false});
    const request3 = scheduler.scheduleRequest({id: 3});
    const token3 = await expectIssuedRequest(
      request3,
      'issues request immediately with throttleRequests: false'
    );
    expect(scheduler.activeRequestCount, 'unthrottled requests are not tracked').toBe(0);
    token3.done();

    await flushScheduler();

    const token2 = await expectIssuedRequest(request2, 'queued request resolves after slot frees');
    token2.done();
  });
});
test('RequestScheduler#setProps - preserves active requests', async () => {
  await withFakeTimers(async () => {
    const scheduler = new RequestScheduler({maxRequests: 2});
    const request1 = scheduler.scheduleRequest({id: 1});
    const request2 = scheduler.scheduleRequest({id: 2});

    await flushScheduler();

    expect(scheduler.activeRequestCount, 'issues 2 requests').toBe(2);
    scheduler.setProps({maxRequests: 1});
    expect(scheduler.activeRequestCount, 'preserves active requests after setProps').toBe(2);

    const [token1, token2] = await Promise.all([
      expectIssuedRequest(request1, 'preserves first active request'),
      expectIssuedRequest(request2, 'preserves second active request')
    ]);
    token1.done();
    token2.done();
    expect(scheduler.activeRequestCount, 'completes all active requests').toBe(0);

    const request3 = scheduler.scheduleRequest({id: 3});
    const request4 = scheduler.scheduleRequest({id: 4});

    await flushScheduler();
    expect(scheduler.activeRequestCount, 'new requests respect updated maxRequests').toBe(1);
    const token3 = await expectIssuedRequest(request3, 'issues first queued request');
    token3.done();

    await flushScheduler();
    expect(scheduler.activeRequestCount, 'issues queued request after slot frees').toBe(1);
    const token4 = await expectIssuedRequest(request4, 'issues second queued request');
    token4.done();
  });
});
