import test from 'tape-promise/tape';
import {isWorker} from '@loaders.gl/worker-utils';

test('globals', t => {
  t.notOk(isWorker, 'Main thread is not a worker');
  t.end();
});
