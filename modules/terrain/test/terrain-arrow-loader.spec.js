// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {TerrainArrowLoader, QuantizedMeshArrowLoader} from '@loaders.gl/terrain';
import {setLoaderOptions, load, registerLoaders} from '@loaders.gl/core';
import {ImageLoader} from '@loaders.gl/images';

registerLoaders([ImageLoader]);

const TERRARIUM_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/terrarium.png';
const TILE_WITH_EXTENSIONS_URL = '@loaders.gl/terrain/test/data/tile-with-extensions.terrain';

setLoaderOptions({
  _workerType: 'test'
});

test('TerrainArrowLoader#loader objects', t => {
  validateLoader(t, TerrainArrowLoader, 'TerrainArrowLoader');
  validateLoader(t, QuantizedMeshArrowLoader, 'QuantizedMeshArrowLoader');
  t.end();
});

test('TerrainArrowLoader#parse terrarium martini', async t => {
  const table = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainArrowLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625],
      tesselator: 'martini'
    }
  });

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  t.equal(table.data.numRows, 5696, 'table has one row per vertex');
  t.ok(table.data.getChild('POSITION'), 'POSITION column was found');
  t.ok(table.data.getChild('TEXCOORD_0'), 'TEXCOORD_0 column was found');
  const indicesColumn = table.data.getChild('indices');
  t.ok(indicesColumn, 'indices column was found');
  t.equal(indicesColumn.get(0).length, 11188 * 3, 'indices were found in row 0');
  t.equal(indicesColumn.get(1), null, 'indices are null after row 0');

  t.end();
});

test('QuantizedMeshArrowLoader#parse tile-with-extensions', async t => {
  const table = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshArrowLoader);

  t.equal(table.shape, 'arrow-table', 'table has arrow-table shape');
  t.equal(table.data.numRows, 627, 'table has one row per vertex');
  t.ok(table.data.getChild('POSITION'), 'POSITION column was found');
  t.ok(table.data.getChild('TEXCOORD_0'), 'TEXCOORD_0 column was found');
  const indicesColumn = table.data.getChild('indices');
  t.ok(indicesColumn, 'indices column was found');
  t.equal(indicesColumn.get(0).length, 1175 * 3, 'indices were found in row 0');
  t.equal(indicesColumn.get(1), null, 'indices are null after row 0');

  t.end();
});
