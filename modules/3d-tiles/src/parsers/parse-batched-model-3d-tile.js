import {GL} from '../constants';
import Tile3DFeatureTable from '../tile-3d-feature-table';
// import Tile3DBatchTable from '../tile-3d-batch-table';
import {parse3DTileHeaderSync} from './parse-3d-tile-header';
import {parse3DTileTablesHeaderSync, parse3DTileTablesSync} from './parse-3d-file-header';
import {parse3DTileGLTFViewSync} from './parse-3d-gltf-view';


// Compare with:
// https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Scene/Batched3DModel3DTileContent.js#L230
// eslint-disable-next-line max-statements
export default function parseBatchedModel3DTileSync(tile, arrayBuffer, byteOffset, options) {
  byteOffset = parse3DTileHeaderSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parse3DTileTablesHeaderSync(tile, arrayBuffer, byteOffset, options);
  byteOffset = parse3DTileTablesSync(tile, arrayBuffer, byteOffset, options);

  byteOffset = parse3DTileGLTFViewSync(tile, arrayBuffer, byteOffset, options);

  const featureTable = new Tile3DFeatureTable(tile);
  tile.rtcCenter = featureTable.getGlobalProperty('RTC_CENTER', GL.FLOAT, 3);

  return byteOffset;
}
