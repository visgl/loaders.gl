import test from 'tape-promise/tape';
import {processOnWorker, NullWorker, isBrowser} from '@loaders.gl/worker-utils';

test('processOnWorker', async (t) => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const nullData = await processOnWorker(NullWorker, 'abc', {
    _workerType: 'test'
  });

  t.equal(nullData, 'abc', 'NullWorker verified');
  t.end();
});
