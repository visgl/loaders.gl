import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {Tile3DSubtreeLoader} from '../../tile-3d-subtree-loader';
import {load} from '@loaders.gl/core';
import {Tileset3D, LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE, Tile3D} from '@loaders.gl/tiles';
import {ImplicitTilingExtension, Subtree} from '../../types';
import type {S2VolumeBox} from './helpers/parse-3d-implicit-tiles';
import {parseImplicitTiles, replaceContentUrlTemplate} from './helpers/parse-3d-implicit-tiles';
import type {S2VolumeInfo} from '../utils/obb/s2-corners-to-obb';
import {convertS2BoundingVolumetoOBB} from '../utils/obb/s2-corners-to-obb';

function getTileType(tile) {
  if (!tile.contentUrl) {
    return TILE_TYPE.EMPTY;
  }

  const contentUrl = tile.contentUrl.split('?')[0]; // Discard query string
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
      return fileExtension;
  }
}

function getRefine(refine) {
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

function resolveUri(uri, basePath) {
  // url scheme per RFC3986
  const urlSchemeRegex = /^[a-z][0-9a-z+.-]*:/i;

  if (urlSchemeRegex.test(basePath)) {
    const url = new URL(uri, `${basePath}/`);
    return decodeURI(url.toString());
  } else if (uri.startsWith('/')) {
    return uri;
  }

  return `${basePath}/${uri}`;
}

export function normalizeTileData(tile, options) {
  if (!tile) {
    return null;
  }
  if (tile.content) {
    const contentUri = tile.content.uri || tile.content.url;
    tile.contentUrl = resolveUri(contentUri, options.basePath);
  }
  tile.id = tile.contentUrl;
  tile.lodMetricType = LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  tile.lodMetricValue = tile.geometricError;
  tile.transformMatrix = tile.transform;
  tile.type = getTileType(tile);
  tile.refine = getRefine(tile.refine);

  return tile;
}

// normalize tile headers
export async function normalizeTileHeaders(
  tileset: Tileset3D,
  options: LoaderOptions
): Promise<Tileset3D> {
  const basePath = tileset.basePath;
  let root: Tileset3D;

  const rootImplicitTilingExtension = getImplicitTilingExtensionData(tileset?.root);
  if (rootImplicitTilingExtension && tileset.root) {
    root = await normalizeImplicitTileHeaders(
      tileset.root,
      tileset,
      rootImplicitTilingExtension,
      options
    );
  } else {
    root = normalizeTileData(tileset.root, tileset);
  }

  const stack: any[] = [];
  stack.push(root);

  while (stack.length > 0) {
    const tile = stack.pop() || {};
    const children = tile.children || [];
    for (let childHeader of children) {
      const childImplicitTilingExtension = getImplicitTilingExtensionData(childHeader);
      if (childImplicitTilingExtension) {
        childHeader = await normalizeImplicitTileHeaders(
          childHeader,
          tileset,
          childImplicitTilingExtension,
          options
        );
      } else {
        normalizeTileData(childHeader, {basePath});
      }

      stack.push(childHeader);
    }
  }

  return root;
}

/**
 * Do normalisation of implicit tile headers
 * TODO Check if Tile3D class can be a return type here.
 * @param tileset
 */
export async function normalizeImplicitTileHeaders(
  tile: Tile3D,
  tileset: Tileset3D,
  implicitTilingExtension: ImplicitTilingExtension,
  options: LoaderOptions
) {
  const basePath = tileset.basePath;
  const {
    subdivisionScheme,
    maximumLevel,
    subtreeLevels,
    subtrees: {uri: subtreesUriTemplate}
  } = implicitTilingExtension;
  const replacedUrlTemplate = replaceContentUrlTemplate(subtreesUriTemplate, 0, 0, 0, 0);
  const subtreeUrl = resolveUri(replacedUrlTemplate, basePath);
  const subtree = await load(subtreeUrl, Tile3DSubtreeLoader, options);
  const contentUrlTemplate = resolveUri(tile.content.uri, basePath);
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

  const implicitOptions = {
    contentUrlTemplate,
    subtreesUriTemplate,
    subdivisionScheme,
    subtreeLevels,
    maximumLevel,
    refine,
    basePath,
    lodMetricType: LOD_METRIC_TYPE.GEOMETRIC_ERROR,
    rootLodMetricValue,
    rootBoundingVolume,
    getTileType,
    getRefine
  };

  return await normalizeImplicitTileData(tile, subtree, implicitOptions);
}

/**
 * Do implicit data normalisation to create hierarchical tile structure
 * @param tile
 * @param rootSubtree
 * @param options
 * @returns
 */
export async function normalizeImplicitTileData(tile, rootSubtree: Subtree, options: any) {
  if (!tile) {
    return null;
  }

  tile.lodMetricType = LOD_METRIC_TYPE.GEOMETRIC_ERROR;
  tile.lodMetricValue = tile.geometricError;
  tile.transformMatrix = tile.transform;

  const {children, contentUrl} = await parseImplicitTiles({
    subtree: rootSubtree,
    options,
    s2VolumeBox: tile
  });

  if (contentUrl) {
    tile.contentUrl = contentUrl;
    tile.content = {uri: contentUrl.replace(`${options.basePath}/`, '')};
  }

  tile.refine = getRefine(tile.refine);
  tile.type = getTileType(tile);
  tile.children = children;
  tile.id = tile.contentUrl;

  return tile;
}

/**
 * Implicit Tiling data can be in 3DTILES_implicit_tiling for 3DTiles v.Next or directly in implicitTiling object for 3DTiles v1.1.
 * Spec 3DTiles v.Next - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling
 * Spec 3DTiles v.1.1 - https://github.com/CesiumGS/3d-tiles/tree/draft-1.1/specification/ImplicitTiling
 * @param tile
 * @returns
 */
function getImplicitTilingExtensionData(tile: Tile3D | null): ImplicitTilingExtension {
  return tile?.extensions?.['3DTILES_implicit_tiling'] || tile?.implicitTiling;
}
