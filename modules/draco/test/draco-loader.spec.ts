/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader, validateMeshCategoryData} from 'test/common/conformance';

import {DracoLoader, DracoWorkerLoader} from '@loaders.gl/draco';
import {setLoaderOptions, load} from '@loaders.gl/core';
import draco3d from 'draco3d';

const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';
const CESIUM_TILE_URL = '@loaders.gl/draco/test/data/cesium-tile.drc';

setLoaderOptions({
  _workerType: 'test'
});

test('DracoLoader#loader conformance', (t) => {
  validateLoader(t, DracoLoader, 'DracoLoader');
  validateLoader(t, DracoWorkerLoader, 'DracoWorkerLoader');
  t.end();
});

test('DracoLoader#parse(mainthread)', async (t) => {
  const data = await load(BUNNY_DRC_URL, DracoLoader, {
    core: {worker: false}
  });
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.ok(data.schema, 'Has arrow-like schema');
  t.end();
});

test('DracoLoader#draco3d npm package', async (t) => {
  const data = await load(BUNNY_DRC_URL, DracoLoader, {
    core: {worker: false},
    modules: {draco3d}
  });
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test('DracoLoader#parse custom attributes(mainthread)', async (t) => {
  let data = await load(CESIUM_TILE_URL, DracoLoader, {
    core: {worker: false}
  });
  t.equal(
    data.attributes.CUSTOM_ATTRIBUTE_2.value.length,
    173210,
    'Custom (Intensity) attribute was found'
  );
  t.equal(
    data.attributes.CUSTOM_ATTRIBUTE_3.value.length,
    173210,
    'Custom (Classification) attribute was found'
  );

  data = await load(CESIUM_TILE_URL, DracoLoader, {
    core: {worker: false},
    draco: {
      extraAttributes: {
        Intensity: 2,
        Classification: 3
      }
    }
  });
  t.equal(data.attributes.Intensity.value.length, 173210, 'Intensity attribute was found');
  t.equal(
    data.attributes.Classification.value.length,
    173210,
    'Classification attribute was found'
  );

  t.end();
});

test('DracoLoader#normalizeColors', async (t) => {
  const data = await load(CESIUM_TILE_URL, DracoLoader, {
    core: {worker: false},
    mesh: {normalizeColors: true}
  });

  if (!data.attributes.COLOR_0) {
    t.comment('COLOR_0 attribute not present in test data');
    t.end();
    return;
  }

  const colorValues = data.attributes.COLOR_0.value as Float32Array;
  t.ok(colorValues instanceof Float32Array, 'COLOR attribute is Float32Array');
  let hasOutOfRangeColorValue = false;
  for (const colorValue of colorValues) {
    if (colorValue < 0 || colorValue > 1) {
      hasOutOfRangeColorValue = true;
      break;
    }
  }
  t.notOk(hasOutOfRangeColorValue, 'COLOR attribute is normalized');
  t.end();
});

test('DracoWorkerLoader#parse', async (t) => {
  const data = await load(BUNNY_DRC_URL, DracoWorkerLoader, {_nodeWorkers: true});
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  t.end();
});
