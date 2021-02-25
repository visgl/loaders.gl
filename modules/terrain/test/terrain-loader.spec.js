/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {TerrainLoader, TerrainWorkerLoader} from '@loaders.gl/terrain';
import {setLoaderOptions, load} from '@loaders.gl/core';

const MAPBOX_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/mapbox.png';
const TERRARIUM_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/terrarium.png';

setLoaderOptions({
  _workerType: 'test'
});

test('TerrainLoader#loader objects', async t => {
  validateLoader(t, TerrainLoader, 'TerrainLoader');
  validateLoader(t, TerrainWorkerLoader, 'TerrainWorkerLoader');
  t.end();
});

test('TerrainLoader#parse mapbox', async t => {
  const options = {
    terrain: {
      elevationDecoder: {
        rScaler: 65536 * 0.1,
        gScaler: 256 * 0.1,
        bScaler: 0.1,
        offset: -10000
      },
      meshMaxError: 5.0,
      bounds: [83, 329.5, 83.125, 329.625] // note: not the real tile bounds
    }
  };
  const data = await load(MAPBOX_TERRAIN_PNG_URL, TerrainLoader, options);
  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 103770 * 3, 'indices was found');
  t.equal(data.indices.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 52302 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 52302 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('TerrainLoader#parse terrarium', async t => {
  const options = {
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625] // note: not the real tile bounds
    }
  };

  const data = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainLoader, options);
  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 11188 * 3, 'indices was found');
  t.equal(data.indices.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 5696 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 5696 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('TerrainWorkerLoader#parse terrarium', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const options = {
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625] // note: not the real tile bounds
    }
  };

  const data = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainWorkerLoader, options);
  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 11188 * 3, 'indices was found');
  t.equal(data.indices.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 5696 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 5696 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});
