import test from 'tape-promise/tape';
import {/* tessellateOnWorker, */ TessellationWorker} from '@loaders.gl/arrow';
import {processOnWorker, isBrowser, WorkerFarm} from '@loaders.gl/worker-utils';
// import {concatenateArrayBuffers, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
// import {getData, compareArrayBuffers} from './utils/test-utils';

// Import big dependencies

// const TEST_DATA = getData();

// WORKER TESTS
test.only('tessellateOnWorker#worker', async (t) => {
  const sourceData = new ArrayBuffer(100);

  const tessellatedData = await processOnWorker(TessellationWorker, sourceData, {
    operation: 'tessellate',
    _workerType: 'test'
  });

  t.ok(tessellatedData, 'Tesselation correct');

  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }

  t.end();
});
