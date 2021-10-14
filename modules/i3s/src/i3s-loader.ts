import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {load, parse} from '@loaders.gl/core';
import {I3SContentLoader} from './i3s-content-loader';
import {normalizeTileData, normalizeTilesetData} from './lib/parsers/parse-i3s';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const TILESET_REGEX = /layers\/[0-9]+$/;
const TILE_HEADER_REGEX = /nodes\/([0-9-]+|root)$/;
const SLPK_HEX = '504b0304';

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
      loadContent: true,
      token: null,
      isTileset: 'auto',
      isTileHeader: 'auto',
      tile: null,
      tileset: null,
      useDracoGeometry: true,
      useCompressedTextures: true,
      decodeTextures: true
    }
  }
};

async function parseI3S(data, options, context) {
  const url = context.url;
  options.i3s = options.i3s || {};
  const magicNumber = getMagicNumber(data);

  // check if file is slpk
  if (magicNumber === SLPK_HEX) {
    throw new Error('Files with .slpk extention currently are not supported by I3SLoader');
  }

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
    data = await parseTile(data, options, context);
    if (options.i3s.loadContent) {
      options.i3s.tile = data;
      await load(data.contentUrl, I3SLoader, options);
    }
  } else {
    data = await parseTileContent(data, options);
  }

  return data;
}

async function parseTileContent(arrayBuffer, options) {
  return await parse(arrayBuffer, I3SContentLoader, options);
}

async function parseTileset(data, options, context) {
  const tilesetJson = JSON.parse(new TextDecoder().decode(data));
  // eslint-disable-next-line no-use-before-define
  tilesetJson.loader = I3SLoader;
  await normalizeTilesetData(tilesetJson, options, context);

  return tilesetJson;
}

async function parseTile(data, options, context) {
  data = JSON.parse(new TextDecoder().decode(data));
  return normalizeTileData(data, options, context);
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
