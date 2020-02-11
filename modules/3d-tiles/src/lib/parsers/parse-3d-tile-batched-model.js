// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {GL} from '@loaders.gl/math'; // math.gl/geometry;
import Tile3DFeatureTable from '../classes/tile-3d-feature-table';
// import Tile3DBatchTable from '../classes/tile-3d-batch-table';

import {parse3DTileHeaderSync} from './helpers/parse-3d-tile-header';
import {parse3DTileTablesHeaderSync, parse3DTileTablesSync} from './helpers/parse-3d-tile-tables';
import {parse3DTileGLTFViewSync, extractGLTF, GLTF_FORMAT} from './helpers/parse-3d-tile-gltf-view';

export async function parseBatchedModel3DTile(tile, arrayBuffer, byteOffset, options, context) {
  byteOffset = parseBatchedModel(tile, arrayBuffer, byteOffset, options, context);
  await extractGLTF(tile, GLTF_FORMAT.EMBEDDED, options, context);

  const {extensions} = tile.gltf || {};
  if (extensions && extensions.CESIUM_RTC) {
    tile.rtcCenter = extensions.CESIUM_RTC.center;
  }

  return byteOffset;
}

function parseBatchedModel(tile, arrayBuffer, byteOffset, options, context) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset, options);
  byteOffset = parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset, options);

  const featureTable = new Tile3DFeatureTable(tile.featureTableJson, tile.featureTableBinary);
  tile.rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', GL.FLOAT, 3);

  return byteOffset;
}
