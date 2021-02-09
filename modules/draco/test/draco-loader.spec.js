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

test('DracoLoader#loader conformance', t => {
  validateLoader(t, DracoLoader, 'DracoLoader');
  validateLoader(t, DracoWorkerLoader, 'DracoWorkerLoader');
  t.end();
});

test('DracoLoader#parse(mainthread)', async t => {
  const data = await load(BUNNY_DRC_URL, DracoLoader, {worker: false});
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test('DracoLoader#draco3d npm package', async t => {
  const data = await load(BUNNY_DRC_URL, DracoLoader, {
    worker: false,
    modules: {
      draco3d
    }
  });
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');
  t.end();
});

test('DracoLoader#parse custom attributes(mainthread)', async t => {
  let data = await load(CESIUM_TILE_URL, DracoLoader, {
    worker: false
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
    worker: false,
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

test('DracoWorkerLoader#parse', async t => {
  if (typeof Worker === 'undefined') {
    t.comment('Worker is not usable in non-browser environments');
    t.end();
    return;
  }

  const data = await load(BUNNY_DRC_URL, DracoWorkerLoader);
  validateMeshCategoryData(t, data);
  t.equal(data.attributes.POSITION.value.length, 104502, 'POSITION attribute was found');

  t.end();
});
