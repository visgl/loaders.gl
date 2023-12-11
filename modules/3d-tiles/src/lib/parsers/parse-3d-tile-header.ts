// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Tiles3DLoaderOptions} from '../../tiles-3d-loader';
import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {path} from '@loaders.gl/loader-utils';
import {Tile3DSubtreeLoader} from '../../tile-3d-subtree-loader';
import {load} from '@loaders.gl/core';
import {LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE} from '@loaders.gl/tiles';
import {
  ImplicitTilingExensionData,
  Subtree,
  Tile3DBoundingVolume,
  Tiles3DTileContentJSON,
  Tiles3DTileJSON,
  Tiles3DTileJSONPostprocessed,
  Tiles3DTilesetJSON
} from '../../types';
import type {S2VolumeBox} from './helpers/parse-3d-implicit-tiles';
import {parseImplicitTiles, replaceContentUrlTemplate} from './helpers/parse-3d-implicit-tiles';
import type {S2VolumeInfo} from '../utils/obb/s2-corners-to-obb';
import {convertS2BoundingVolumetoOBB} from '../utils/obb/s2-corners-to-obb';

/** Options for recursive loading implicit subtrees */
export type ImplicitOptions = {
  /** Template of the full url of the content template */
  contentUrlTemplate: string;
  /** Template of the full url of the subtree  */
  subtreesUriTemplate: string;
  /** Implicit subdivision scheme */
  subdivisionScheme: 'QUADTREE' | 'OCTREE' | string;
  /** Levels per subtree */
  subtreeLevels: number;
  /** Maximum implicit level through all subtrees */
  maximumLevel?: number;
  /** 3DTiles refine method (add/replace) */
  refine?: string;
  /** Tileset base path */
  basePath: string;
  /** 3DTiles LOD metric type */
  lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  /** Root metric value of the root tile of the implicit subtrees */
  rootLodMetricValue: number;
  /** Bounding volume of the root tile of the implicit subtrees */
  rootBoundingVolume: Tile3DBoundingVolume;
  /** Function that detects TILE_TYPE by tile metadata and content URL */
  getTileType: (tile: Tiles3DTileJSON, tileContentUrl?: string) => TILE_TYPE | string;
  /** Function that converts string refine method to enum value */
  getRefine: (refine?: string) => TILE_REFINEMENT | string | undefined;
};

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

function resolveUri(uri: string, basePath: string): string {
  // url scheme per RFC3986
  const urlSchemeRegex = /^[a-z][0-9a-z+.-]*:/i;

  if (urlSchemeRegex.test(basePath)) {
    const url = new URL(uri, `${basePath}/`);
    return decodeURI(url.toString());
  } else if (uri.startsWith('/')) {
    return uri;
  }

  return path.resolve(basePath, uri);
}

