/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validatePointCloudCategoryData} from 'test/common/conformance';

import {TerrainLoader, TerrainWorkerLoader} from '@loaders.gl/terrain';
import {setLoaderOptions, load} from '@loaders.gl/core';

const MAPBOX_TERRAIN_PNG_URL = 'modules/terrain/test/data/mapbox.png';
const TERRARIUM_TERRAIN_PNG_URL = 'modules/terrain/test/data/terrarium.png';

setLoaderOptions({
  terrain: {
    workerUrl: 'modules/terrain/dist/terrain-loader.worker.js'
  }
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
  validatePointCloudCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 103770 * 3, 'indices was found');
  t.equal(data.indices.size, 3, 'indices was found');

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
  validatePointCloudCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 11188 * 3, 'indices was found');
  t.equal(data.indices.size, 3, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 5696 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 5696 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

// test('OBJLoader#parseText - object with normals', async t => {
//   const data = await load(OBJ_NORMALS_URL, OBJLoader);
//   validatePointCloudCategoryData(t, data);

//   t.equal(data.attributes.POSITION.value.length, 108, 'POSITION attribute was found');
//   t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');
//   t.equal(data.attributes.NORMAL.value.length, 108, 'NORMAL attribute was found');
//   t.equal(data.attributes.NORMAL.size, 3, 'NORMAL attribute was found');
//   t.equal(data.attributes.TEXCOORD_0.value.length, 72, 'TEXCOORD_0 attribute was found');
//   t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');
//   t.end();
// });

// test('OBJLoader#parseText - multi-part object', async t => {
//   const data = await load(OBJ_MULTI_PART_URL, OBJLoader);
//   validatePointCloudCategoryData(t, data);

//   t.equal(data.header.vertexCount, 1372 * 3, 'Vertices are loaded');
//   t.end();
// });

// test('OBJWorkerLoader#parse(text)', async t => {
//   if (typeof Worker === 'undefined') {
//     t.comment('Worker is not usable in non-browser environments');
//     t.end();
//     return;
//   }

//   const data = await load(OBJ_ASCII_URL, OBJWorkerLoader);

//   validatePointCloudCategoryData(t, data);

//   t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

//   t.equal(data.attributes.POSITION.value.length, 14904 * 3, 'POSITION attribute was found');
//   t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');
//   t.end();
// });
