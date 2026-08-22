// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Tiles3DLoaderOptions} from '../../tiles-3d-loader';
import type {LoaderContext, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {CachedUriResolver} from '@loaders.gl/loader-utils';
import {
  createImplicitSubtreeReference,
  LOD_METRIC_TYPE,
  materializeImplicitSubtree,
  TILE_REFINEMENT,
  TILE_TYPE
} from '@loaders.gl/tiles';
import type {ImplicitTilingDescriptor} from '@loaders.gl/tiles';
import {
  ImplicitTilingExensionData,
  Subtree,
  Tile3DBoundingVolume,
  Tiles3DTileJSON,
  Tiles3DTileJSONPostprocessed,
  Tiles3DTilesetJSON
} from '../../types';
import type {S2VolumeInfo} from '../utils/obb/s2-corners-to-obb';
import {convertS2BoundingVolumetoOBB} from '../utils/obb/s2-corners-to-obb';

/**
 * Serializable options used to materialize implicit subtree resources on demand.
 *
 * @deprecated Prefer {@link ImplicitTilingDescriptor}; this alias remains for internal callers.
 */
export type ImplicitOptions = ImplicitTilingDescriptor;

function getTileType(tile: Tiles3DTileJSON, tileContentUrl: string = ''): TILE_TYPE | string {
  if (!tileContentUrl) {
    return TILE_TYPE.EMPTY;
  }

  const contentUrl = tileContentUrl.split('?')[0]; // Discard query string
  const fileExtension = contentUrl.split('.').pop();
  switch (fileExtension) {
    case 'pnts':
      return TILE_TYPE.POINTCLOUD;
    case 'i3dm':
    case 'b3dm':
    case 'glb':
    case 'gltf':
      return TILE_TYPE.SCENEGRAPH;
    default:
      return fileExtension || TILE_TYPE.EMPTY;
  }
}

function getRefine(refine?: string): TILE_REFINEMENT | string | undefined {
  switch (refine) {
    case 'REPLACE':
    case 'replace':
      return TILE_REFINEMENT.REPLACE;
    case 'ADD':
    case 'add':
      return TILE_REFINEMENT.ADD;
    default:
      return refine;
  }
}

/**
 * Normalizes one explicit tile header into the runtime representation.
 *
 * @param tile - Source tile header, or `null` for an unavailable implicit tile.
 * @param basePath - Directory used for relative resource resolution.
 * @param resourceResolver - Parse-scoped resolver that caches the parsed base and repeated URIs.
 * @returns Normalized runtime header, or `null` when no source tile is available.
 */
export function normalizeTileData(
  tile: Tiles3DTileJSON | null,
  basePath: string,
  resourceResolver: CachedUriResolver = new CachedUriResolver(basePath)
): Tiles3DTileJSONPostprocessed | null {
  if (!tile) {
    return null;
  }
  let tileContentUrl: string | undefined;
  if (tile.content) {
    const contentUri = tile.content.uri || tile.content?.url;
    if (typeof contentUri !== 'undefined') {
      // sparse implicit tilesets may not define content for all nodes
      tileContentUrl = resourceResolver.resolve(contentUri);
    }
  }
  const boundingVolume = normalizeS2BoundingVolume(tile.boundingVolume) as Tile3DBoundingVolume;
  const content = tile.content
    ? {
        ...tile.content,
        boundingVolume: normalizeS2BoundingVolume(tile.content.boundingVolume)
      }
    : undefined;
  const viewerRequestVolume = normalizeS2BoundingVolume(tile.viewerRequestVolume);
  const tilePostprocessed: Tiles3DTileJSONPostprocessed = {
    ...tile,
    boundingVolume,
    content,
    viewerRequestVolume,
    id: tileContentUrl,
    contentUrl: tileContentUrl,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: tile.geometricError,
    transformMatrix: tile.transform,
    type: getTileType(tile, tileContentUrl),
    refine: getRefine(tile.refine)
  };

  return tilePostprocessed;
}

/**
 * Converts an S2-only bounding volume into the oriented-box representation used by traversal.
 *
 * `3DTILES_bounding_volume_S2` may appear on explicit or implicit tile, content, and viewer-request
 * volumes. Keeping the source extension metadata beside the derived box lets implicit subdivision
 * retain its S2 token while ensuring every explicit volume reaches runtime with a supported
 * `box`, `region`, or `sphere` shape.
 *
 * @param boundingVolume - Source bounding volume, if the owning property is present.
 * @returns The original volume when it does not use S2, or a cloned volume with a derived box.
 */
function normalizeS2BoundingVolume(
  boundingVolume?: Tile3DBoundingVolume
): Tile3DBoundingVolume | undefined {
  const extensions = boundingVolume?.extensions as
    | Record<string, S2VolumeInfo | undefined>
    | undefined;
  const s2VolumeInfo = extensions?.['3DTILES_bounding_volume_S2'];
  if (!boundingVolume || !s2VolumeInfo) {
    return boundingVolume;
  }

  return {
    ...boundingVolume,
    box: convertS2BoundingVolumetoOBB(s2VolumeInfo),
    s2VolumeInfo
  } as Tile3DBoundingVolume & {box: number[]; s2VolumeInfo: S2VolumeInfo};
}

/**
 * Normalizes the complete explicit header tree and creates lazy references for implicit roots.
 *
 * One {@link CachedUriResolver} is shared for the parse so repeated external resource references
 * reuse their derived URL without retaining data after the tileset parse completes.
 *
 * @param tileset - Parsed source tileset JSON.
 * @param basePath - Directory used for relative resource resolution.
 * @param options - Loader options retained for API compatibility; no subtree request occurs here.
 * @param context - Loader context retained for API compatibility; no subtree request occurs here.
 * @returns Normalized root tile, or `null` when the source has no root.
 */
export async function normalizeTileHeaders(
  tileset: Tiles3DTilesetJSON,
  basePath: string,
  options: StrictLoaderOptions,
  context?: LoaderContext
): Promise<Tiles3DTileJSONPostprocessed | null> {
  let root: Tiles3DTileJSONPostprocessed | null = null;
  // One parse-scoped resolver retains the parsed base URL and repeated derived resources without
  // leaking URLs between unrelated tilesets.
  const resourceResolver = new CachedUriResolver(basePath);

  const rootImplicitTilingExtension = getImplicitTilingExtensionData(tileset.root);
  if (rootImplicitTilingExtension && tileset.root) {
    root = await normalizeImplicitTileHeaders(
      tileset.root,
      tileset,
      basePath,
      rootImplicitTilingExtension,
      options,
      context,
      resourceResolver
    );
  } else {
    root = normalizeTileData(tileset.root, basePath, resourceResolver);
  }

  const stack: any[] = [];
  stack.push(root);

  while (stack.length > 0) {
    const tile = stack.pop() || {};
    const children = tile.children || [];
    const childrenPostprocessed: Tiles3DTileJSONPostprocessed[] = [];
    for (const childHeader of children) {
      const childImplicitTilingExtension = getImplicitTilingExtensionData(childHeader);
      let childHeaderPostprocessed: Tiles3DTileJSONPostprocessed | null;
      if (childImplicitTilingExtension) {
        childHeaderPostprocessed = await normalizeImplicitTileHeaders(
          childHeader,
          tileset,
          basePath,
          childImplicitTilingExtension,
          options,
          context,
          resourceResolver
        );
      } else {
        childHeaderPostprocessed = normalizeTileData(childHeader, basePath, resourceResolver);
      }

      if (childHeaderPostprocessed) {
        childrenPostprocessed.push(childHeaderPostprocessed);
        stack.push(childHeaderPostprocessed);
      }
    }
    tile.children = childrenPostprocessed;
  }

  return root;
}

/**
 * Creates a contentless implicit root whose subtree will be loaded by visibility-driven traversal.
 *
 * @param tile - Source tile carrying the implicit-tiling declaration.
 * @param tileset - Owning tileset JSON.
 * @param basePath - Directory used for subtree and content resolution.
 * @param implicitTilingExtension - Normalized implicit-tiling declaration.
 * @param options - Loader options retained for API compatibility.
 * @param context - Loader context retained for API compatibility.
 * @param resourceResolver - Parse-scoped resolver shared with explicit header normalization.
 * @returns Normalized implicit root, or `null` when unavailable.
 */
export async function normalizeImplicitTileHeaders(
  tile: Tiles3DTileJSON,
  tileset: Tiles3DTilesetJSON,
  basePath: string,
  implicitTilingExtension: ImplicitTilingExensionData,
  options: Tiles3DLoaderOptions,
  context?: LoaderContext,
  resourceResolver: CachedUriResolver = new CachedUriResolver(basePath)
): Promise<Tiles3DTileJSONPostprocessed | null> {
  void options;
  void context;
  const normalizedTile: Tiles3DTileJSON = {
    ...tile,
    boundingVolume: normalizeS2BoundingVolume(tile.boundingVolume) as Tile3DBoundingVolume,
    content: tile.content
      ? {
          ...tile.content,
          boundingVolume: normalizeS2BoundingVolume(tile.content.boundingVolume)
        }
      : undefined,
    viewerRequestVolume: normalizeS2BoundingVolume(tile.viewerRequestVolume)
  };
  const maximumLevel = Number.isFinite(implicitTilingExtension.availableLevels)
    ? implicitTilingExtension.availableLevels - 1
    : implicitTilingExtension.maximumLevel;
  if (!Number.isInteger(maximumLevel) || Number(maximumLevel) < 0) {
    throw new Error('Implicit tiling requires availableLevels to include at least the root level');
  }
  if (
    implicitTilingExtension.subdivisionScheme !== 'QUADTREE' &&
    implicitTilingExtension.subdivisionScheme !== 'OCTREE'
  ) {
    throw new Error(
      `Unsupported implicit subdivision scheme: ${implicitTilingExtension.subdivisionScheme}`
    );
  }

  const contentUriTemplate = normalizedTile.content?.uri || normalizedTile.content?.url || '';
  const descriptor: ImplicitTilingDescriptor = {
    contentUrlTemplate: contentUriTemplate ? resourceResolver.resolve(contentUriTemplate) : '',
    contentHeader: normalizedTile.content
      ? {...normalizedTile.content, uri: undefined, url: undefined}
      : undefined,
    subtreesUrlTemplate: resourceResolver.resolve(implicitTilingExtension.subtrees.uri),
    subdivisionScheme: implicitTilingExtension.subdivisionScheme,
    subtreeLevels: implicitTilingExtension.subtreeLevels,
    maximumLevel: Number(maximumLevel),
    refine: getRefine(normalizedTile.refine || tileset.root?.refine) || TILE_REFINEMENT.REPLACE,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue: normalizedTile.geometricError,
    rootBoundingVolume: normalizedTile.boundingVolume
  };
  const implicitSubtree = createImplicitSubtreeReference(descriptor, {
    level: 0,
    x: 0,
    y: 0,
    z: 0
  });

  return {
    ...normalizedTile,
    id: `${implicitSubtree.subtreeUrl}#implicit=0/0/0/0`,
    contentUrl: undefined,
    lodMetricType: descriptor.lodMetricType,
    lodMetricValue: descriptor.rootLodMetricValue,
    transformMatrix: normalizedTile.transform,
    type: TILE_TYPE.EMPTY,
    refine: descriptor.refine,
    children: [],
    implicitSubtree
  } as Tiles3DTileJSONPostprocessed;
}

/**
 * Materializes one already-parsed subtree without loading child subtrees.
 *
 * @param tile - Source tile carrying root transform and extension metadata.
 * @param basePath - Retained for API compatibility.
 * @param rootSubtree - Parsed subtree availability data.
 * @param implicitOptions - Serializable implicit hierarchy descriptor.
 * @param loaderOptions - Retained for API compatibility.
 * @param context - Retained for API compatibility.
 * @returns Materialized root header.
 */
export async function normalizeImplicitTileData(
  tile: Tiles3DTileJSON,
  basePath: string,
  rootSubtree: Subtree,
  implicitOptions: ImplicitOptions,
  loaderOptions: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<Tiles3DTileJSONPostprocessed | null> {
  void basePath;
  void loaderOptions;
  void context;
  if (!tile) {
    return null;
  }
  const reference = createImplicitSubtreeReference(implicitOptions, {
    level: 0,
    x: 0,
    y: 0,
    z: 0
  });
  const {root} = materializeImplicitSubtree(rootSubtree, reference);
  return {
    ...tile,
    ...root,
    transform: tile.transform,
    transformMatrix: tile.transform,
    extensions: tile.extensions,
    implicitTiling: tile.implicitTiling
  } as Tiles3DTileJSONPostprocessed;
}

/**
 * Implicit Tiling data can be in 3DTILES_implicit_tiling for 3DTiles v.Next or directly in implicitTiling object for 3DTiles v1.1.
 * Spec 3DTiles v.Next - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling
 * Spec 3DTiles v.1.1 - https://github.com/CesiumGS/3d-tiles/tree/draft-1.1/specification/ImplicitTiling
 * @param tile
 * @returns
 */
function getImplicitTilingExtensionData(tile: Tiles3DTileJSON | null): ImplicitTilingExensionData {
  return tile?.extensions?.['3DTILES_implicit_tiling'] || tile?.implicitTiling;
}
