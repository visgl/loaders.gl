import {expect, test} from 'vitest';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';
import {TerrainLoader} from '@loaders.gl/raster/terrain/index';
import {setLoaderOptions, load, registerLoaders} from '@loaders.gl/core';
// Should be possible to remove this
import {ImageLoader} from '@loaders.gl/images';
registerLoaders([ImageLoader]);
const MAPBOX_TERRAIN_PNG_URL = '@loaders.gl/raster/test/terrain/data/mapbox.png';
const TERRARIUM_TERRAIN_PNG_URL = '@loaders.gl/raster/test/terrain/data/terrarium.png';
setLoaderOptions({
  _workerType: 'test'
});
test('TerrainLoader#loader objects', async () => {
  validateLoader(TerrainLoader, 'TerrainLoader');
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
      tesselator: 'martini',
      shape: 'mesh'
    },
    core: {worker: false}
  });
  validateTerrainMesh(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBeGreaterThan(0);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.indices.value).toBeInstanceOf(Uint32Array);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(
    (data.attributes.POSITION.value.length / 3) * 2
  );
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBeGreaterThan(0);
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
      skirtHeight: 50,
      shape: 'mesh'
    }
  });
  expect(data.indices.value.length, 'indices was found').toBeGreaterThan(0);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(
    (data.attributes.POSITION.value.length / 3) * 2
  );
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBeGreaterThan(0);
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
      tesselator: 'martini',
      shape: 'mesh'
    }
  });
  validateTerrainMesh(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBeGreaterThan(0);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(
    (data.attributes.POSITION.value.length / 3) * 2
  );
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBeGreaterThan(0);
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
      tesselator: 'delatin',
      shape: 'mesh'
    }
  });
  validateTerrainMesh(data);
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
      skirtHeight: 50,
      shape: 'mesh'
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
      tesselator: 'delatin',
      shape: 'mesh'
    }
  });
  validateTerrainMesh(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices.value.length, 'indices was found').toBe(6082 * 3);
  expect(data.indices.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(3071 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(3071 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('TerrainLoader#parse terrarium martini', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
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
      tesselator: 'martini',
      shape: 'mesh'
    }
  });
  validateTerrainMesh(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices?.value.length, 'indices was found').toBeGreaterThan(0);
  expect(data.indices?.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(
    (data.attributes.POSITION.value.length / 3) * 2
  );
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBeGreaterThan(0);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});
test('TerrainLoader#parse terrarium delatin', async () => {
  if (typeof Worker === 'undefined') {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
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
      tesselator: 'delatin',
      shape: 'mesh'
    }
  });
  validateTerrainMesh(data);
  expect(data.mode, 'mode is TRIANGLES (4)').toBe(4);
  expect(data.indices?.value.length, 'indices was found').toBe(6082 * 3);
  expect(data.indices?.size, 'indices was found').toBe(1);
  expect(data.attributes.TEXCOORD_0.value.length, 'TEXCOORD_0 attribute was found').toBe(3071 * 2);
  expect(data.attributes.TEXCOORD_0.size, 'TEXCOORD_0 attribute was found').toBe(2);
  expect(data.attributes.POSITION.value.length, 'POSITION attribute was found').toBe(3071 * 3);
  expect(data.attributes.POSITION.size, 'POSITION attribute was found').toBe(3);
});

/** Checks loader mesh packaging independently of adaptive backend topology choices. */
function validateTerrainMesh(mesh) {
  validateMeshCategoryData(mesh);
  const positions = mesh.attributes.POSITION.value;
  const vertexCount = positions.length / 3;
  expect(positions.length % 3).toBe(0);
  expect(positions.every(Number.isFinite)).toBe(true);
  expect(mesh.attributes.TEXCOORD_0.value.length).toBe(vertexCount * 2);
  expect(mesh.indices.value.length % 3).toBe(0);
  expect(mesh.indices.value.every(index => index < vertexCount)).toBe(true);
}
