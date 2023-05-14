import type {LoaderWithParser, LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
// / import type { GLTFLoaderOptions } from '@loaders.gl/gltf';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import type {ImageLoaderOptions} from '@loaders.gl/images';

import {path} from '@loaders.gl/loader-utils';
import {TILESET_TYPE, LOD_METRIC_TYPE} from '@loaders.gl/tiles';
import {VERSION} from './lib/utils/version';
import {parse3DTile} from './lib/parsers/parse-3d-tile';
import {normalizeTileHeaders} from './lib/parsers/parse-3d-tile-header';

export type Tiles3DLoaderOptions = LoaderOptions &
  // GLTFLoaderOptions & - TODO not yet exported
  DracoLoaderOptions &
  ImageLoaderOptions & {
    '3d-tiles'?: {
      /** Whether to parse any embedded glTF binaries (or extract memory for independent glTF parsing) */
      loadGLTF?: boolean;
      /** If renderer doesn't support quantized positions, loader can decode them on CPU */
      decodeQuantizedPositions?: boolean;
      /** Whether this is a tileset or a tile */
      isTileset?: boolean | 'auto';
      /** Controls which axis is "up" in glTF files */
      assetGltfUpAxis?: 'x' | 'y' | 'z' | null;
    };
  };

/**
 * Loader for 3D Tiles
 */
export const Tiles3DLoader: LoaderWithParser = {
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
      assetGltfUpAxis: null
    }
  }
};

/** Parses a tileset or tile */
async function parse(data, options: Tiles3DLoaderOptions = {}, context?: LoaderContext) {
  // auto detect file type
  const loaderOptions = options['3d-tiles'] || {};
  let isTileset;
  if (loaderOptions.isTileset === 'auto') {
    isTileset = context?.url && context.url.indexOf('.json') !== -1;
  } else {
    isTileset = loaderOptions.isTileset;
  }

  return (await isTileset)
    ? parseTileset(data, options, context)
    : parseTile(data, options, context);
}

/** Parse a tileset */
async function parseTileset(
  data: ArrayBuffer,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
) {
  const tilesetJson = JSON.parse(new TextDecoder().decode(data));

  // eslint-disable-next-line no-use-before-define
  tilesetJson.loader = options?.loader || Tiles3DLoader;
  tilesetJson.url = context?.url || '';
  tilesetJson.queryString = context?.queryString || '';

  // base path that non-absolute paths in tileset are relative to.
  tilesetJson.basePath = getBaseUri(tilesetJson);
  // TODO - check option types in normalizeTileHeaders
  tilesetJson.root = await normalizeTileHeaders(tilesetJson, options || {});

  tilesetJson.type = TILESET_TYPE.TILES3D;

  tilesetJson.lodMetricType = LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  tilesetJson.lodMetricValue = tilesetJson.root?.lodMetricValue || 0;

  return tilesetJson;
}

/** Parse a tile */
async function parseTile(
  arrayBuffer: ArrayBuffer,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
) {
  const tile = {
    content: {
      featureIds: null
    }
  };
  const byteOffset = 0;
  await parse3DTile(arrayBuffer, byteOffset, options, context, tile.content);
  return tile.content;
}

/** Get base name */
function getBaseUri(tileset) {
  return path.dirname(tileset.url);
}
