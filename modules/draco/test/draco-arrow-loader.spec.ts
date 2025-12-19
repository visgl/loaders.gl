/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {validateLoader} from 'test/common/conformance';

import {DracoArrowLoader} from '@loaders.gl/draco';
import {setLoaderOptions, load} from '@loaders.gl/core';
import draco3d from 'draco3d';

const BUNNY_DRC_URL = '@loaders.gl/draco/test/data/bunny.drc';
const CESIUM_TILE_URL = '@loaders.gl/draco/test/data/cesium-tile.drc';

setLoaderOptions({
  _workerType: 'test'
});

test('DracoArrowLoader#loader conformance', (t) => {
  validateLoader(t, DracoArrowLoader, 'DracoArrowLoader');
  t.end();
});

test('DracoArrowLoader#parse(mainthread)', async (t) => {
  const table = await load(BUNNY_DRC_URL, DracoArrowLoader, {worker: false});
  // validateMeshCategoryData(t, data);
  const {data} = table;
  t.equal(data.numRows, 104502 / 3, 'number of rows is correct');
  const positions = data.getChild('POSITION')!;
  t.ok(positions, 'POSITION attribute was found');
  t.ok(data.schema, 'Has arrow-like schema');
  t.end();
});

test('DracoArrowLoader#draco3d npm package', async (t) => {
  const table = await load(BUNNY_DRC_URL, DracoArrowLoader, {
    worker: false,
    modules: {
      draco3d
    }
  });
  const {data} = table;
  // validateMeshCategoryData(t, data);
  t.ok(data.getChild('POSITION'), 'POSITION attribute was found');
  t.end();
});

test('DracoArrowLoader#parse custom attributes(mainthread)', async (t) => {
  let table = await load(CESIUM_TILE_URL, DracoArrowLoader, {
    worker: false
  });
  const {data} = table;
  t.equal(
    data.getChild('CUSTOM_ATTRIBUTE_2')?.data[0].length,
    173210,
    'Custom (Intensity) attribute was found'
  );
  t.equal(
    data.getChild('CUSTOM_ATTRIBUTE_3')?.data[0].length,
    173210,
    'Custom (Classification) attribute was found'
  );

  table = await load(CESIUM_TILE_URL, DracoArrowLoader, {
    worker: false,
    draco: {
      extraAttributes: {
        Intensity: 2,
        Classification: 3
      }
    }
  });
  t.equal(
    table.data.getChild('Intensity')?.data[0].length,
    173210,
    'Intensity attribute was found'
  );
  t.equal(
    table.data.getChild('Classification')?.data[0].length,
    173210,
    'Classification attribute was found'
  );

  t.end();
});
