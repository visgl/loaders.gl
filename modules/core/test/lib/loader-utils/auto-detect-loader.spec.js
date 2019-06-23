/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {autoDetectLoader} from '@loaders.gl/core/lib/loader-utils/auto-detect-loader';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {Tile3DLoader} from '@loaders.gl/3d-tiles';

const DRACO_URL = '@loaders.gl/draco/test/data/bunny.drc';
const TILE_3D_URL = '@loaders.gl/3d-tiles/test/data/PointCloud/PointCloudRGB/PointCloudRGB.pnts';

test('parseSync#auto-detect-loader', async t => {
  let response = await fetchFile(DRACO_URL);
  const dracoData = await response.arrayBuffer();

  response = await fetchFile(TILE_3D_URL);
  const tileData = await response.arrayBuffer();

  t.equal(autoDetectLoader(dracoData, [Tile3DLoader, DracoLoader, LASLoader]), DracoLoader);
  t.notEqual(autoDetectLoader(dracoData, [LASLoader]), LASLoader);
  t.equal(autoDetectLoader(tileData, [Tile3DLoader]), Tile3DLoader);
  t.end();
});
