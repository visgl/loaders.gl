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
import {
  Subtree,
  Tiles3DTilesetJSON,
  Tiles3DTileContent,
  Tiles3DTilesetJSONPostprocessed
} from './types';
import {Tiles3DLoader as Tiles3DLoaderMetadata} from './tiles-3d-loader';
import {
  preprocess3DTileContent,
  type Preprocessed3DTileContent
} from './lib/parsers/preprocess-3d-tile-content';
import parse3DTilesSubtree from './lib/parsers/helpers/parse-3d-tile-subtree';

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
      /**
       * Whether to parse embedded glTF binaries or retain their bytes for independent parsing.
       */
      loadGLTF?: boolean;
      /** If renderer doesn't support quantized positions, loader can decode them on CPU */
      decodeQuantizedPositions?: boolean;
      /**
       * Selects tileset-header or render-content parsing. `auto` detects the payload from its
       * bytes and JSON structure; explicit booleans assert the expected category.
       */
      isTileset?: boolean | 'auto';
      /** Internal source hint that parses a requested implicit-subtree resource. */
      isSubtree?: boolean;
      /** Maximum parsed implicit-subtree resources retained by each 3D Tiles source. */
      maximumCachedSubtrees?: number;
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
  Tiles3DTileContent | Tiles3DTilesetJSONPostprocessed | Subtree,
  never,
  Tiles3DLoaderOptions
>;

/**
 * Preprocesses and parses a tileset, legacy tile format, GLB, or JSON glTF payload.
 *
 * @param data - Complete fetched resource bytes.
 * @param options - Loader options, including optional explicit content mode.
 * @param context - Loader context used for base paths and nested resources.
 * @returns Parsed external tileset or renderable tile content.
 */
async function parse(
  data: ArrayBuffer,
  options: Tiles3DLoaderOptions = {},
  context?: LoaderContext
): Promise<Tiles3DTileContent | Tiles3DTilesetJSONPostprocessed | Subtree> {
  const loaderOptions = options['3d-tiles'] || {};
  if (loaderOptions.isSubtree) {
    return await parse3DTilesSubtree(data, options, context);
  }
  const preprocessedContent = preprocess3DTileContent(data);
  if (getIsTileset(preprocessedContent, loaderOptions.isTileset)) {
    return parseTileset(preprocessedContent.jsonPayload as Tiles3DTilesetJSON, options, context);
  }
  return parseTile(data, preprocessedContent, options, context);
}

/**
 * Resolves the tileset mode while retaining explicit caller assertions.
 *
 * `auto` follows the payload structure and therefore works for extensionless and signed URLs.
 * Explicit `true` remains useful for callers that want the loader to reject non-tileset payloads
 * at the boundary; explicit `false` likewise rejects an external tileset where render content was
 * expected.
 *
 * @param content - Structure-first content classification.
 * @param isTilesetOption - Caller mode, including the public `auto` default.
 * @returns Whether to parse the JSON payload as an external tileset.
 * @throws If an explicit mode contradicts the detected payload.
 */
function getIsTileset(
  content: Preprocessed3DTileContent,
  isTilesetOption: boolean | 'auto' | undefined
): content is Extract<Preprocessed3DTileContent, {contentType: 'externalTileset'}> {
  const detectedTileset = content.contentType === 'externalTileset';
  if (isTilesetOption === true && !detectedTileset) {
    throw new Error(`Expected 3D Tiles tileset JSON; detected ${content.contentType}`);
  }
  if (isTilesetOption === false && detectedTileset) {
    throw new Error('Expected 3D tile render content; detected external tileset JSON');
  }
  return isTilesetOption === true || (isTilesetOption !== false && detectedTileset);
}

/**
 * Normalizes a pre-parsed external tileset JSON payload.
 *
 * @param tilesetJson - JSON object classified as an external tileset.
 * @param options - Loader options forwarded to header normalization.
 * @param context - Loader context providing resource URL and subtree fetch.
 * @returns Normalized tileset runtime metadata.
 */
async function parseTileset(
  tilesetJson: Tiles3DTilesetJSON,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<Tiles3DTilesetJSONPostprocessed> {
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

/**
 * Parses renderable content using its structure-first type classification.
 *
 * @param arrayBuffer - Original resource bytes.
 * @param preprocessedContent - Detected payload category and, for JSON, its parsed object.
 * @param options - Loader options forwarded to tile and glTF parsers.
 * @param context - Loader context used for external glTF resources.
 * @returns Parsed renderable tile content.
 */
async function parseTile(
  arrayBuffer: ArrayBuffer,
  preprocessedContent: Exclude<Preprocessed3DTileContent, {contentType: 'externalTileset'}>,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<Tiles3DTileContent> {
  const tile: {content: Tiles3DTileContent} = {
    content: {
      shape: 'tile3d',
      featureIds: null
    }
  };
  const byteOffset = 0;
  await parse3DTile(
    arrayBuffer,
    byteOffset,
    options,
    context,
    tile.content,
    preprocessedContent.contentType,
    preprocessedContent.contentType === 'gltf' ? preprocessedContent.jsonPayload : undefined
  );
  return tile.content;
}

/** Get base name */
function getBaseUri(tilesetUrl: string): string {
  return path.dirname(tilesetUrl);
}
