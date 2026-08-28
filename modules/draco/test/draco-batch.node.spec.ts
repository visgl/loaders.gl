import {expect, test} from 'vitest';
import {encodeDracoBatch, encodeDracoInBatches} from '@loaders.gl/draco';
import draco3d from 'draco3d';
import {WorkerFarm} from '@loaders.gl/worker-utils';

const GEOMETRY = {
  attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
  indices: new Uint16Array([0, 1, 2])
};

test('encodeDracoBatch reports progress for each geometry', async () => {
  const progress: Array<{completed: number; total: number}> = [];
  const results = await encodeDracoBatch([GEOMETRY, GEOMETRY], {
    modules: {draco3d},
    onProgress: update => progress.push(update)
  });

  expect(results).toHaveLength(2);
  expect(progress).toEqual([
    {completed: 1, total: 2},
    {completed: 2, total: 2}
  ]);
});

test('encodeDracoBatch preserves AbortError semantics', async () => {
  const controller = new AbortController();
  controller.abort();

  await expect(
    encodeDracoBatch([GEOMETRY], {useLocalLibraries: true, signal: controller.signal})
  ).rejects.toMatchObject({name: 'AbortError'});
});

test('encodeDracoInBatches retains one worker session across input batches', async () => {
  const createGeometry = () => ({
    attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
    indices: new Uint16Array([0, 1, 2])
  });
  const inputBatches = (async function* () {
    yield [createGeometry()];
    yield [createGeometry()];
  })();
  const results: Array<{data: ArrayBuffer}> = [];
  try {
    for await (const result of encodeDracoInBatches(inputBatches, {
      worker: true,
      _nodeWorkers: true,
      'draco-writer': {workerUrl: 'modules/draco/dist/draco-writer-worker-node.cjs'},
      useLocalLibraries: true,
      maxConcurrency: 1
    })) {
      results.push(result);
    }
  } finally {
    WorkerFarm.getWorkerFarm({}).destroy();
  }
  expect(results).toHaveLength(2);
  expect(results.every(result => result.data.byteLength > 0)).toBe(true);
});
