import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parse} from '@loaders.gl/core';
import {I3SContentLoader} from './i3s-content-loader';
import {normalizeTileData, normalizeTilesetData} from './lib/parsers/parse-i3s';
import {COORDINATE_SYSTEM} from './lib/parsers/constants';
import {I3SParseOptions} from './types';
import {LoaderOptions} from './../../loader-utils/src/types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const TILESET_REGEX = /layers\/[0-9]+$/;
const TILE_HEADER_REGEX = /nodes\/([0-9-]+|root)$/;
const POINT_CLOUD = 'PointCloud';

export type I3SLoaderOptions = LoaderOptions & {
  i3s?: I3SParseOptions;
  path?: string;
  mode?: 'http' | 'raw';
};

/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SLoader: LoaderWithParser = {
  name: 'I3S (Indexed Scene Layers)',
  id: 'i3s',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  parse: parseI3S,
  extensions: ['bin'],
  options: {
    i3s: {
      token: null,
      isTileset: 'auto',
      isTileHeader: 'auto',
      tile: null,
      tileset: null,
      _tileOptions: null,
      _tilesetOptions: null,
      useDracoGeometry: true,
      useCompressedTextures: true,
      decodeTextures: true,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      colorsByAttribute: null
    }
  }
};

async function parseI3S(data, options: I3SLoaderOptions = {}, context) {
  const url = context.url;
  options.i3s = options.i3s || {};

  // auto detect file type based on url
  let isTileset;
  if (options.i3s.isTileset === 'auto') {
    isTileset = TILESET_REGEX.test(url);
  } else {
    isTileset = options.i3s.isTileset;
  }

  let isTileHeader;
  if (options.isTileHeader === 'auto') {
    isTileHeader = TILE_HEADER_REGEX.test(url);
  } else {
    isTileHeader = options.i3s.isTileHeader;
  }

  if (isTileset) {
    data = await parseTileset(data, options, context);
  } else if (isTileHeader) {
    data = await parseTile(data, context);
  } else {
    data = await parseTileContent(data, options);
  }

  return data;
}

async function parseTileContent(arrayBuffer, options: I3SLoaderOptions) {
  return await parse(arrayBuffer, I3SContentLoader, options);
}

async function parseTileset(data, options: I3SLoaderOptions, context) {
  const tilesetJson = JSON.parse(new TextDecoder().decode(data));

  if (tilesetJson?.layerType === POINT_CLOUD) {
    throw new Error('Point Cloud layers currently are not supported by I3SLoader');
  }
  // eslint-disable-next-line no-use-before-define
  tilesetJson.loader = I3SLoader;
  await normalizeTilesetData(tilesetJson, options, context);

  return tilesetJson;
}

async function parseTile(data, context) {
  data = JSON.parse(new TextDecoder().decode(data));
  return normalizeTileData(data, context);
}
