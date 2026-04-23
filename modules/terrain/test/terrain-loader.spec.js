// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {TerrainLoader, TerrainWorkerLoader, makeGridTerrainMesh} from '@loaders.gl/terrain';
import {setLoaderOptions, load, registerLoaders} from '@loaders.gl/core';

// Should be possible to remove this
import {ImageBitmapLoader} from '@loaders.gl/images';
registerLoaders([ImageBitmapLoader]);

const MAPBOX_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/mapbox.png';
const TERRARIUM_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/terrarium.png';
const GRID_TERRAIN_BOUNDS = [-123, 45, -122, 47];
const GRID_ELEVATION_DECODER = {
  rScaler: 1,
  gScaler: 0,
  bScaler: 0,
  offset: 0
};
const MAX_LATITUDE = 85.051129;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

setLoaderOptions({
  _workerType: 'test'
});

function getMercatorYFromLatitude(latitude) {
  const clampedLatitude = Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));
  const sine = Math.sin(clampedLatitude * DEG2RAD);
  return 0.5 * Math.log((1 + sine) / (1 - sine));
}

function getLatitudeFromMercatorY(mercatorY) {
  return (2 * Math.atan(Math.exp(mercatorY)) - Math.PI / 2) * RAD2DEG;
}

function getExpectedMercatorLatitude(south, north, verticalRatio) {
  const northMercatorY = getMercatorYFromLatitude(north);
  const southMercatorY = getMercatorYFromLatitude(south);
  return getLatitudeFromMercatorY(
    northMercatorY + verticalRatio * (southMercatorY - northMercatorY)
  );
}

function testAlmostEqual(t, actual, expected, message) {
  t.ok(Math.abs(actual - expected) < 1e-5, `${message}: ${actual} ~= ${expected}`);
}

test('TerrainLoader#loader objects', async t => {
  validateLoader(t, TerrainLoader, 'TerrainLoader');
  validateLoader(t, TerrainWorkerLoader, 'TerrainWorkerLoader');
  t.end();
});

test('TerrainLoader#parse mapbox martini', async t => {
  const data = await load(MAPBOX_TERRAIN_PNG_URL, TerrainLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 65536 * 0.1,
        gScaler: 256 * 0.1,
        bScaler: 0.1,
        offset: -10000
      },
      meshMaxError: 5.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'martini'
    },
    core: {worker: false}
  });
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

test('TerrainLoader#add skirt to mapbox martini', async t => {
  const data = await load(MAPBOX_TERRAIN_PNG_URL, TerrainLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 65536 * 0.1,
        gScaler: 256 * 0.1,
        bScaler: 0.1,
        offset: -10000
      },
      meshMaxError: 5.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'martini',
      skirtHeight: 50
    }
  });
  t.equal(data.indices.value.length, 105434 * 3, 'indices was found');
  t.equal(data.attributes.TEXCOORD_0.value.length, 53966 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.POSITION.value.length, 53966 * 3, 'POSITION attribute was found');
  t.end();
});

test('TerrainLoader#parse terrarium martini', async t => {
  const data = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'martini'
    }
  });
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

test('TerrainLoader#parse mapbox delatin', async t => {
  const data = await load(MAPBOX_TERRAIN_PNG_URL, TerrainLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 65536 * 0.1,
        gScaler: 256 * 0.1,
        bScaler: 0.1,
        offset: -10000
      },
      meshMaxError: 5.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'delatin'
    }
  });
  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 90245 * 3, 'indices was found');
  t.equal(data.indices.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 45298 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 45298 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('TerrainLoader#add skirt to mapbox delatin', async t => {
  const data = await load(MAPBOX_TERRAIN_PNG_URL, TerrainLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 65536 * 0.1,
        gScaler: 256 * 0.1,
        bScaler: 0.1,
        offset: -10000
      },
      meshMaxError: 5.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'delatin',
      skirtHeight: 50
    }
  });
  t.equal(data.indices.value.length, 90943 * 3, 'indices was found');
  t.equal(data.attributes.TEXCOORD_0.value.length, 45996 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.POSITION.value.length, 45996 * 3, 'POSITION attribute was found');
  t.end();
});

