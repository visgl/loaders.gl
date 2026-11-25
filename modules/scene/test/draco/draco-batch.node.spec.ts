import {expect, test} from 'vitest';
import {DracoWriter} from '@loaders.gl/scene/draco/bundled';
import draco3d from 'draco3d';
import {destroyWorkerTasks} from '@loaders.gl/core/worker-utils';

const GEOMETRY = {
  attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
  indices: new Uint16Array([0, 1, 2])
};

test('DracoWriter.encodeGeometryBatch reports progress for each geometry', async () => {
  const progress: Array<{completed: number; total: number}> = [];
  const results = await DracoWriter.encodeGeometryBatch([GEOMETRY, GEOMETRY], {
    modules: {draco3d},
    onProgress: update => progress.push(update)
  });

  expect(results).toHaveLength(2);
  expect(progress).toEqual([
    {completed: 1, total: 2},
    {completed: 2, total: 2}
  ]);
});

test('DracoWriter.encodeGeometryBatch preserves AbortError semantics', async () => {
  const controller = new AbortController();
  controller.abort();

  await expect(
    DracoWriter.encodeGeometryBatch([GEOMETRY], {
      useLocalLibraries: true,
      signal: controller.signal
    })
  ).rejects.toMatchObject({name: 'AbortError'});
});

test('DracoWriter.encodeGeometryInBatches retains one worker session across input batches', async () => {
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
    for await (const result of DracoWriter.encodeGeometryInBatches(inputBatches, {
      worker: true,
      _nodeWorkers: true,
      'draco-writer': {workerUrl: 'modules/scene/dist/draco-writer-worker-node.cjs'},
      useLocalLibraries: true,
      maxConcurrency: 1
    })) {
      results.push(result);
    }
  } finally {
    await destroyWorkerTasks();
  }
  expect(results).toHaveLength(2);
  expect(results.every(result => result.data.byteLength > 0)).toBe(true);
});
