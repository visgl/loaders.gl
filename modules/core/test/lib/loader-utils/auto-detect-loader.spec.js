/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {autoDetectLoader} from '@loaders.gl/core/lib/loader-utils/auto-detect-loader';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';
import {KMLLoader} from '@loaders.gl/kml';

import KML_SAMPLE from '@loaders.gl/kml/test/data/KML_Samples.kml';

const DRACO_URL = '@loaders.gl/draco/test/data/bunny.drc';
const TILE_3D_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/pointCloudRGB.pnts';

test('parseSync#auto-detect-loader', async t => {
  let response = await fetchFile(DRACO_URL);
  const dracoData = await response.arrayBuffer();

  response = await fetchFile(TILE_3D_URL);
  const tileData = await response.arrayBuffer();

  t.is(
    autoDetectLoader(null, [Tile3DLoader, DracoLoader, LASLoader], {url: 'data.laz'}),
    LASLoader,
    'find loader by url extension'
  );
  t.is(
    autoDetectLoader(null, [Tile3DLoader, DracoLoader, LASLoader], {url: 'data.obj'}),
    null,
    'find no loaders by url extension'
  );

  t.is(
    autoDetectLoader(dracoData, [Tile3DLoader, DracoLoader, LASLoader]),
    DracoLoader,
    'find loader by examining binary data'
  );
  t.is(
    autoDetectLoader(new ArrayBuffer(), [Tile3DLoader, DracoLoader, LASLoader]),
    null,
    'find no loaders by examining binary data'
  );
  t.is(autoDetectLoader(dracoData, [LASLoader]), null, 'find no loaders by examining binary data');
  t.is(
    autoDetectLoader(tileData, [Tile3DLoader]),
    Tile3DLoader,
    'find loader by checking magic string'
  );

  t.is(autoDetectLoader(KML_SAMPLE, [KMLLoader]), KMLLoader, 'find loader by examining text data');
  t.is(autoDetectLoader('{}', [KMLLoader]), null, 'find no loaders by examining text data');

  t.end();
});
