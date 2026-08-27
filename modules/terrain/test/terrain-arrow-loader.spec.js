import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import {TerrainLoader, QuantizedMeshLoader} from '@loaders.gl/terrain';
import * as terrain from '@loaders.gl/terrain';
import * as bundledTerrain from '@loaders.gl/terrain/bundled';
import * as unbundledTerrain from '@loaders.gl/terrain/unbundled';
import {setLoaderOptions, load, registerLoaders} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';
import {validateArrowTableSchema} from '@loaders.gl/arrow';
import {indexedMeshArrowSchema} from '@loaders.gl/schema';
registerLoaders([ImageLoader]);
const TERRARIUM_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/terrarium.png';
const TILE_WITH_EXTENSIONS_URL = '@loaders.gl/terrain/test/data/tile-with-extensions.terrain';
setLoaderOptions({
  _workerType: 'test'
});
test('TerrainLoader#loader objects', () => {
  validateLoader(TerrainLoader, 'TerrainLoader');
  validateLoader(QuantizedMeshLoader, 'QuantizedMeshLoader');
});
test('TerrainLoader#removed Arrow loader exports', () => {
  expect('TerrainArrowLoader' in terrain, 'root does not export TerrainArrowLoader').toBeFalsy();
  expect(
    'QuantizedMeshArrowLoader' in terrain,
    'root does not export QuantizedMeshArrowLoader'
  ).toBeFalsy();
  expect(
    'TerrainArrowLoader' in bundledTerrain,
    'bundled does not export TerrainArrowLoader'
  ).toBeFalsy();
  expect(
    'QuantizedMeshArrowLoader' in bundledTerrain,
    'bundled does not export QuantizedMeshArrowLoader'
  ).toBeFalsy();
  expect(
    'TerrainArrowLoader' in unbundledTerrain,
    'unbundled does not export TerrainArrowLoader'
  ).toBeFalsy();
  expect(
    'QuantizedMeshArrowLoader' in unbundledTerrain,
    'unbundled does not export QuantizedMeshArrowLoader'
  ).toBeFalsy();
});
test('TerrainLoader#parse terrarium martini with shape: arrow-table', async () => {
  const table = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainLoader, {
    worker: false,
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625],
      tesselator: 'martini',
      shape: 'arrow-table'
    }
  });
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'TerrainLoader IndexedMesh table'
  });
  expect(getArrowTableRowCount(table), 'table has one row per vertex').toBe(5696);
  expect(table.data.getChild('POSITION'), 'POSITION column was found').toBeTruthy();
  expect(table.data.getChild('TEXCOORD_0'), 'TEXCOORD_0 column was found').toBeTruthy();
  const indicesColumn = table.data.getChild('indices');
  expect(indicesColumn, 'indices column was found').toBeTruthy();
  expect(indicesColumn.get(0).length, 'indices were found in row 0').toBe(11188 * 3);
  expect(indicesColumn.get(1), 'indices are null after row 0').toBe(null);
});
test('QuantizedMeshLoader#parse tile-with-extensions with shape: arrow-table', async () => {
  const table = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshLoader, {
    worker: false,
    'quantized-mesh': {shape: 'arrow-table'}
  });
  expect(table.shape, 'table has arrow-table shape').toBe('arrow-table');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'QuantizedMeshLoader IndexedMesh table'
  });
  expect(getArrowTableRowCount(table), 'table has one row per vertex').toBe(627);
  expect(table.data.getChild('POSITION'), 'POSITION column was found').toBeTruthy();
  expect(table.data.getChild('TEXCOORD_0'), 'TEXCOORD_0 column was found').toBeTruthy();
  const indicesColumn = table.data.getChild('indices');
  expect(indicesColumn, 'indices column was found').toBeTruthy();
  expect(indicesColumn.get(0).length, 'indices were found in row 0').toBe(1175 * 3);
  expect(indicesColumn.get(1), 'indices are null after row 0').toBe(null);
});
function getArrowTableRowCount(table) {
  const positionColumn =
    typeof table.data.getChild === 'function' ? table.data.getChild('POSITION') : undefined;
  return (
    table.data.numRows ??
    table.data.length ??
    positionColumn?.length ??
    positionColumn?.data?.[0]?.length
  );
}
