/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {load, parseSync, fetchFile} from '@loaders.gl/core';
import {GLBLoader} from '@loaders.gl/gltf/bundled';
import {createGLBV3} from './test-utils/create-glb-v3';

const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/gltf-2.0/2CylinderEngine.glb';
const GLB_V1_TILE_CESIUM_AIR_URL = '@loaders.gl/gltf/test/data/3d-tiles/Cesium_Air.glb';

test('GLBLoader#loader conformance', t => {
  validateLoader(t, GLBLoader, 'GLBLoader');
  t.end();
});

test('GLBLoader#parseSync(v2)', async t => {
  const response = await fetchFile(GLTF_BINARY_URL);
  const data = await response.arrayBuffer();
  const glbv2 = parseSync(data, GLBLoader);
  t.equal(glbv2.version, 2, 'GLBLoader returned correct glb version');
  t.equal(glbv2.json.asset.version, '2.0', 'GLBLoader returned correct gltf version');

  t.end();
});

test('GLBLoader#load(v2)', async t => {
  const glbv2 = await load(GLTF_BINARY_URL, GLBLoader);
  t.equal(glbv2.version, 2, 'GLBLoader returned correct glb version');
  t.equal(glbv2.json.asset.version, '2.0', 'GLBLoader returned correct gltf version');
  t.end();
});

test('GLBLoader#load(v1)', async t => {
  const glbv1 = await load(GLB_V1_TILE_CESIUM_AIR_URL, GLBLoader);
  t.equal(glbv1.version, 1, 'GLBLoader returned correct glb version');
  t.equal(glbv1.json.asset.version, '1.0', 'GLBLoader returned parsed data');
  t.end();
});

test('GLBLoader#parseSync(v3)', t => {
  const data = createGLBV3({asset: {version: '2.1'}}, [new Uint8Array([1, 2, 3, 4])]);
  const glbv3 = parseSync(data, GLBLoader);

  t.equal(glbv3.version, 3, 'GLBLoader returned correct glb version');
  t.equal(glbv3.header.byteLength, data.byteLength, 'GLBLoader read the 64-bit file length');
  t.equal(glbv3.json.asset.version, '2.1', 'GLBLoader returned correct gltf version');
  t.equal(glbv3.jsonChunkIndex, 0, 'GLBLoader records the JSON chunk index');
  t.equal(glbv3.binChunks.length, 1, 'GLBLoader returned the BIN chunk');
  t.equal(glbv3.binChunks[0].chunkIndex, 1, 'GLBLoader records the BIN chunk index');
  t.equal(glbv3.binChunks[0].byteLength, 4, 'GLBLoader read the 64-bit chunk length');

  t.end();
});

test('GLBLoader#parseSync(v3) preserves absolute chunk indices', t => {
  const data = createGLBV3(
    {asset: {version: '2.1'}},
    [new Uint8Array([1, 2, 3, 4]), new Uint8Array([5, 6, 7, 8])],
    [{type: 0x54534554, data: new Uint8Array([9, 10, 11, 12])}]
  );
  const glbv3 = parseSync(data, GLBLoader);

  t.equal(glbv3.jsonChunkIndex, 1, 'finds the first JSON chunk after a custom chunk');
  t.deepEqual(
    glbv3.binChunks.map(chunk => chunk.chunkIndex),
    [2, 3],
    'records BIN indices in the full chunk sequence'
  );
  t.end();
});

test('GLBLoader#parseSync(v3) rejects unsupported chunk encoding', t => {
  const data = createGLBV3({asset: {version: '2.1'}});
  const dataView = new DataView(data);
  dataView.setUint32(20, 1, true);

  t.throws(() => parseSync(data, GLBLoader), /Unsupported GLB chunk encoding 1/);
  t.end();
});

test('GLBLoader#parseSync(v3) rejects unsafe 64-bit lengths', t => {
  const data = new ArrayBuffer(16);
  const dataView = new DataView(data);
  dataView.setUint32(0, 0x46546c67, true);
  dataView.setUint32(4, 3, true);
  dataView.setBigUint64(8, BigInt(Number.MAX_SAFE_INTEGER) + 1n, true);

  t.throws(
    () => parseSync(data, GLBLoader),
    /GLB byte length exceeds JavaScript's safe integer range/
  );
  t.end();
});
