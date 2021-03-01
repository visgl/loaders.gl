/* global TextDecoder */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
import {load} from '@loaders.gl/core';
import {normalizeTileData, normalizeTilesetData} from './lib/parsers/parse-i3s';
import {parseI3STileContent} from './lib/parsers/parse-i3s-tile-content';
import {I3SAttributeLoader} from './i3s-attribute-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const TILESET_REGEX = /layers\/[0-9]+$/;
const TILE_HEADER_REGEX = /nodes\/([0-9-]+|root)$/;

/**
 * Loader for I3S - Indexed 3D Scene Layer
 * @type {LoaderObject}
 */
export const I3SLoader = {
  name: 'I3S (Indexed Scene Layers)',
  id: 'i3s',
  module: 'i3s',
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
      tileset: null,
      useDracoGeometry: true,
      useCompressedTextures: true,
      loadFeatureAttributes: true
    }
  }
};

async function parse(data, options, context, loader) {
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

async function parseTileContent(arrayBuffer, options, context) {
  const {tile, tileset, loadFeatureAttributes} = options.i3s;
  tile.content = tile.content || {};
  tile.userData = tile.userData || {};
  await parseI3STileContent(arrayBuffer, tile, tileset, options);

  if (loadFeatureAttributes) {
    await parseFeatureAttributes(tile, tileset);
  }

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

async function parseFeatureAttributes(tile, tileset) {
  const attributeStorageInfo = tileset.attributeStorageInfo;
  const attributeUrls = tile.attributeUrls;
  const attributes = [];

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const url = attributeUrls[index];
    const attributeName = attributeStorageInfo[index].name;
    const attributeType = getAttributeValueType(attributeStorageInfo[index]);

    try {
      const attribute = await load(url, I3SAttributeLoader, {attributeName, attributeType});
      attributes.push(attribute);
    } catch (error) {
      // do nothing
    }
  }

  tile.userData.layerFeaturesAttributes = attributes;
}

function getAttributeValueType(attribute) {
  if (attribute.hasOwnProperty('objectIds')) {
    return 'Oid32';
  } else if (attribute.hasOwnProperty('attributeValues')) {
    return attribute.attributeValues.valueType;
  }
  return null;
}
