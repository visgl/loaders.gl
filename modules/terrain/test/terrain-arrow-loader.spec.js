// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
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

test('TerrainLoader#loader objects', t => {
  validateLoader(t, TerrainLoader, 'TerrainLoader');
  validateLoader(t, QuantizedMeshLoader, 'QuantizedMeshLoader');
  t.end();
});

test('TerrainLoader#removed Arrow loader exports', t => {
  t.notOk('TerrainArrowLoader' in terrain, 'root does not export TerrainArrowLoader');
  t.notOk('QuantizedMeshArrowLoader' in terrain, 'root does not export QuantizedMeshArrowLoader');
  t.notOk('TerrainArrowLoader' in bundledTerrain, 'bundled does not export TerrainArrowLoader');
  t.notOk(
    'QuantizedMeshArrowLoader' in bundledTerrain,
    'bundled does not export QuantizedMeshArrowLoader'
  );
  t.notOk('TerrainArrowLoader' in unbundledTerrain, 'unbundled does not export TerrainArrowLoader');
  t.notOk(
    'QuantizedMeshArrowLoader' in unbundledTerrain,
    'unbundled does not export QuantizedMeshArrowLoader'
  );
  t.end();
});

test('TerrainLoader#parse terrarium martini with shape: arrow-table', async t => {
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

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'TerrainLoader IndexedMesh table'
  });
  t.equal(getArrowTableRowCount(table), 5696, 'table has one row per vertex');
  t.ok(table.data.getChild('POSITION'), 'POSITION column was found');
  t.ok(table.data.getChild('TEXCOORD_0'), 'TEXCOORD_0 column was found');
  const indicesColumn = table.data.getChild('indices');
  t.ok(indicesColumn, 'indices column was found');
  t.equal(indicesColumn.get(0).length, 11188 * 3, 'indices were found in row 0');
  t.equal(indicesColumn.get(1), null, 'indices are null after row 0');

  t.end();
});

test('QuantizedMeshLoader#parse tile-with-extensions with shape: arrow-table', async t => {
  const table = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshLoader, {
    worker: false,
    'quantized-mesh': {shape: 'arrow-table'}
  });

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  validateArrowTableSchema(table.data, indexedMeshArrowSchema, {
    schemaName: 'QuantizedMeshLoader IndexedMesh table'
  });
  t.equal(getArrowTableRowCount(table), 627, 'table has one row per vertex');
  t.ok(table.data.getChild('POSITION'), 'POSITION column was found');
  t.ok(table.data.getChild('TEXCOORD_0'), 'TEXCOORD_0 column was found');
  const indicesColumn = table.data.getChild('indices');
  t.ok(indicesColumn, 'indices column was found');
  t.equal(indicesColumn.get(0).length, 1175 * 3, 'indices were found in row 0');
  t.equal(indicesColumn.get(1), null, 'indices are null after row 0');

  t.end();
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
