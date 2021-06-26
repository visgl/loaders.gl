import test from 'tape-promise/tape';
// import {isBrowser} from '@loaders.gl/core';
import {getWorkerURL} from '@loaders.gl/worker-utils/lib/worker-api/get-worker-url';
import {validateWorkerVersion} from '@loaders.gl/worker-utils/lib/worker-api/validate-worker-version';
import {NullWorker} from '@loaders.gl/worker-utils';

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
    'modules/worker-utils/dist/null-worker.js',
    'worker url with _useLocalWorkers options'
  );

  t.end();
});

test('validateWorkerVersion', (t) => {
  t.doesNotThrow(
    // @ts-ignore
    () => validateWorkerVersion({version: '1.9.0'}, null),
    'missing version is ignored'
  );
  // @ts-ignore
  t.doesNotThrow(() => validateWorkerVersion({}, '1.10.0'), 'missing version is ignored');
  // @ts-ignore
  t.doesNotThrow(() => validateWorkerVersion({version: '1.10.0'}, '1.10.3'), 'version is valid');
  // TODO enable when fixed
  // t.throws(() => validateWorkerVersion({version: '1.9.0'}, '1.10.0'), 'version is not valid');
  // t.throws(
  //   () => validateWorkerVersion({version: '1.10.0'}, '2.0.0-alpha.1'),
  //   'version is not valid'
  // );

  t.end();
});
