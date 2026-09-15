// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, StrictLoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
// / import type { GLTFLoaderOptions } from '@loaders.gl/gltf';
import type {DracoLoaderOptions} from '@loaders.gl/draco';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';
import {GLBLoader, GLTFLoader} from '@loaders.gl/gltf';
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
  get3DTiles2SubtreeBufferIndices,
  get3DTiles2SubtreeBufferViewIndices,
  parse3DTiles2Subtree,
  parse3DTiles2Tileset,
  type Tiles3DPackageFile
} from './lib/parsers/parse-3d-tiles-2-gltf';
import {Tiles3DTileContentSchema} from './tileset-zod-schema';

type Tiles3DLoaderContext = LoaderContext & {
  _tiles3dPackageFiles?: Tiles3DPackageFile[];
};

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
  '3DTILES_content_gltf',
  '3DTILES_content_gltf_vector'
]);

const SUPPORTED_3D_TILES_2_EXTENSIONS: ReadonlySet<string> = new Set([
  '3DTILES_tileset',
  '3DTILES_tileset_vectors',
  '3DTILES_implicit_tiling',
  '3DTILES_subtree',
  '3DTILES_shape_ellipsoid_region',
  '3DTILES_shape_s2',
  '3DTILES_shape_cylinder_region',
  'EXT_geospatial_crs',
  'EXT_geospatial_crs_wkid',
  'EXT_geospatial_crs_wkt2',
  'EXT_georeference',
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
    if (!isGltfSubtreeCandidate(data)) {
      return await parse3DTilesSubtree(data, options, context);
    }
    const subtreeContent = preprocess3DTileContent(data);
    const parsedSubtreeGltf = await parseGltfForClassification(
      data,
      subtreeContent as GltfPreprocessedContent,
      options,
      context,
      true
    );
    if (!is3DTiles2Subtree(parsedSubtreeGltf)) {
      throw new Error('Expected a glTF 3DTILES_subtree resource');
    }
    validateRequiredExtensions(
      parsedSubtreeGltf.json.extensionsRequired,
      true,
      'subtree',
      parsedSubtreeGltf.json.extensions
    );
    const resourceUrl = context?.url || options.core?.baseUrl || '';
    return parse3DTiles2Subtree(
      parsedSubtreeGltf,
      getGltfResourceBasePath(resourceUrl, context),
      (context as Tiles3DLoaderContext | undefined)?._tiles3dPackageFiles
    ) as Subtree;
  }
  const preprocessedContent = preprocess3DTileContent(data);
  if (preprocessedContent.contentType === 'externalTileset') {
    getIsTileset(preprocessedContent.contentType, loaderOptions.isTileset);
    return parseTileset(preprocessedContent.jsonPayload as Tiles3DTilesetJSON, options, context);
  }

  if (preprocessedContent.contentType === 'gltf' || preprocessedContent.contentType === 'glb') {
    const classificationJson = await getGltfClassificationJson(
      data,
      preprocessedContent as GltfPreprocessedContent
    );
    const isTileset = Boolean(classificationJson.extensions?.['3DTILES_tileset']);
    const loadStructureBuffers = Boolean(classificationJson.extensions?.['3DTILES_subtree']);
    const parsedGltf = await parseGltfForClassification(
      data,
      preprocessedContent as GltfPreprocessedContent,
      options,
      context,
      loadStructureBuffers,
      isTileset
    );
    if (is3DTiles2Tileset(parsedGltf)) {
      getIsTileset('tileset2', loaderOptions.isTileset);
      validateRequiredExtensions(
        parsedGltf.json.extensionsRequired,
        true,
        'tileset',
        parsedGltf.json.extensions
      );
      const resourceUrl = context?.url || options.core?.baseUrl || '';
      const resourceBasePath = getGltfResourceBasePath(resourceUrl, context);
      const tilesetJson = parse3DTiles2Tileset(
        parsedGltf,
        resourceBasePath,
        (context as Tiles3DLoaderContext | undefined)?._tiles3dPackageFiles
      );
      return parseTileset(tilesetJson, options, context, '2.0-draft', resourceBasePath);
    }
    if (is3DTiles2Subtree(parsedGltf)) {
      validateRequiredExtensions(
        parsedGltf.json.extensionsRequired,
        true,
        'subtree',
        parsedGltf.json.extensions
      );
      const resourceUrl = context?.url || options.core?.baseUrl || '';
      return parse3DTiles2Subtree(
        parsedGltf,
        getGltfResourceBasePath(resourceUrl, context),
        (context as Tiles3DLoaderContext | undefined)?._tiles3dPackageFiles
      ) as Subtree;
    }
    getIsTileset(preprocessedContent.contentType, loaderOptions.isTileset);
    return parseTile(data, preprocessedContent, options, context, parsedGltf);
  }

  getIsTileset(preprocessedContent.contentType, loaderOptions.isTileset);
  return parseTile(data, preprocessedContent, options, context);
}

