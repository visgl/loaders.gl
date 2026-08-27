import {expect, test} from 'vitest';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {TerrainLoader, TerrainWorkerLoader} from '@loaders.gl/terrain';
import {setLoaderOptions, load, registerLoaders} from '@loaders.gl/core';
// Should be possible to remove this
import {ImageBitmapLoader} from '@loaders.gl/images';
registerLoaders([ImageBitmapLoader]);
const MAPBOX_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/mapbox.png';
const TERRARIUM_TERRAIN_PNG_URL = '@loaders.gl/terrain/test/data/terrarium.png';
setLoaderOptions({
  _workerType: 'test'
});
test('TerrainLoader#loader objects', async () => {
  validateLoader(TerrainLoader, 'TerrainLoader');
  validateLoader(TerrainWorkerLoader, 'TerrainWorkerLoader');
});
test('TerrainLoader#parse mapbox martini', async () => {
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
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBe(103770 * 3);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(52302 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(52302 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('TerrainLoader#add skirt to mapbox martini', async () => {
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
  expect(data.indices.value.length, 'indices was found').toBe(105434 * 3);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(53966 * 2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(53966 * 3);
});
test('TerrainLoader#parse terrarium martini', async () => {
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
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBe(11188 * 3);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(5696 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(5696 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('TerrainLoader#parse mapbox delatin', async () => {
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
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBe(90245 * 3);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(45298 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(45298 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('TerrainLoader#add skirt to mapbox delatin', async () => {
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
  expect(data.indices.value.length, 'indices was found').toBe(90943 * 3);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(45996 * 2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(45996 * 3);
});
test('TerrainLoader#parse terrarium delatin', async () => {
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
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBe(6082 * 3);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(3071 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(3071 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('TerrainWorkerLoader#parse terrarium martini', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
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
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices?.value.length, 'indices was found').toBe(11188 * 3);
  expect(data.indices?.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(5696 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(5696 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('TerrainWorkerLoader#parse terrarium delatin', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
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
  validateMeshCategoryData(data); // TODO: should there be a validateMeshCategoryData?
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices?.value.length, 'indices was found').toBe(6082 * 3);
  expect(data.indices?.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(3071 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(3071 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
