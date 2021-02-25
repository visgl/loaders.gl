import test from 'tape-promise/tape';
import {
  getWorkerObjectURL,
  validateWorkerVersion
} from '@loaders.gl/worker-utils/lib/worker-api/worker-object-utils';
import {NullWorker} from '@loaders.gl/worker-utils';

test('getWorkerObjectURL', t => {
  t.equals(
    getWorkerObjectURL(NullWorker, {}),
    'https://unpkg.com/@loaders.gl/worker-utils@3.0.0-alpha.4/dist/null-worker.js',
    'worker url with no options'
  );

  t.equals(
    getWorkerObjectURL(NullWorker, {null: {workerUrl: 'custom-url'}}),
    'custom-url',
    'worker url with options.null.worker-url'
  );

  t.equals(
    getWorkerObjectURL(NullWorker, {_workerType: 'test'}),
    'modules/worker-utils/dist/null-worker.js',
    'worker url with _useLocalWorkers options'
  );

  t.end();
});

test('validateWorkerVersion', t => {
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
