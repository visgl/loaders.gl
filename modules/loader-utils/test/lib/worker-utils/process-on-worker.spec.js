import test from 'tape-promise/tape';
import {NullWorker, isBrowser} from '@loaders.gl/loader-utils';
import {processOnWorker} from '@loaders.gl/loader-utils';

test('processOnWorker', async t => {
  if (!isBrowser) {
    t.end();
    return;
  }

  const nullData = await processOnWorker(NullWorker, 'abc', {
    null: {
      workerUrl: 'test'
    }
  });

  t.equal(nullData, 'abc', 'Null verified');
  t.end();
});
