import {expect, test} from 'vitest';
import {encodeDracoBatch} from '@loaders.gl/draco';
import draco3d from 'draco3d';

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
