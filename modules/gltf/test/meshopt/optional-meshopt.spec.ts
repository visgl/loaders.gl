// SPDX-License-Identifier: MIT
import {expect, test, vi} from 'vitest';

vi.mock('../../src/meshopt/meshopt-module-loader', () => ({
  loadMeshoptModule: () => Promise.reject(new Error('meshoptimizer is not installed'))
}));

test('glTF root and parser imports work without the optional meshopt decoder', async () => {
  const {GLTFLoader} = await import('../../src/index');
  expect(GLTFLoader.id).toBe('gltf');
  const {GLTFLoaderWithParser} = await import('../../src/gltf-loader-with-parser');
  const result = await GLTFLoaderWithParser.parse!(
    new TextEncoder().encode('{"asset":{"version":"2.0"},"scenes":[{"nodes":[]}],"scene":0}')
      .buffer,
    {gltf: {loadBuffers: false, loadImages: false}},
    {} as never
  );
  expect(result.json.asset.version).toBe('2.0');
});

test('missing meshoptimizer fails only when decoding is requested and can be retried', async () => {
  const {meshoptDecodeGltfBuffer} = await import('../../src/meshopt/meshopt-decoder');
  for (let attemptIndex = 0; attemptIndex < 2; attemptIndex++) {
    await expect(
      meshoptDecodeGltfBuffer(new Uint8Array(4), 1, 4, new Uint8Array(0), 'ATTRIBUTES')
    ).rejects.toThrow('Install meshoptimizer');
  }
});
