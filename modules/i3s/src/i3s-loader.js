/* global URL, TextDecoder */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {load} from '@loaders.gl/core';
import {normalizeTileData, normalizeTilesetData} from './lib/parsers/parse-i3s';
import {parseI3STileContent} from './lib/parsers/parse-i3s-tile-content';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const TILESET_REGEX = /layers\/[0-9]+$/;
const TILE_HEADER_REGEX = /nodes\/([0-9-]+|root)$/;

async function parseTileContent(arrayBuffer, options, context) {
  const tile = options.i3s.tile;
  const tileset = options.i3s.tileset;
  tile.content = tile.content || {};
  await parseI3STileContent(arrayBuffer, tile, tileset, options);
  return tile.content;
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

/** @type {LoaderObject} */
const I3SLoader = {
  id: 'i3s',
  name: 'I3S 3D Tiles',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  parse,
  extensions: ['bin'],
  options: {
    i3s: {
      loadContent: true,
      isTileset: 'auto',
      isTileHeader: 'auto',
      tile: null,
      tileset: null
    }
  }
};

async function parse(data, options, context, loader) {
  const url = new URL(context.url);
  options.i3s = options.i3s || {};

  // auto detect file type based on url
  let isTileset;
  if (options.i3s.isTileset === 'auto') {
    isTileset = TILESET_REGEX.test(url.pathname);
  } else {
    isTileset = options.i3s.isTileset;
  }

  let isTileHeader;
  if (options.isTileHeader === 'auto') {
    isTileHeader = TILE_HEADER_REGEX.test(url.pathname);
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
    data = await parseTileContent(data, options, context);
  }

  return data;
}

export default I3SLoader;