/** Returns whether subtree bytes could contain a JSON glTF or GLB draft subtree resource. */
function isGltfSubtreeCandidate(data: ArrayBuffer): boolean {
  const bytes = new Uint8Array(data);
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  ) {
    return true;
  }
  const firstContentByte =
    bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
  for (let byteIndex = firstContentByte; byteIndex < bytes.length; byteIndex++) {
    const byte = bytes[byteIndex];
    if (byte !== 0x09 && byte !== 0x0a && byte !== 0x0d && byte !== 0x20) {
      return byte === 0x7b;
    }
  }
  return false;
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
 * @param resourceBasePath - Optional resource base retained from a draft glTF package.
 * @returns Normalized tileset runtime metadata.
 */
async function parseTileset(
  tilesetJson: Tiles3DTilesetJSON,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext,
  formatVersion: Tiles3DFormatVersion = getFormatVersion(tilesetJson.asset.version),
  resourceBasePath?: string
): Promise<Tiles3DTilesetJSONPostprocessed> {
  validateRequiredExtensions(
    tilesetJson.extensionsRequired,
    formatVersion === '2.0-draft',
    'tileset',
    tilesetJson.extensions
  );
  validateVectorPreviewExtensions(
    tilesetJson.root,
    tilesetJson.extensionsRequired?.includes('3DTILES_content_gltf_vector') || false
  );

  const tilesetUrl = context?.url || options?.core?.baseUrl || '';
  const basePath = resourceBasePath || getBaseUri(tilesetUrl) || context?.baseUrl || '';
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
 * @param extensionsRequired - Extension names whose semantics are required by the resource.
 * @param isDraft2 - Whether the resource uses the draft 2.0 representation.
 * @param draftResource - Draft resource category used to select the structural extension.
 * @param extensions - Top-level extension objects used to validate required designations.
 * @throws When one or more required extensions are unsupported.
 */
function validateRequiredExtensions(
  extensionsRequired: string[] | undefined,
  isDraft2: boolean,
  draftResource: 'tileset' | 'subtree' = 'tileset',
  extensions?: Record<string, unknown>
): void {
  const requiredDraftExtension =
    draftResource === 'subtree' ? '3DTILES_subtree' : '3DTILES_tileset';
  if (isDraft2 && !extensionsRequired?.includes(requiredDraftExtension)) {
    throw new Error(`${requiredDraftExtension} must be declared in extensionsRequired`);
  }
  if (
    isDraft2 &&
    draftResource === 'subtree' &&
    extensionsRequired?.includes('3DTILES_tileset_vectors')
  ) {
    throw new Error('Unsupported required 3D Tiles subtree extension: 3DTILES_tileset_vectors');
  }
  if (
    isDraft2 &&
    extensionsRequired?.includes('3DTILES_tileset_vectors') &&
    (!extensions?.['3DTILES_tileset_vectors'] ||
      typeof extensions['3DTILES_tileset_vectors'] !== 'object' ||
      Array.isArray(extensions['3DTILES_tileset_vectors']))
  ) {
    throw new Error(
      '3DTILES_tileset_vectors must define an extension object when declared in extensionsRequired'
    );
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

/**
 * Parses glTF exactly once so draft 3D Tiles structure can be classified independent of URL.
 *
 * @param data - Original glTF or GLB resource bytes.
 * @param preprocessedContent - Structure-first glTF payload classification.
 * @param options - Loader options forwarded to the glTF parser.
 * @param context - Loader context used for external glTF resources.
 * @param loadStructureBuffers - Whether hierarchy data must load despite `loadGLTF: false`.
 * @returns Parsed glTF with the data required to classify and normalize the resource.
 */
async function parseGltfForClassification(
  data: ArrayBuffer,
  preprocessedContent: GltfPreprocessedContent,
  options: Tiles3DLoaderOptions,
  context?: LoaderContext,
  loadStructureBuffers = false,
  isTileset = false
): Promise<GLTFWithBuffers> {
  if (!context) {
    throw new Error('3D Tiles glTF parsing requires a loader context');
  }
  const loadGLTF = options['3d-tiles']?.loadGLTF !== false;
  const loadSelectedStructureBuffers = loadStructureBuffers;
  const parseOptions = loadSelectedStructureBuffers
    ? {
        ...options,
        gltf: {
          ...(options.gltf as Record<string, unknown> | undefined),
          loadBuffers: true,
          loadBufferIndices: get3DTiles2SubtreeBufferIndices,
          decompressBufferViewIndices: get3DTiles2SubtreeBufferViewIndices,
          loadFiles: false,
          loadExternalAssets: false,
          loadImages: false,
          decompressMeshes: false
        }
      }
    : isTileset || !loadGLTF
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

/**
 * Reads only the glTF JSON needed to choose lazy structure-loading options.
 *
 * @param data - Original glTF or GLB bytes.
 * @param preprocessedContent - Payload classification from the 3D Tiles preprocessor.
 * @returns Parsed glTF JSON without loading URI-backed resources.
 */
async function getGltfClassificationJson(
  data: ArrayBuffer,
  preprocessedContent: GltfPreprocessedContent
): Promise<Record<string, any>> {
  if (preprocessedContent.contentType === 'gltf') {
    return preprocessedContent.jsonPayload;
  }
  const glbLoaderWithParser = await GLBLoader.preload();
  return glbLoaderWithParser.parseSync(data).json;
}

type GltfPreprocessedContent =
  | Extract<Preprocessed3DTileContent, {contentType: 'gltf'}>
  | {contentType: 'glb'; binaryPayload: ArrayBuffer};

/**
 * Preserves the virtual base used to resolve files nested inside an embedded glTF package.
 *
 * @param resourceUrl - URL or package name of the current glTF resource.
 * @param context - Loader context that may carry a virtual package base.
 * @returns Base path for package-file resolution.
 */
function getGltfResourceBasePath(resourceUrl: string, context?: LoaderContext): string {
  if (context?.baseUrl?.startsWith('gltf-package:')) {
    const packageBaseUrl = context.baseUrl.replace(/\/$/, '');
    const packageRelativeUrl = resourceUrl.startsWith(`${packageBaseUrl}/`)
      ? resourceUrl.slice(packageBaseUrl.length + 1)
      : resourceUrl;
    const resourceDirectory = getBaseUri(packageRelativeUrl);
    return resourceDirectory ? `${packageBaseUrl}/${resourceDirectory}` : packageBaseUrl;
  }
  return getBaseUri(resourceUrl) || context?.baseUrl || '';
}

/** Converts a supported legacy asset version to the normalized public discriminator. */
function getFormatVersion(version: string): '0.0' | '1.0' | '1.1' {
  if (version === '0.0' || version === '1.0' || version === '1.1') {
    return version;
  }
  throw new Error(`Unsupported 3D Tiles version: ${version}`);
}

/**
 * Validates preview-vector designations on explicit content headers.
 *
 * @param root - Root of the explicit 1.x tile hierarchy.
 * @param isRequired - Whether the tileset requires at least one preview-vector designation.
 */
function validateVectorPreviewExtensions(
  root: Tiles3DTilesetJSON['root'],
  isRequired: boolean
): void {
  const stack = root ? [root] : [];
  let hasVectorDesignation = false;
  while (stack.length) {
    const tile = stack.pop()!;
    if (tile.content !== undefined && tile.contents !== undefined) {
      throw new Error('3D Tiles tiles must not define both content and contents');
    }
    if (tile.contents !== undefined && !Array.isArray(tile.contents)) {
      throw new Error('3D Tiles tile contents must be an array');
    }
    if (tile.contents?.length === 0) {
      throw new Error('3D Tiles tile contents array must contain at least one entry');
    }
    const legacyContents = Array.isArray(tile.content)
      ? tile.content
      : tile.content
        ? [tile.content]
        : [];
    const contents = [...legacyContents, ...(tile.contents || [])];
    if (contents.some(content => !Tiles3DTileContentSchema.safeParse(content).success)) {
      throw new Error('3D Tiles tile content entries must be objects with a valid uri or url');
    }
    for (const content of contents) {
      const extension = content.extensions?.['3DTILES_content_gltf_vector'] as
        | {vector?: unknown; clip?: unknown}
        | undefined;
      if (!extension) {
        continue;
      }
      hasVectorDesignation = true;
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
  if (isRequired && !hasVectorDesignation) {
    throw new Error(
      '3DTILES_content_gltf_vector must designate content when declared in extensionsRequired'
    );
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
