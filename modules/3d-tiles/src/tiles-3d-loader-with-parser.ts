// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, StrictLoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
// / import type { GLTFLoaderOptions } from '@loaders.gl/gltf';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';

import {path} from '@loaders.gl/loader-utils';
import {TILESET_TYPE, LOD_METRIC_TYPE} from '@loaders.gl/tiles';
import {parse3DTile} from './lib/parsers/parse-3d-tile';
import {normalizeTileHeaders} from './lib/parsers/parse-3d-tile-header';
import {Tiles3DTilesetJSON, Tiles3DTileContent, Tiles3DTilesetJSONPostprocessed} from './types';
import {Tiles3DLoader as Tiles3DLoaderMetadata} from './tiles-3d-loader';
import {Tiles3DTilesetSchema} from './tileset-schema';

/**
 * Required 3D Tiles extensions that this loader can process completely enough to load content.
 *
 * This is a capability allowlist, not a registry of known extension names. Adding a name here
 * promises that a tileset requiring the extension can be interpreted correctly, so the list must
 * stay aligned with the parser implementations and their regression tests.
 */
const SUPPORTED_3D_TILES_EXTENSIONS: ReadonlySet<string> = new Set([
  '3DTILES_implicit_tiling',
  '3DTILES_bounding_volume_S2',
  '3DTILES_batch_table_hierarchy',
  '3DTILES_draco_point_compression',
  '3DTILES_content_gltf'
]);

const {preload: _Tiles3DLoaderPreload, ...Tiles3DLoaderMetadataWithoutPreload} =
  Tiles3DLoaderMetadata;

export type Tiles3DLoaderOptions = StrictLoaderOptions &
  // GLTFLoaderOptions & - TODO not yet exported
  DracoLoaderOptions &
  ImageBitmapLoaderOptions & {
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
export const Tiles3DLoaderWithParser = {
  ...Tiles3DLoaderMetadataWithoutPreload,
  parse
} as const satisfies LoaderWithParser<
  Tiles3DTileContent | Tiles3DTilesetJSONPostprocessed,
  never,
  Tiles3DLoaderOptions
>;

/** Parses a tileset or tile */
async function parse(
  data,
  options: Tiles3DLoaderOptions = {},
  context?: LoaderContext
): Promise<Tiles3DTileContent | Tiles3DTilesetJSONPostprocessed> {
  // auto detect file type
  const loaderOptions = options['3d-tiles'] || {};
  let isTileset;
  if (loaderOptions.isTileset === 'auto') {
    isTileset = context?.url && context.url.indexOf('.json') !== -1;
  } else {
    isTileset = loaderOptions.isTileset;
  }

  return isTileset ? parseTileset(data, options, context) : parseTile(data, options, context);
}

/** Parse a tileset */
async function parseTileset(
  data: ArrayBuffer,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<Tiles3DTilesetJSONPostprocessed> {
  const tilesetJson: Tiles3DTilesetJSON = Tiles3DTilesetSchema.parse(
    JSON.parse(new TextDecoder().decode(data))
  );
  validateRequiredExtensions(tilesetJson);

  const tilesetUrl = context?.url || '';
  const basePath = getBaseUri(tilesetUrl);
  const normalizedRoot = await normalizeTileHeaders(tilesetJson, basePath, options || {}, context);
  const tilesetJsonPostprocessed: Tiles3DTilesetJSONPostprocessed = {
    ...tilesetJson,
    shape: 'tileset3d',
    loader: Tiles3DLoaderWithParser,
    url: tilesetUrl,
    queryString: context?.queryString || '',
    basePath,
    root: normalizedRoot || tilesetJson.root,
    type: TILESET_TYPE.TILES3D,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: tilesetJson.root?.geometricError || 0
  };
  return tilesetJsonPostprocessed;
}

/**
 * Rejects a tileset that requires extensions the loader cannot process.
 *
 * The 3D Tiles specification permits applications to ignore unknown entries in `extensionsUsed`,
 * but every entry in `extensionsRequired` is necessary to interpret the tileset correctly. This
 * check therefore runs before header normalization or subtree fetching to avoid partial work and
 * to provide a deterministic diagnostic at the tileset boundary.
 *
 * @param tilesetJson - Parsed, unnormalized tileset JSON.
 * @throws When one or more required extensions are unsupported.
 */
function validateRequiredExtensions(tilesetJson: Tiles3DTilesetJSON): void {
  const unsupportedExtensions = [
    ...new Set(
      (tilesetJson.extensionsRequired || []).filter(
        extensionName => !SUPPORTED_3D_TILES_EXTENSIONS.has(extensionName)
      )
    )
  ];

  if (unsupportedExtensions.length === 0) {
    return;
  }

  const extensionLabel = unsupportedExtensions.length === 1 ? 'extension' : 'extensions';
  throw new Error(
    `Unsupported required 3D Tiles ${extensionLabel}: ${unsupportedExtensions.join(', ')}`
  );
}

/** Parse a tile */
async function parseTile(
  arrayBuffer: ArrayBuffer,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<Tiles3DTileContent> {
  const tile = {
    content: {
      shape: 'tile3d',
      featureIds: null
    }
  };
  const byteOffset = 0;
  // @ts-expect-error
  await parse3DTile(arrayBuffer, byteOffset, options, context, tile.content);
  // @ts-expect-error
  return tile.content;
}

/** Get base name */
function getBaseUri(tilesetUrl: string): string {
  return path.dirname(tilesetUrl);
}
