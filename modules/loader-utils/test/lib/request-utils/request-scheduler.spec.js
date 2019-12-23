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

  t.end();
});
