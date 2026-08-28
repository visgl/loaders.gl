import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {DracoLoader} from '@loaders.gl/draco';
import * as draco from '@loaders.gl/draco';
import * as bundledDraco from '@loaders.gl/draco/bundled';
import * as unbundledDraco from '@loaders.gl/draco/unbundled';
import {setLoaderOptions, load, isBrowser} from '@loaders.gl/core';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
import {indexedMeshArrowSchema, meshArrowSchema} from '@loaders.gl/schema';
import draco3d from 'draco3d';
const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';
const CESIUM_TILE_URL = '@loaders.gl/draco/test/data/cesium-tile.drc';
setLoaderOptions({
  _workerType: 'test'
});
test('DracoLoader#loader conformance', () => {
  validateLoader(DracoLoader, 'DracoLoader');
});
test('DracoLoader#removed Arrow loader exports', () => {
  expect('DracoArrowLoader' in draco, 'root does not export DracoArrowLoader').toBeFalsy();
  expect(
    'DracoArrowLoader' in bundledDraco,
    'bundled does not export DracoArrowLoader'
  ).toBeFalsy();
  expect(
    'DracoArrowLoader' in unbundledDraco,
    'unbundled does not export DracoArrowLoader'
  ).toBeFalsy();
});
test('DracoLoader#parse(mainthread, shape: arrow-table)', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const table = await load(BUNNY_DRC_URL, DracoLoader, {
    worker: false,
    draco: {shape: 'arrow-table'}
  });
  // validateMeshCategoryData(t, data);
  const {data} = table;
  validateDracoMeshArrowTable(table);
  expect(data.numRows, 'number of rows is correct').toBe(104502 / 3);
  const positions = data.getChild('POSITION')!;
  expect(positions, 'POSITION attribute was found').toBeTruthy();
  expect(data.schema, 'Has arrow-like schema').toBeTruthy();
});
test('DracoLoader#draco3d npm package with shape: arrow-table', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  const table = await load(BUNNY_DRC_URL, DracoLoader, {
    worker: false,
    draco: {shape: 'arrow-table'},
    modules: {
      draco3d
    }
  });
  const {data} = table;
  // validateMeshCategoryData(t, data);
  validateDracoMeshArrowTable(table);
  expect(data.getChild('POSITION'), 'POSITION attribute was found').toBeTruthy();
});
test('DracoLoader#parse custom attributes(mainthread, shape: arrow-table)', async () => {
  if (skipBrowserDracoWasmTest()) {
    return;
  }
  let table = await load(CESIUM_TILE_URL, DracoLoader, {
    worker: false,
    draco: {shape: 'arrow-table'}
  });
  validateDracoMeshArrowTable(table);
  const {data} = table;
  expect(
    data.getChild('CUSTOM_ATTRIBUTE_2')?.data[0].length,
    'Custom (Intensity) attribute was found'
  ).toBe(173210);
  expect(
    data.getChild('CUSTOM_ATTRIBUTE_3')?.data[0].length,
    'Custom (Classification) attribute was found'
  ).toBe(173210);
  table = await load(CESIUM_TILE_URL, DracoLoader, {
    worker: false,
    draco: {
      shape: 'arrow-table',
      extraAttributes: {
        Intensity: 2,
        Classification: 3
      }
    }
  });
  validateDracoMeshArrowTable(table);
  expect(table.data.getChild('Intensity')?.data[0].length, 'Intensity attribute was found').toBe(
    173210
  );
  expect(
    table.data.getChild('Classification')?.data[0].length,
    'Classification attribute was found'
  ).toBe(173210);
});
/**
 * Skips Draco Arrow tests that depend on direct WASM module initialization in browser runs.
 */
function skipBrowserDracoWasmTest() {
  if (isBrowser) {
    console.log('Skipping Draco WASM main-thread test in browser');
    return true;
  }
  return false;
}
/**
 * Validates a Draco Arrow mesh table against the shared Mesh or IndexedMesh Arrow schema.
 */
function validateDracoMeshArrowTable(table) {
  const expectedSchema = table.data.getChild('indices') ? indexedMeshArrowSchema : meshArrowSchema;
  expect(
    () =>
      validateArrowTableSchema(table.data, expectedSchema, {
        schemaName: 'DracoLoader Mesh table'
      }),
    'Draco Arrow table matches the expected mesh Arrow schema'
  ).not.toThrow();
}
