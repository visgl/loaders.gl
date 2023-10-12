import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parse} from '@loaders.gl/core';
import type {I3STilesetHeader} from './types';
import {I3SContentLoader} from './i3s-content-loader';
import {normalizeTileData, normalizeTilesetData} from './lib/parsers/parse-i3s';
import {COORDINATE_SYSTEM} from './lib/parsers/constants';
import {I3SParseOptions} from './types';
import {getUrlWithoutParams} from './lib/utils/url-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const TILESET_REGEX = /layers\/[0-9]+$/;
const TILE_HEADER_REGEX = /nodes\/([0-9-]+|root)$/;
const SLPK_HEX = '504b0304';
const POINT_CLOUD = 'PointCloud';

export type I3SLoaderOptions = LoaderOptions & {
  i3s?: I3SParseOptions;
};

/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SLoader: LoaderWithParser<I3STilesetHeader, never, LoaderOptions> = {
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

async function parseI3S(data, options: I3SLoaderOptions = {}, context): Promise<I3STilesetHeader> {
  const url = context.url;
  options.i3s = options.i3s || {};
  const magicNumber = getMagicNumber(data);

  // check if file is slpk
  if (magicNumber === SLPK_HEX) {
    throw new Error('Files with .slpk extention currently are not supported by I3SLoader');
  }

  const urlWithoutParams = getUrlWithoutParams(url);

  // auto detect file type based on url
  let isTileset;
  if (options.i3s.isTileset === 'auto') {
    isTileset = TILESET_REGEX.test(urlWithoutParams);
  } else {
    isTileset = options.i3s.isTileset;
  }

  let isTileHeader;
  if (options.isTileHeader === 'auto') {
    isTileHeader = TILE_HEADER_REGEX.test(urlWithoutParams);
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

  const tilesetPostprocessed = await normalizeTilesetData(tilesetJson, options, context);
  return tilesetPostprocessed;
}

async function parseTile(data, context) {
  data = JSON.parse(new TextDecoder().decode(data));
  return normalizeTileData(data, context);
}

function getMagicNumber(data) {
  if (data instanceof ArrayBuffer) {
    // slice binary data (4 bytes from the beginning) and transform it to hexadecimal numeral system
    return [...new Uint8Array(data, 0, 4)]
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
  }
  return null;
}
