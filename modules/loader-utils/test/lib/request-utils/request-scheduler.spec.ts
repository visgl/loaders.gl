import {RequestScheduler} from '@loaders.gl/loader-utils';
import test from 'tape-promise/tape';

const sleep = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

test('RequestScheduler#constructor', (t) => {
  const requestScheduler = new RequestScheduler();
  t.ok(requestScheduler);
  t.end();
});

test('RequestScheduler#scheduleRequest', async (t) => {
  const requestScheduler = new RequestScheduler({maxRequests: 1});
  t.ok(requestScheduler);

  let requestToken = await requestScheduler.scheduleRequest({id: 1});
  if (!requestToken) {
    t.fail('should issue request');
    return;
  }

  t.is(requestScheduler.activeRequestCount, 1, 'active request count');
  requestToken.done();
  t.is(requestScheduler.activeRequestCount, 0, 'active request count');

  requestToken.done();
  t.is(requestScheduler.activeRequestCount, 0, 'active request count');

  requestToken = await requestScheduler.scheduleRequest({id: 2}, () => -1);
  t.notOk(requestToken, 'should not issue request with negative priority');
  t.is(requestScheduler.activeRequestCount, 0, 'active request count');

  // The following test checks that request#4 is only issued AFTER request#3 is resolved
  // By modifying request#4's priority during request#3
  let priority4 = 0;
  const request3 = async () => {
    priority4 = -1;
  };

  const result = await Promise.all([
    requestScheduler.scheduleRequest({id: 3}).then(async (reqToken) => {
      if (!reqToken) {
        t.fail('should issue request');
        return;
      }
      t.is(requestScheduler.activeRequestCount, 1, 'active request count');
      await request3();
      reqToken.done();
      t.is(requestScheduler.activeRequestCount, 0, 'active request count');
    }),
    // priority callback should be called after the previous one is fully resolved
    requestScheduler.scheduleRequest({id: 4}, () => priority4)
  ]);

  t.notOk(result[1]);
  t.is(requestScheduler.activeRequestCount, 0, 'active request count');

  t.end();
});

test('RequestScheduler#debounce', async (t) => {
  const scheduler = new RequestScheduler({debounceTime: 0, maxRequests: 1});
  const schedulerDebounced = new RequestScheduler({debounceTime: 10, maxRequests: 1});

  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = schedulerDebounced.scheduleRequest({id: 2});
  const request3 = schedulerDebounced.scheduleRequest({id: 3});

  await sleep(0);

  t.is(scheduler.activeRequestCount, 1, 'issues default request');
  t.is(schedulerDebounced.activeRequestCount, 0, 'delays debounced requests');

  await sleep(50);

  t.is(schedulerDebounced.activeRequestCount, 1, 'issues first debounced request after delay');

  const token1 = await request1;
  const token2 = await request2;

  if (token1 && token2) {
    token1.done();
    token2.done();
  } else {
    t.fail('should issue both initial requests');
  }

  t.is(scheduler.activeRequestCount, 0, 'no active requests on scheduler #1');
  t.is(schedulerDebounced.activeRequestCount, 0, 'no active requests on scheduler #2');

  await sleep(50);

  t.is(schedulerDebounced.activeRequestCount, 1, 'issues final debounced request after delay');

  const token3 = await request3;

  if (token3) {
    token3.done();
  } else {
    t.fail('should issue final request');
  }

  t.end();
});

test('RequestScheduler#setProps - update maxRequests', async (t) => {
  const scheduler = new RequestScheduler({maxRequests: 2});

  // Schedule 3 requests with maxRequests = 2
  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = scheduler.scheduleRequest({id: 2});
  const request3 = scheduler.scheduleRequest({id: 3});

  await sleep(0);

  t.is(scheduler.activeRequestCount, 2, 'issues 2 requests initially');

  // Increase maxRequests to 3
  scheduler.setProps({maxRequests: 3});

  const token1 = await request1;
  const token2 = await request2;

  if (token1 && token2) {
    token1.done();
    token2.done();
  } else {
    t.fail('should issue first 2 requests');
  }

  await sleep(0);

  t.is(scheduler.activeRequestCount, 1, 'issues 3rd request after maxRequests increased');

  const token3 = await request3;
  if (token3) {
    token3.done();
  } else {
    t.fail('should issue 3rd request');
  }

  t.end();
});

test('RequestScheduler#setProps - update debounceTime', async (t) => {
  const scheduler = new RequestScheduler({debounceTime: 0, maxRequests: 1});

  const request1 = scheduler.scheduleRequest({id: 1});

  await sleep(0);

  t.is(scheduler.activeRequestCount, 1, 'issues request immediately with debounceTime: 0');

  const token1 = await request1;
  if (token1) {
    token1.done();
  }

  // Update debounceTime to 10ms
  scheduler.setProps({debounceTime: 10});

  const request2 = scheduler.scheduleRequest({id: 2});

  await sleep(0);

  t.is(scheduler.activeRequestCount, 0, 'delays request with debounceTime: 10');

  await sleep(20);

  t.is(scheduler.activeRequestCount, 1, 'issues request after debounce delay');

  const token2 = await request2;
  if (token2) {
    token2.done();
  }

  t.end();
});

test('RequestScheduler#setProps - update throttleRequests', async (t) => {
  const scheduler = new RequestScheduler({throttleRequests: true, maxRequests: 1});

  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = scheduler.scheduleRequest({id: 2});

  await sleep(0);

  t.is(scheduler.activeRequestCount, 1, 'throttles with throttleRequests: true');

  const token1 = await request1;
  if (token1) {
    token1.done();
  }

  // Disable throttling
  scheduler.setProps({throttleRequests: false});

  const request3 = scheduler.scheduleRequest({id: 3});
  const token3 = await request3;

  t.ok(token3, 'issues request immediately with throttleRequests: false');
  t.is(scheduler.activeRequestCount, 0, 'unthrottled requests are not tracked');

  if (token3) {
    token3.done();
  }

  await sleep(0);

  const token2 = await request2;
  if (token2) {
    token2.done();
  }

  t.end();
});

test('RequestScheduler#setProps - preserves active requests', async (t) => {
  const scheduler = new RequestScheduler({maxRequests: 2});

  const request1 = scheduler.scheduleRequest({id: 1});
  const request2 = scheduler.scheduleRequest({id: 2});

  await sleep(0);

  t.is(scheduler.activeRequestCount, 2, 'issues 2 requests');

  // Reduce maxRequests while requests are active
  scheduler.setProps({maxRequests: 1});

  t.is(scheduler.activeRequestCount, 2, 'preserves active requests after setProps');

  const token1 = await request1;
  const token2 = await request2;

  if (token1 && token2) {
    token1.done();
    token2.done();
  } else {
    t.fail('should preserve active requests');
  }

  t.is(scheduler.activeRequestCount, 0, 'completes all active requests');

  // New requests should respect new maxRequests
  const request3 = scheduler.scheduleRequest({id: 3});
  const request4 = scheduler.scheduleRequest({id: 4});

  await sleep(0);

  t.is(scheduler.activeRequestCount, 1, 'new requests respect updated maxRequests');

  const token3 = await request3;
  if (token3) {
    token3.done();
  }

  await sleep(0);

  t.is(scheduler.activeRequestCount, 1, 'issues queued request after slot frees');

  const token4 = await request4;
  if (token4) {
    token4.done();
  }

  t.end();
});