export function normalizeTileData(
  tile: Tiles3DTileJSON | null,
  basePath: string
): Tiles3DTileJSONPostprocessed | null {
  if (!tile) {
    return null;
  }
  let tileContentUrl: string | undefined;
  if (tile.content) {
    const contentUri = tile.content.uri || tile.content?.url;
    if (typeof contentUri !== 'undefined') {
      // sparse implicit tilesets may not define content for all nodes
      tileContentUrl = resolveUri(contentUri, basePath);
    }
  }
  const tilePostprocessed: Tiles3DTileJSONPostprocessed = {
    ...tile,
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

// normalize tile headers
export async function normalizeTileHeaders(
  tileset: Tiles3DTilesetJSON,
  basePath: string,
  options: LoaderOptions
): Promise<Tiles3DTileJSONPostprocessed | null> {
  let root: Tiles3DTileJSONPostprocessed | null = null;

  const rootImplicitTilingExtension = getImplicitTilingExtensionData(tileset.root);
  if (rootImplicitTilingExtension && tileset.root) {
    root = await normalizeImplicitTileHeaders(
      tileset.root,
      tileset,
      basePath,
      rootImplicitTilingExtension,
      options
    );
  } else {
    root = normalizeTileData(tileset.root, basePath);
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
          options
        );
      } else {
        childHeaderPostprocessed = normalizeTileData(childHeader, basePath);
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
 * Do normalisation of implicit tile headers
 * TODO Check if Tile3D class can be a return type here.
 * @param tileset
 */
export async function normalizeImplicitTileHeaders(
  tile: Tiles3DTileJSON,
  tileset: Tiles3DTilesetJSON,
  basePath: string,
  implicitTilingExtension: ImplicitTilingExensionData,
  options: Tiles3DLoaderOptions
): Promise<Tiles3DTileJSONPostprocessed | null> {
  const {
    subdivisionScheme,
    maximumLevel,
    availableLevels,
    subtreeLevels,
    subtrees: {uri: subtreesUriTemplate}
  } = implicitTilingExtension;
  const replacedUrlTemplate = replaceContentUrlTemplate(subtreesUriTemplate, 0, 0, 0, 0);
  const subtreeUrl = resolveUri(replacedUrlTemplate, basePath);
  const subtree = await load(subtreeUrl, Tile3DSubtreeLoader, options);
  const tileContentUri = tile.content?.uri;
  const contentUrlTemplate = tileContentUri ? resolveUri(tileContentUri, basePath) : '';
  const refine = tileset?.root?.refine;
  // @ts-ignore
  const rootLodMetricValue = tile.geometricError;

  // Replace tile.boundingVolume with the the bounding volume specified by the extensions['3DTILES_bounding_volume_S2']
  const s2VolumeInfo: S2VolumeInfo = tile.boundingVolume.extensions?.['3DTILES_bounding_volume_S2'];
  if (s2VolumeInfo) {
    const box = convertS2BoundingVolumetoOBB(s2VolumeInfo);
    const s2VolumeBox: S2VolumeBox = {box, s2VolumeInfo};
    tile.boundingVolume = s2VolumeBox;
  }

  const rootBoundingVolume = tile.boundingVolume;

  const implicitOptions: ImplicitOptions = {
    contentUrlTemplate,
    subtreesUriTemplate,
    subdivisionScheme,
    subtreeLevels,
    maximumLevel: Number.isFinite(availableLevels) ? availableLevels - 1 : maximumLevel,
    refine,
    basePath,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue,
    rootBoundingVolume,
    getTileType,
    getRefine
  };

  return await normalizeImplicitTileData(tile, basePath, subtree, implicitOptions, options);
}

/**
 * Do implicit data normalisation to create hierarchical tile structure
 * @param tile
 * @param rootSubtree
 * @param options
 * @returns
 */
export async function normalizeImplicitTileData(
  tile: Tiles3DTileJSON,
  basePath: string,
  rootSubtree: Subtree,
  implicitOptions: ImplicitOptions,
  loaderOptions: Tiles3DLoaderOptions
): Promise<Tiles3DTileJSONPostprocessed | null> {
  if (!tile) {
    return null;
  }

  const {children, contentUrl} = await parseImplicitTiles({
    subtree: rootSubtree,
    implicitOptions,
    loaderOptions
  });

  let tileContentUrl: string | undefined;
  let tileContent: Tiles3DTileContentJSON | null = null;
  if (contentUrl) {
    tileContentUrl = contentUrl;
    tileContent = {uri: contentUrl.replace(`${basePath}/`, '')};
  }
  const tilePostprocessed: Tiles3DTileJSONPostprocessed = {
    ...tile,
    id: tileContentUrl,
    contentUrl: tileContentUrl,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    lodMetricValue: tile.geometricError,
    transformMatrix: tile.transform,
    type: getTileType(tile, tileContentUrl),
    refine: getRefine(tile.refine),
    content: tileContent || tile.content,
    children
  };

  return tilePostprocessed;
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
