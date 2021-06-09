import {RequestScheduler} from '@loaders.gl/loader-utils';
import test from 'tape-promise/tape';

test('RequestScheduler#constructor', (t) => {
  const requestScheduler = new RequestScheduler();
  t.ok(requestScheduler);
  t.end();
});

test('RequestScheduler#scheduleRequest', async (t) => {
  const requestScheduler = new RequestScheduler({maxRequests: 1});
  t.ok(requestScheduler);

  let requestToken = await requestScheduler.scheduleRequest({id: 1});
  t.ok(requestToken, 'should issue request');
  if (requestToken) {
    t.is(requestScheduler.activeRequestCount, 1, 'active request count');
    requestToken.done();
    t.is(requestScheduler.activeRequestCount, 0, 'active request count');

    requestToken.done();
    t.is(requestScheduler.activeRequestCount, 0, 'active request count');

    requestToken = await requestScheduler.scheduleRequest({id: 2}, () => -1);
    t.notOk(requestToken, 'should not issue request with negative priority');
    t.is(requestScheduler.activeRequestCount, 0, 'active request count');
  }

  // The following test checks that request#4 is only issued AFTER request#3 is resolved
  // By modifying request#4's priority during request#3
  let priority4 = 0;
  const request3 = async () => {
    priority4 = -1;
  };

  const result = await Promise.all([
    requestScheduler.scheduleRequest({id: 3}).then(async (reqToken) => {
      t.is(requestScheduler.activeRequestCount, 1, 'active request count');
      await request3();
      if (reqToken) {
        reqToken.done();
      }
      t.is(requestScheduler.activeRequestCount, 0, 'active request count');
    }),
    // priority callback should be called after the previous one is fully resolved
    requestScheduler.scheduleRequest({id: 4}, () => priority4)
  ]);

  t.notOk(result[1]);
  t.is(requestScheduler.activeRequestCount, 0, 'active request count');

  t.end();
});
