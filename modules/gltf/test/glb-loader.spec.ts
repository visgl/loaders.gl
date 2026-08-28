// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {load, parseSync, fetchFile} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf/bundled';
import {createGLBV3} from './test-utils/create-glb-v3';
const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';
const GLB_V1_TILE_CESIUM_AIR_URL = '@loaders.gl/gltf/test/data/3d-tiles/Cesium_Air.glb';
test('GLBLoader#loader conformance', () => {
  validateLoader(GLBLoader, 'GLBLoader');
});
test('GLBLoader#parseSync(v2)', async () => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const glbv2 = parseSync(data, GLBLoader);
  expect(glbv2.version, 'GLBLoader returned correct glb version').toBe(2);
  expect(glbv2.json.asset.version, 'GLBLoader returned correct gltf version').toBe('2.0');
});
test('GLBLoader#load(v2)', async () => {
  const glbv2 = await load(GLTF_BINARY_URL, GLBLoader);
  expect(glbv2.version, 'GLBLoader returned correct glb version').toBe(2);
  expect(glbv2.json.asset.version, 'GLBLoader returned correct gltf version').toBe('2.0');
});
test('GLBLoader#load(v1)', async () => {
  const glbv1 = await load(GLB_V1_TILE_CESIUM_AIR_URL, GLBLoader);
  expect(glbv1.version, 'GLBLoader returned correct glb version').toBe(1);
  expect(glbv1.json.asset.version, 'GLBLoader returned parsed data').toBe('1.0');
});
test('GLBLoader#parseSync(v3)', () => {
  const data = createGLBV3({asset: {version: '2.1'}}, [new Uint8Array([1, 2, 3, 4])]);
  const glbv3 = parseSync(data, GLBLoader);
  expect(glbv3.version, 'GLBLoader returned correct glb version').toBe(3);
  expect(glbv3.header.byteLength, 'GLBLoader read the 64-bit file length').toBe(data.byteLength);
  expect(glbv3.json.asset.version, 'GLBLoader returned correct gltf version').toBe('2.1');
  expect(glbv3.jsonChunkIndex, 'GLBLoader records the JSON chunk index').toBe(0);
  expect(glbv3.binChunks.length, 'GLBLoader returned the BIN chunk').toBe(1);
  expect(glbv3.binChunks[0].chunkIndex, 'GLBLoader records the BIN chunk index').toBe(1);
  expect(glbv3.binChunks[0].byteLength, 'GLBLoader read the 64-bit chunk length').toBe(4);
});
test('GLBLoader#parseSync(v3) preserves absolute chunk indices', () => {
  const data = createGLBV3(
    {asset: {version: '2.1'}},
    [new Uint8Array([1, 2, 3, 4]), new Uint8Array([5, 6, 7, 8])],
    [{type: 0x54534554, data: new Uint8Array([9, 10, 11, 12])}]
  );
  const glbv3 = parseSync(data, GLBLoader);
  expect(glbv3.jsonChunkIndex, 'finds the first JSON chunk after a custom chunk').toBe(1);
  expect(
    glbv3.binChunks.map(chunk => chunk.chunkIndex),
    'records BIN indices in the full chunk sequence'
  ).toEqual([2, 3]);
});
test('GLBLoader#parseSync(v3) rejects unsupported chunk encoding', () => {
  const data = createGLBV3({asset: {version: '2.1'}});
  const dataView = new DataView(data);
  dataView.setUint32(20, 1, true);
  expect(() => parseSync(data, GLBLoader)).toThrow(/Unsupported GLB chunk encoding 1/);
});
test('GLBLoader#parseSync(v3) rejects unsafe 64-bit lengths', () => {
  const data = new ArrayBuffer(16);
  const dataView = new DataView(data);
  dataView.setUint32(0, 0x46546c67, true);
  dataView.setUint32(4, 3, true);
  dataView.setBigUint64(8, BigInt(Number.MAX_SAFE_INTEGER) + 1n, true);
  expect(() => parseSync(data, GLBLoader)).toThrow(
    /GLB byte length exceeds JavaScript's safe integer range/
  );
});