test('TerrainLoader#parse terrarium delatin', async t => {
  const data = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'delatin'
    }
  });

  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices.value.length, 6082 * 3, 'indices was found');
  t.equal(data.indices.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 3071 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 3071 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('TerrainLoader#parse mapbox grid', async t => {
  const data = await load(MAPBOX_TERRAIN_PNG_URL, TerrainLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 65536 * 0.1,
        gScaler: 256 * 0.1,
        bScaler: 0.1,
        offset: -10000
      },
      meshMaxError: 5.0,
      bounds: GRID_TERRAIN_BOUNDS,
      tesselator: 'grid',
      gridSize: 3
    },
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');
  t.equal(data.indices.value.length, 24, 'indices were generated for a 3 by 3 grid');
  t.equal(data.indices.size, 1, 'indices size was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 18, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute size was found');

  t.equal(data.attributes.POSITION.value.length, 27, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute size was found');

  const positions = data.attributes.POSITION.value;
  const centerPositionIndex = 4 * 3;
  const expectedCenterLatitude = getExpectedMercatorLatitude(
    GRID_TERRAIN_BOUNDS[1],
    GRID_TERRAIN_BOUNDS[3],
    0.5
  );

  testAlmostEqual(t, positions[0], GRID_TERRAIN_BOUNDS[0], 'west edge longitude matches bounds');
  testAlmostEqual(t, positions[1], GRID_TERRAIN_BOUNDS[3], 'north edge latitude matches bounds');
  testAlmostEqual(t, positions[centerPositionIndex], -122.5, 'center longitude is the midpoint');
  testAlmostEqual(
    t,
    positions[centerPositionIndex + 1],
    expectedCenterLatitude,
    'center latitude is sampled at Mercator-y midpoint'
  );

  const texCoords = data.attributes.TEXCOORD_0.value;
  t.equal(texCoords[0], 0, 'northwest texture coordinate u starts at 0');
  t.equal(texCoords[1], 0, 'northwest texture coordinate v starts at 0');
  t.equal(texCoords[8], 0.5, 'center texture coordinate u is at midpoint');
  t.equal(texCoords[9], 0.5, 'center texture coordinate v is at midpoint');

  t.end();
});

test('TerrainLoader#makeGridTerrainMesh applies skirts without changing terrain bounds', t => {
  const terrainImage = {
    width: 2,
    height: 2,
    data: new Uint8Array([10, 0, 0, 255, 20, 0, 0, 255, 30, 0, 0, 255, 40, 0, 0, 255])
  };
  const gridOptions = {
    bounds: GRID_TERRAIN_BOUNDS,
    elevationDecoder: GRID_ELEVATION_DECODER,
    gridSize: 3
  };
  const terrainMesh = makeGridTerrainMesh(terrainImage, gridOptions);
  const skirtedTerrainMesh = makeGridTerrainMesh(terrainImage, {
    ...gridOptions,
    skirtHeight: 50
  });

  const positions = terrainMesh.attributes.POSITION.value;
  const skirtedPositions = skirtedTerrainMesh.attributes.POSITION.value;
  const northwestPositionIndex = 0;
  const centerPositionIndex = 4 * 3;

  t.equal(
    skirtedPositions[northwestPositionIndex + 2],
    positions[northwestPositionIndex + 2] - 50,
    'edge vertex was lowered by skirt height'
  );
  t.equal(
    skirtedPositions[centerPositionIndex + 2],
    positions[centerPositionIndex + 2],
    'interior vertex elevation was not changed by skirt height'
  );
  t.deepEqual(
    skirtedTerrainMesh.header.boundingBox,
    terrainMesh.header.boundingBox,
    'skirt does not change terrain bounding box'
  );

  t.end();
});

test('TerrainWorkerLoader#parse terrarium martini', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainWorkerLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'martini'
    }
  });
  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices?.value.length, 11188 * 3, 'indices was found');
  t.equal(data.indices?.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 5696 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 5696 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});

test('TerrainWorkerLoader#parse terrarium delatin', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(TERRARIUM_TERRAIN_PNG_URL, TerrainWorkerLoader, {
    terrain: {
      elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
      },
      meshMaxError: 10.0,
      bounds: [83, 329.5, 83.125, 329.625], // note: not the real tile bounds
      tesselator: 'delatin'
    }
  });

  validateMeshCategoryData(t, data); // TODO: should there be a validateMeshCategoryData?

  t.equal(data.mode, 4, 'mode is TRIANGLES (4)');

  t.equal(data.indices?.value.length, 6082 * 3, 'indices was found');
  t.equal(data.indices?.size, 1, 'indices was found');

  t.equal(data.attributes.TEXCOORD_0.value.length, 3071 * 2, 'TEXCOORD_0 attribute was found');
  t.equal(data.attributes.TEXCOORD_0.size, 2, 'TEXCOORD_0 attribute was found');

  t.equal(data.attributes.POSITION.value.length, 3071 * 3, 'POSITION attribute was found');
  t.equal(data.attributes.POSITION.size, 3, 'POSITION attribute was found');

  t.end();
});
