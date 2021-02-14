/* global TextDecoder */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {path} from '@loaders.gl/loader-utils';
import {TILESET_TYPE, LOD_METRIC_TYPE} from '@loaders.gl/tiles';
import {VERSION} from './lib/utils/version';
import {parse3DTile} from './lib/parsers/parse-3d-tile';
import {normalizeTileHeaders} from './lib/parsers/parse-3d-tile-header';

/**
 * Loader for 3D Tiles
 * @type {LoaderObject}
 */
export const Tiles3DLoader = {
  id: '3d-tiles',
  name: '3D Tiles',
  module: '3d-tiles',
  version: VERSION,
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  tests: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  parse,
  options: {
    '3d-tiles': {
      loadGLTF: true,
      decodeQuantizedPositions: false,
      isTileset: 'auto',
      tile: null,
      tileset: null,
      assetGltfUpAxis: null
    }
  }
};

function getBaseUri(tileset) {
  return path.dirname(tileset.url);
}

async function parseTile(arrayBuffer, options, context) {
  const tile = {};
  tile.content = tile.content || {};
  const byteOffset = 0;
  await parse3DTile(arrayBuffer, byteOffset, options, context, tile.content);
  return tile.content;
}

async function parseTileset(data, options, context) {
  const tilesetJson = JSON.parse(new TextDecoder().decode(data));
  // eslint-disable-next-line no-use-before-define
  tilesetJson.loader = options.loader || Tiles3DLoader;
  tilesetJson.url = context.url;
  // base path that non-absolute paths in tileset are relative to.
  tilesetJson.basePath = getBaseUri(tilesetJson);
  tilesetJson.root = normalizeTileHeaders(tilesetJson);
  tilesetJson.type = TILESET_TYPE.TILES3D;

  tilesetJson.lodMetricType = LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  tilesetJson.lodMetricValue = tilesetJson.root.lodMetricValue;

  return tilesetJson;
}

async function parse(data, options, context, loader) {
  // auto detect file type
  const loaderOptions = options['3d-tiles'] || {};
  let isTileset;
  if (loaderOptions.isTileset === 'auto') {
    isTileset = context.url && context.url.indexOf('.json') !== -1;
  } else {
    isTileset = loaderOptions.isTileset;
  }

  if (isTileset) {
    data = await parseTileset(data, options, context);
  } else {
    data = await parseTile(data, options, context);
  }

  return data;
}
