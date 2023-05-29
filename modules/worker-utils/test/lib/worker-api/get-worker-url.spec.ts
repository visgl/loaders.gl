import test from 'tape-promise/tape';
import {isBrowser} from '@loaders.gl/core';
import {NullWorker} from '@loaders.gl/worker-utils';
import {getWorkerURL} from '../../../src/lib/worker-api/get-worker-url';

test('getWorkerURL', (t) => {
  // TODO(ib): version injection issue in babel register
  // t.equals(
  //   getWorkerURL(NullWorker, {}),
  //   `https://unpkg.com/@loaders.gl/worker-utils@${VERSION}/dist/null-worker.js`,
  //   'worker url with no options'
  // );

  t.equals(
    getWorkerURL(NullWorker, {null: {workerUrl: 'custom-url'}}),
    'custom-url',
    'worker url with options.null.worker-url'
  );

  t.equals(
    getWorkerURL(NullWorker, {_workerType: 'test'}),
    isBrowser
      ? 'modules/worker-utils/dist/null-worker.js'
      : 'modules/worker-utils/dist/null-worker-node.js',
    'worker url with _useLocalWorkers options'
  );

  t.end();
});
