import {expect, test} from 'vitest';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {QuantizedMeshLoader, QuantizedMeshWorkerLoader} from '@loaders.gl/terrain';
import {setLoaderOptions, load} from '@loaders.gl/core';
const TILE_WITH_EXTENSIONS_URL = '@loaders.gl/terrain/test/data/tile-with-extensions.terrain';
const EXPECTED_TILE_VERTEX_COUNT = typeof window === 'undefined' ? 627 : 781;
const EXPECTED_TILE_TRIANGLE_COUNT = typeof window === 'undefined' ? 1175 : 1329;
setLoaderOptions({
  _workerType: 'test'
});
test('QuantizedMeshLoader#loader objects', async () => {
  validateLoader(QuantizedMeshLoader, 'QuantizedMeshLoader');
  validateLoader(QuantizedMeshWorkerLoader, 'QuantizedMeshWorkerLoader');
});
test('QuantizedMeshLoader#parse tile-with-extensions', async () => {
  const data = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshLoader);
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBe(EXPECTED_TILE_TRIANGLE_COUNT * 3);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(
    EXPECTED_TILE_VERTEX_COUNT * 2
  );
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(
    EXPECTED_TILE_VERTEX_COUNT * 3
  );
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('QuantizedMeshLoader#add skirt to tile-with-extensions', async () => {
  const options = {'quantized-mesh': {skirtHeight: 50}};
  const data = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshLoader, options);
  expect(data.indices.value.length, 'indices was found').toBe(1329 * 3);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(781 * 2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(781 * 3);
});
test('QuantizedMeshWorkerLoader#tile-with-extensions', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const data = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshWorkerLoader);
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBe(EXPECTED_TILE_TRIANGLE_COUNT * 3);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(
    EXPECTED_TILE_VERTEX_COUNT * 2
  );
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(
    EXPECTED_TILE_VERTEX_COUNT * 3
  );
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
