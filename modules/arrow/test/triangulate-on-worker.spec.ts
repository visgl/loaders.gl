import test from 'tape-promise/tape';
import {/* triangulateOnWorker, */ TriangulationWorker} from '@loaders.gl/arrow';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
// import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
// import {getData, compareArrayBuffers} from './utils/test-utils';

// Import big dependencies

// const TEST_DATA = getData();

// WORKER TESTS
test('triangulateOnWorker#worker', async (t) => {
  const sourceData = new ArrayBuffer(100);

  const triangulatedData = await processOnWorker(TriangulationWorker, sourceData, {
    operation: 'test',
    _workerType: 'test'
  });

  t.ok(triangulatedData, 'Tesselation worker echoed input data');

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});
