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
  t.ok(result);

  result = await requestScheduler.scheduleRequest({id: 2}, () => -1);
  t.notOk(result);

  let priority = 0;
  result = await Promise.all([
    requestScheduler.scheduleRequest({id: 3}).then(() => {
      requestScheduler.startRequest({id: 3});
      priority = -1;
      requestScheduler.endRequest({id: 3});
    }),
    // Should be resolved after the previous one
    requestScheduler.scheduleRequest({id: 4}, () => priority)
  ]);

  t.notOk(result[1]);

  t.end();
});
