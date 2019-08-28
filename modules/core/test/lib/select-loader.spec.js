/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile, _selectLoader as selectLoader} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {KMLLoader} from '@loaders.gl/kml';

import KML_SAMPLE from '@loaders.gl/kml/test/data/KML_Samples.kml';

const DRACO_URL = '@loaders.gl/draco/test/data/bunny.drc';
const TILE_3D_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/pointCloudRGB.pnts';

test('parseSync#select-loader', async t => {
  let response = await fetchFile(DRACO_URL);
  const dracoData = await response.arrayBuffer();

  response = await fetchFile(TILE_3D_URL);
  const tileData = await response.arrayBuffer();

  t.throws(() => selectLoader(null), 'selectedLoader throws if no loader found');

  t.equal(
    selectLoader(null, '.', null, {nothrow: true}),
    null,
    'selectedLoader({nothrow: true}) returns null instead of throwing'
  );

  t.is(
    selectLoader([Tile3DLoader, DracoLoader, LASLoader], 'data.laz', null),
    LASLoader,
    'find loader by url extension'
  );
  t.throws(
    () => selectLoader([Tile3DLoader, DracoLoader, LASLoader], 'data.obj', null),
    'find no loaders by url extension'
  );

  t.is(
    selectLoader([Tile3DLoader, DracoLoader, LASLoader], null, dracoData),
    DracoLoader,
    'find loader by examining binary data'
  );
  t.throws(
    () => selectLoader([Tile3DLoader, DracoLoader, LASLoader], null, new ArrayBuffer()),
    'find no loaders by examining binary data'
  );
  t.throws(
    () => selectLoader([LASLoader], null, dracoData),
    'find no loaders by examining binary data'
  );
  t.is(
    selectLoader([Tile3DLoader], null, tileData),
    Tile3DLoader,
    'find loader by checking magic string'
  );

  t.is(
    selectLoader([KMLLoader], null, KML_SAMPLE),
    KMLLoader,
    'find loader by examining text data'
  );
  t.throws(() => selectLoader([KMLLoader], null, '{}'), 'find no loaders by examining text data');

  t.end();
});
