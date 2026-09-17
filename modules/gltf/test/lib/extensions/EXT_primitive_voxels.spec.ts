import {expect, test} from 'vitest';
import {getVoxelPrimitives} from '@loaders.gl/gltf';
import {decode} from '../../../src/lib/extensions/EXT_primitive_voxels';

test('EXT_primitive_voxels exposes a lazy descriptor', async () => {
  const gltf = {
    json: {
      asset: {version: '2.0'},
      accessors: [{}],
      meshes: [
        {
          primitives: [
            {
              mode: 2147483647,
              attributes: {DENSITY: 0},
              extensions: {EXT_primitive_voxels: {shape: 0, dimensions: [8, 8, 8]}}
            }
          ]
        }
      ]
    },
    buffers: []
  } as any;
  await expect(decode(gltf)).resolves.toBeUndefined();
  expect(getVoxelPrimitives(gltf)).toHaveLength(1);
});
