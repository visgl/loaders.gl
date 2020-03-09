import {RequestScheduler} from '@loaders.gl/loader-utils';
import test from 'tape-promise/tape';

test('RequestScheduler#constructor', t => {
  const requestScheduler = new RequestScheduler();
  t.ok(requestScheduler);
  t.end();
});

test('RequestScheduler#scheduleRequest', async t => {
  const requestScheduler = new RequestScheduler({maxRequests: 1});
  t.ok(requestScheduler);

  let result = await requestScheduler.scheduleRequest({id: 1});
  t.ok(result, 'should issue request');

  result = await requestScheduler.scheduleRequest({id: 2}, () => -1);
  t.notOk(result, 'should not issue request with negative priority');

  // The following test checks that request#4 is only issued AFTER request#3 is resolved
  // By modifying request#4's priority during request#3
  let priority4 = 0;
  const request3 = async () => {
    priority4 = -1;
  };

  result = await Promise.all([
    requestScheduler.scheduleRequest({id: 3}).then(async () => {
      requestScheduler.startRequest({id: 3});
      await request3();
      requestScheduler.endRequest({id: 3});
    }),
    // priority callback should be called after the previous one is fully resolved
    requestScheduler.scheduleRequest({id: 4}, () => priority4)
  ]);

  t.notOk(result[1]);

  t.end();
});
