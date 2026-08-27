// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {
  decodeMeshoptCompression,
  validateMeshoptCompressionExclusivity
} from '../../../src/lib/extensions/meshopt-compression';
const KHR_MESHOPT_CUBE_URL =
  '@loaders.gl/gltf/test/data/meshopt/MeshoptCubeTest/glTF-Meshopt/MeshoptCubeTest.gltf';
test('KHR_meshopt_compression#decodes official version 1 fixture', async () => {
  const gltf = await load(KHR_MESHOPT_CUBE_URL, GLTFLoader, {
    gltf: {decompressMeshes: true, loadBuffers: true, loadImages: false}
  });
  const scenegraph = new GLTFScenegraph(gltf);
  expect(
    scenegraph.getRemovedExtensions().includes('KHR_meshopt_compression'),
    'records KHR_meshopt_compression as processed'
  ).toBeTruthy();
  expect(
    scenegraph.getUsedExtensions().includes('KHR_meshopt_compression'),
    'removes KHR_meshopt_compression from extensionsUsed'
  ).toBeFalsy();
  expect(
    scenegraph.getRequiredExtensions().includes('KHR_meshopt_compression'),
    'removes KHR_meshopt_compression from extensionsRequired'
  ).toBeFalsy();
  expect(
    gltf.json.buffers?.every(buffer => !buffer.extensions?.KHR_meshopt_compression),
    'removes fallback markers from destination buffers'
  ).toBeTruthy();
  expect(
    gltf.json.bufferViews?.every(bufferView => !bufferView.extensions?.KHR_meshopt_compression),
    'removes processed buffer-view extension objects'
  ).toBeTruthy();
  const losslessAccessorPairs = [
    [8, 92, 'positions'],
    [9, 93, 'normals']
  ] as const;
  for (const [uncompressedAccessorIndex, compressedAccessorIndex, label] of losslessAccessorPairs) {
    expect(
      scenegraph.getTypedArrayForAccessor(compressedAccessorIndex),
      `version 1 ${label} match the uncompressed reference`
    ).toEqual(scenegraph.getTypedArrayForAccessor(uncompressedAccessorIndex));
  }
  const uncompressedColors = scenegraph.getTypedArrayForAccessor(10) as Uint8Array;
  const compressedColors = scenegraph.getTypedArrayForAccessor(94) as Uint8Array;
  expect(
    Array.from(compressedColors).every(
      (component, componentIndex) => Math.abs(component - uncompressedColors[componentIndex]) <= 1
    ),
    'COLOR-filtered values stay within the expected one-byte rounding tolerance'
  ).toBeTruthy();
  const uncompressedIndices = scenegraph.getTypedArrayForAccessor(11) as Uint16Array;
  const compressedIndices = scenegraph.getTypedArrayForAccessor(95) as Uint16Array;
  expect(
    getCanonicalTriangleIndices(compressedIndices),
    'triangle indices match the reference independent of cyclic vertex rotation'
  ).toEqual(getCanonicalTriangleIndices(uncompressedIndices));
});
/**
 * Rotates each triangle so equivalent cyclic index orderings compare identically.
 *
 * Meshopt triangle decoding preserves winding but may cyclically rotate a triangle's three indices.
 *
 * @param indices Triangle-list indices to normalize.
 * @returns A flat array containing each triangle with its smallest index first.
 */
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
test('KHR_meshopt_compression#rejects KHR and EXT on one buffer view', () => {
  expect(
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
    'rejects the mutually exclusive buffer-view combination'
  ).toThrow(/bufferView 0 cannot use both KHR_meshopt_compression and EXT_meshopt_compression/);
  expect(
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
    'rejects the mutually exclusive buffer fallback combination'
  ).toThrow(/buffer 0 cannot use both KHR_meshopt_compression and EXT_meshopt_compression/);
});
test('KHR_meshopt_compression#preserves declarations when decoding fails', async () => {
  const sourceBytes = new Uint8Array([0]);
  const destinationBytes = new Uint8Array(4);
  const gltf = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_meshopt_compression'],
      extensionsRequired: ['KHR_meshopt_compression'],
      buffers: [
        {byteLength: sourceBytes.byteLength},
        {
          byteLength: destinationBytes.byteLength,
          extensions: {KHR_meshopt_compression: {fallback: true}}
        }
      ],
      bufferViews: [
        {
          buffer: 1,
          byteLength: destinationBytes.byteLength,
          extensions: {
            KHR_meshopt_compression: {
              buffer: 0,
              byteLength: sourceBytes.byteLength,
              byteStride: 4,
              count: 1,
              mode: 'ATTRIBUTES'
            }
          }
        }
      ]
    },
    buffers: [
      {arrayBuffer: sourceBytes.buffer, byteOffset: 0, byteLength: sourceBytes.byteLength},
      {
        arrayBuffer: destinationBytes.buffer,
        byteOffset: 0,
        byteLength: destinationBytes.byteLength
      }
    ],
    images: []
  };
  await expect(
    decodeMeshoptCompression(
      gltf,
      {gltf: {decompressMeshes: true, loadBuffers: true}},
      'KHR_meshopt_compression'
    ),
    'reports malformed compressed data'
  ).rejects.toThrow(/Malformed buffer data/);
  expect(
    gltf.json.bufferViews[0].extensions.KHR_meshopt_compression,
    'retains the buffer-view declaration'
  ).toBeTruthy();
  expect(
    gltf.json.buffers[1].extensions.KHR_meshopt_compression,
    'retains the fallback-buffer marker'
  ).toBeTruthy();
  expect(
    gltf.json.extensionsRequired.includes('KHR_meshopt_compression'),
    'retains the required capability declaration'
  ).toBeTruthy();
});
