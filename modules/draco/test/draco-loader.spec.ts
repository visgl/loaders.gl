import {expect, test} from 'vitest';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {DracoLoader, DracoWorkerLoader} from '@loaders.gl/draco';
import {setLoaderOptions, load, isBrowser} from '@loaders.gl/core';
import draco3d from 'draco3d';
const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';
const CESIUM_TILE_URL = '@loaders.gl/draco/test/data/cesium-tile.drc';
setLoaderOptions({
  _workerType: 'test'
});
test('DracoLoader#loader conformance', () => {
  validateLoader(DracoLoader, 'DracoLoader');
  validateLoader(DracoWorkerLoader, 'DracoWorkerLoader');
});
test('DracoLoader#parse(mainthread)', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await load(BUNNY_DRC_URL, DracoLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
  expect(data.schema, 'Has arrow-like schema').toBeTruthy();
});
test('DracoLoader#draco3d npm package', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const data = await load(BUNNY_DRC_URL, DracoLoader, {
    core: {worker: false},
    modules: {draco3d}
  });
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
});
test('DracoLoader#parse custom attributes(mainthread)', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  let data = await load(CESIUM_TILE_URL, DracoLoader, {
    core: {worker: false}
  });
  expect(
    data.attributes.CUSTOM_ATTRIBUTE_2.value.length,
    'Custom (Intensity) attribute was found'
  ).toBe(173210);
  expect(
    data.attributes.CUSTOM_ATTRIBUTE_3.value.length,
    'Custom (Classification) attribute was found'
  ).toBe(173210);
  data = await load(CESIUM_TILE_URL, DracoLoader, {
    core: {worker: false},
    draco: {
      extraAttributes: {
        Intensity: 2,
        Classification: 3
      }
    }
  });
  expect(data.attributes.Intensity.value.length, 'Intensity attribute was found').toBe(173210);
  expect(data.attributes.Classification.value.length, 'Classification attribute was found').toBe(
    173210
  );
});
/**
 * Skips Draco tests that depend on direct WASM module initialization in browser runs.
 */
function skipBrowserDracoWasmTest() {
  if (isBrowser) {
    console.log('Skipping Draco WASM main-thread test in browser');
    return true;
  }
  return false;
}
test('DracoWorkerLoader#parse', async () => {
  const data = await load(BUNNY_DRC_URL, DracoWorkerLoader, {_nodeWorkers: true});
  validateMeshCategoryData(data);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(104502);
});
