// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, StrictLoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
// / import type { GLTFLoaderOptions } from '@loaders.gl/gltf';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';
import {GLTFLoader} from '@loaders.gl/gltf';
import type {GLTFWithBuffers} from '@loaders.gl/gltf';

import {path} from '@loaders.gl/loader-utils';
import {get3DTilesSpatialReference, TILESET_TYPE, LOD_METRIC_TYPE} from '@loaders.gl/tiles';
import {parse3DTile} from './lib/parsers/parse-3d-tile';
import {normalizeTileHeaders} from './lib/parsers/parse-3d-tile-header';
import {
  Subtree,
  Tiles3DFormatVersion,
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
import {
  is3DTiles2Subtree,
  is3DTiles2Tileset,
  parse3DTiles2Tileset
} from './lib/parsers/parse-3d-tiles-2-gltf';

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

const SUPPORTED_3D_TILES_2_EXTENSIONS: ReadonlySet<string> = new Set([
  '3DTILES_tileset',
  'EXT_structural_metadata',
  'EXT_mesh_features',
  'KHR_mesh_primitive_restart',
  'EXT_mesh_polygon',
  'KHR_draco_mesh_compression',
  'KHR_meshopt_compression',
  'EXT_meshopt_compression',
  'KHR_texture_basisu',
  'EXT_texture_webp',
  'EXT_texture_avif'
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
      /** @internal Vector-content metadata supplied by a normalized tileset header. */
      vectorContent?: {clip: boolean};
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
  if (preprocessedContent.contentType === 'externalTileset') {
    getIsTileset(preprocessedContent.contentType, loaderOptions.isTileset);
    return parseTileset(preprocessedContent.jsonPayload as Tiles3DTilesetJSON, options, context);
  }

  if (preprocessedContent.contentType === 'gltf' || preprocessedContent.contentType === 'glb') {
    const parsedGltf = await parseGltfForClassification(
      data,
      preprocessedContent as GltfPreprocessedContent,
      options,
      context
    );
    if (is3DTiles2Tileset(parsedGltf)) {
      getIsTileset('tileset2', loaderOptions.isTileset);
      validateRequiredExtensions(parsedGltf.json.extensionsRequired, true);
      const resourceUrl = context?.url || options.core?.baseUrl || '';
      const tilesetJson = parse3DTiles2Tileset(
        parsedGltf,
        getBaseUri(resourceUrl) || context?.baseUrl || ''
      );
      return parseTileset(tilesetJson, options, context, '2.0-draft');
    }
    if (is3DTiles2Subtree(parsedGltf)) {
      throw new Error('3DTILES_subtree: glTF subtree parsing is not supported by this tranche');
    }
    getIsTileset(preprocessedContent.contentType, loaderOptions.isTileset);
    return parseTile(data, preprocessedContent, options, context, parsedGltf);
  }

  getIsTileset(preprocessedContent.contentType, loaderOptions.isTileset);
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
  contentType: Preprocessed3DTileContent['contentType'] | 'tileset2',
  isTilesetOption: boolean | 'auto' | undefined
): boolean {
  const detectedTileset = contentType === 'externalTileset' || contentType === 'tileset2';
  if (isTilesetOption === true && !detectedTileset) {
    throw new Error(`Expected 3D Tiles tileset JSON; detected ${contentType}`);
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
  context?: LoaderContext,
  formatVersion: Tiles3DFormatVersion = getFormatVersion(tilesetJson.asset.version)
): Promise<Tiles3DTilesetJSONPostprocessed> {
  validateRequiredExtensions(tilesetJson.extensionsRequired, formatVersion === '2.0-draft');
  validateVectorPreviewExtensions(tilesetJson.root);

  const tilesetUrl = context?.url || options?.core?.baseUrl || '';
  const basePath = getBaseUri(tilesetUrl) || context?.baseUrl || '';
  const normalizedRoot = await normalizeTileHeaders(tilesetJson, basePath, options || {}, context);
  const tilesetJsonPostprocessed: Tiles3DTilesetJSONPostprocessed = {
    ...tilesetJson,
    shape: 'tileset3d',
    formatVersion,
    url: tilesetUrl,
    queryString: context?.queryString || getQueryString(tilesetUrl),
    basePath,
    root: normalizedRoot || tilesetJson.root,
    type: TILESET_TYPE.TILES3D,
    spatialMetadata: get3DTilesSpatialReference(tilesetJson),
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: tilesetJson.root?.geometricError || 0
  } as Tiles3DTilesetJSONPostprocessed;
  tilesetJsonPostprocessed.loader = Tiles3DLoaderWithParser;
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
function validateRequiredExtensions(
  extensionsRequired: string[] | undefined,
  isDraft2: boolean
): void {
  if (isDraft2 && !extensionsRequired?.includes('3DTILES_tileset')) {
    throw new Error('3DTILES_tileset must be declared in extensionsRequired');
  }
  const supportedExtensions = isDraft2
    ? SUPPORTED_3D_TILES_2_EXTENSIONS
    : SUPPORTED_3D_TILES_EXTENSIONS;
  const unsupportedExtensions = [
    ...new Set(
      (extensionsRequired || []).filter(extensionName => !supportedExtensions.has(extensionName))
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
  context?: LoaderContext,
  parsedGltf?: GLTFWithBuffers
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
    preprocessedContent.contentType === 'gltf' ? preprocessedContent.jsonPayload : undefined,
    parsedGltf
  );
  return tile.content;
}

/** Parses glTF exactly once so draft 3D Tiles structure can be classified independent of URL. */
async function parseGltfForClassification(
  data: ArrayBuffer,
  preprocessedContent: GltfPreprocessedContent,
  options: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<GLTFWithBuffers> {
  if (!context) {
    throw new Error('3D Tiles glTF parsing requires a loader context');
  }
  const isJsonTileset =
    preprocessedContent.contentType === 'gltf' &&
    Boolean(preprocessedContent.jsonPayload.extensions?.['3DTILES_tileset']);
  const loadGLTF = options['3d-tiles']?.loadGLTF !== false;
  const parseOptions =
    isJsonTileset || !loadGLTF
      ? {
          ...options,
          gltf: {
            ...(options.gltf as Record<string, unknown> | undefined),
            loadBuffers: false,
            loadFiles: false,
            loadExternalAssets: false,
            loadImages: false,
            decompressMeshes: false
          }
        }
      : options;
  const gltfLoaderWithParser = await GLTFLoader.preload();
  const input = preprocessedContent.contentType === 'gltf' ? preprocessedContent.jsonPayload : data;
  return await gltfLoaderWithParser.parse(input, parseOptions, context);
}

type GltfPreprocessedContent =
  | Extract<Preprocessed3DTileContent, {contentType: 'gltf'}>
  | {contentType: 'glb'; binaryPayload: ArrayBuffer};

/** Converts a supported legacy asset version to the normalized public discriminator. */
function getFormatVersion(version: string): '0.0' | '1.0' | '1.1' {
  if (version === '0.0' || version === '1.0' || version === '1.1') {
    return version;
  }
  throw new Error(`Unsupported 3D Tiles version: ${version}`);
}

/** Validates the preview vector extension wherever it appears on explicit content headers. */
function validateVectorPreviewExtensions(root: Tiles3DTilesetJSON['root']): void {
  const stack = root ? [root] : [];
  while (stack.length) {
    const tile = stack.pop()!;
    const contents = Array.isArray(tile.content)
      ? tile.content
      : tile.content
        ? [tile.content]
        : [];
    for (const content of contents) {
      const extension = content.extensions?.['3DTILES_content_gltf_vector'] as
        | {vector?: unknown; clip?: unknown}
        | undefined;
      if (!extension) {
        continue;
      }
      if (
        extension.vector !== true ||
        (extension.clip !== undefined && typeof extension.clip !== 'boolean')
      ) {
        throw new Error(
          '3DTILES_content_gltf_vector: vector must be true and clip must be boolean when present'
        );
      }
    }
    stack.push(...(tile.children || []));
  }
}

/** Get base name */
function getBaseUri(tilesetUrl: string): string {
  if (!tilesetUrl) {
    return '';
  }
  if (/^[a-z][0-9a-z+.-]*:/i.test(tilesetUrl)) {
    try {
      const baseUrl = new URL('.', tilesetUrl);
      baseUrl.search = '';
      return baseUrl.toString().replace(/\/$/, '');
    } catch {
      return '';
    }
  }
  return path.dirname(tilesetUrl);
}

/** Returns the query component without the leading question mark. */
function getQueryString(resourceUrl: string): string {
  const queryIndex = resourceUrl.indexOf('?');
  return queryIndex >= 0 ? resourceUrl.slice(queryIndex + 1) : '';
}
