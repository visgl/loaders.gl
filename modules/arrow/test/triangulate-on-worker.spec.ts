// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {triangulateOnWorker, TriangulationWorker} from '@loaders.gl/arrow';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';

// WORKER TESTS
test('TriangulationWorker#plumbing', async (t) => {
  const sourceData = {
    operation: 'test',
    data: new ArrayBuffer(100)
  };

  const triangulatedData = await processOnWorker(TriangulationWorker, sourceData, {
    _workerType: 'test'
  });

  t.ok(triangulatedData, 'Triangulation worker echoed input data');

  t.rejects(
    () =>
      processOnWorker(
        TriangulationWorker,
        {operation: 'error'},
        {
          _workerType: 'test'
        }
      ),
    'Triangulation worker throws on incorrect operation'
  );

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});

test.skip('triangulateOnWorker#plumbing', async (t) => {
  t.ok(triangulateOnWorker, 'triangulateOnWorker defined');
  /*
  const triangulatedData = await triangulateOnWorker(
    {
      operation: 'test',
      data: new ArrayBuffer(100)
    },
    {
      _workerType: 'test'
    }
  );

  t.equal(triangulatedData.operation, 'test', 'Triangulation worker got correct return type');
  if (triangulatedData.operation === 'test') {
    t.equal(triangulatedData.data?.byteLength, 100, 'Triangulation worker echoed input data');
  }

  // t.rejec(() => await processOnWorker(TriangulationWorker, sourceData, {
  //   operation: 'error',
  //   _workerType: 'test'
  // }), 'Triangulation worker throws on incorrect operation');
  */

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});
