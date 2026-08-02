import test from 'tape-promise/tape';
import {load} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {validateMeshoptCompressionExclusivity} from '../../../src/lib/extensions/meshopt-compression';

const KHR_MESHOPT_CUBE_URL =
  '@loaders.gl/gltf/test/data/meshopt/MeshoptCubeTest/glTF-Meshopt/MeshoptCubeTest.gltf';

test('KHR_meshopt_compression#decodes official version 1 fixture', async t => {
  const gltf = await load(KHR_MESHOPT_CUBE_URL, GLTFLoader, {
    gltf: {decompressMeshes: true, loadBuffers: true, loadImages: false}
  });
  const scenegraph = new GLTFScenegraph(gltf);

  t.ok(
    scenegraph.getRemovedExtensions().includes('KHR_meshopt_compression'),
    'records KHR_meshopt_compression as processed'
  );
  t.notOk(
    scenegraph.getUsedExtensions().includes('KHR_meshopt_compression'),
    'removes KHR_meshopt_compression from extensionsUsed'
  );
  t.notOk(
    scenegraph.getRequiredExtensions().includes('KHR_meshopt_compression'),
    'removes KHR_meshopt_compression from extensionsRequired'
  );
  t.ok(
    gltf.json.buffers?.every(buffer => !buffer.extensions?.KHR_meshopt_compression),
    'removes fallback markers from destination buffers'
  );
  t.ok(
    gltf.json.bufferViews?.every(bufferView => !bufferView.extensions?.KHR_meshopt_compression),
    'removes processed buffer-view extension objects'
  );

  const losslessAccessorPairs = [
    [8, 92, 'positions'],
    [9, 93, 'normals']
  ] as const;
  for (const [uncompressedAccessorIndex, compressedAccessorIndex, label] of losslessAccessorPairs) {
    t.deepEqual(
      scenegraph.getTypedArrayForAccessor(compressedAccessorIndex),
      scenegraph.getTypedArrayForAccessor(uncompressedAccessorIndex),
      `version 1 ${label} match the uncompressed reference`
    );
  }

  const uncompressedColors = scenegraph.getTypedArrayForAccessor(10) as Uint8Array;
  const compressedColors = scenegraph.getTypedArrayForAccessor(94) as Uint8Array;
  t.ok(
    Array.from(compressedColors).every(
      (component, componentIndex) => Math.abs(component - uncompressedColors[componentIndex]) <= 1
    ),
    'COLOR-filtered values stay within the expected one-byte rounding tolerance'
  );

  const uncompressedIndices = scenegraph.getTypedArrayForAccessor(11) as Uint16Array;
  const compressedIndices = scenegraph.getTypedArrayForAccessor(95) as Uint16Array;
  t.deepEqual(
    getCanonicalTriangleIndices(compressedIndices),
    getCanonicalTriangleIndices(uncompressedIndices),
    'triangle indices match the reference independent of cyclic vertex rotation'
  );

  t.end();
});

/** Rotates each triangle so its smallest index comes first while preserving winding order. */
function getCanonicalTriangleIndices(indices: Uint16Array): number[] {
  const canonicalIndices: number[] = [];
  for (let triangleOffset = 0; triangleOffset < indices.length; triangleOffset += 3) {
    const triangle = Array.from(indices.subarray(triangleOffset, triangleOffset + 3));
    const minimumIndexOffset = triangle.indexOf(Math.min(...triangle));
    canonicalIndices.push(
      triangle[minimumIndexOffset],
      triangle[(minimumIndexOffset + 1) % 3],
      triangle[(minimumIndexOffset + 2) % 3]
    );
  }
  return canonicalIndices;
}

test('KHR_meshopt_compression#rejects KHR and EXT on one buffer view', t => {
  t.throws(
    () =>
      validateMeshoptCompressionExclusivity({
        asset: {version: '2.0'},
        bufferViews: [
          {
            buffer: 0,
            byteLength: 4,
            extensions: {
              KHR_meshopt_compression: {},
              EXT_meshopt_compression: {}
            }
          }
        ]
      }),
    /bufferView 0 cannot use both KHR_meshopt_compression and EXT_meshopt_compression/,
    'rejects the mutually exclusive buffer-view combination'
  );
  t.throws(
    () =>
      validateMeshoptCompressionExclusivity({
        asset: {version: '2.0'},
        buffers: [
          {
            byteLength: 4,
            extensions: {
              KHR_meshopt_compression: {},
              EXT_meshopt_compression: {}
            }
          }
        ]
      }),
    /buffer 0 cannot use both KHR_meshopt_compression and EXT_meshopt_compression/,
    'rejects the mutually exclusive buffer fallback combination'
  );
  t.end();
});
