// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, StrictLoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import type {I3STilesetHeader} from './types';
import {I3SContentLoaderWithParser} from './i3s-content-loader-with-parser';
import {normalizeTileData, normalizeTilesetData} from './lib/parsers/parse-i3s';
import {I3SParseOptions} from './types';
import {getUrlWithoutParams} from './lib/utils/url-utils';
import {I3SLoader as I3SLoaderMetadata} from './i3s-loader';

const {preload: _I3SLoaderPreload, ...I3SLoaderMetadataWithoutPreload} = I3SLoaderMetadata;

const TILESET_REGEX = /layers\/[0-9]+$/;
const LOCAL_SLPK_REGEX = /\.slpk$/;
const TILE_HEADER_REGEX = /nodes\/([0-9-]+|root)$/;
const SLPK_HEX = '504b0304';
const POINT_CLOUD = 'PointCloud';

export type I3SLoaderOptions = StrictLoaderOptions & {
  i3s?: I3SParseOptions & {
    /** For I3SAttributeLoader */
    attributeName?: string;
    /** For I3SAttributeLoader */
    attributeType?: string;
  };
};

/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SLoaderWithParser = {
  ...I3SLoaderMetadataWithoutPreload,
  parse: parseI3S
} as const satisfies LoaderWithParser<I3STilesetHeader, never, I3SLoaderOptions>;

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
    isTileset = TILESET_REGEX.test(urlWithoutParams) || LOCAL_SLPK_REGEX.test(urlWithoutParams);
  } else {
    isTileset = options.i3s.isTileset;
  }

  let isTileHeader;
  if (options.i3s.isTileHeader === 'auto') {
    isTileHeader = TILE_HEADER_REGEX.test(urlWithoutParams);
  } else {
    isTileHeader = options.i3s.isTileHeader;
  }

  if (isTileset) {
    data = await parseTileset(data, options, context);
  } else if (isTileHeader) {
    data = await parseTile(data, context);
  } else {
    data = await parseTileContent(data, options, context);
  }

  return data;
}

async function parseTileContent(arrayBuffer, options: I3SLoaderOptions, context?: LoaderContext) {
  return await I3SContentLoaderWithParser.parse(arrayBuffer, options, context);
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
      .map(value => value.toString(16).padStart(2, '0'))
      .join('');
  }
  return null;
}
