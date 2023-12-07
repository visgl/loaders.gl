// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {QuantizedMeshLoader, QuantizedMeshWorkerLoader} from '@loaders.gl/terrain';
import {setLoaderOptions, load} from '@loaders.gl/core';

const TILE_WITH_EXTENSIONS_URL = '@loaders.gl/terrain/test/data/tile-with-extensions.terrain';

setLoaderOptions({
  _workerType: 'test'
});

test('QuantizedMeshLoader#loader objects', async (t) => {
  validateLoader(t, QuantizedMeshLoader, 'QuantizedMeshLoader');
  validateLoader(t, QuantizedMeshWorkerLoader, 'QuantizedMeshWorkerLoader');
  t.end();
});

test('QuantizedMeshLoader#parse tile-with-extensions', async (t) => {
  const data = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshLoader);
  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 1175 * 3, 'indices was found');
  t.equal(data.indices.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 627 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 627 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('QuantizedMeshLoader#add skirt to tile-with-extensions', async (t) => {
  const options = {'quantized-mesh': {skirtHeight: 50}};
  const data = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshLoader, options);
  t.equal(data.indices.value.length, 1329 * 3, 'indices was found');
  t.equal(data.attributes.TEXCOORD_0.value.length, 781 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.POSITION.value.length, 781 * 3, 'POSITION attribute was found');
  t.end();
});

test('QuantizedMeshWorkerLoader#tile-with-extensions', async (t) => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(TILE_WITH_EXTENSIONS_URL, QuantizedMeshWorkerLoader);
  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 1175 * 3, 'indices was found');
  t.equal(data.indices.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 627 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 627 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});
