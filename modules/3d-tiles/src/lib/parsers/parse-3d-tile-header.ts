import {Tile3DSubtreeLoader} from '../../tile-3d-subtree-loader';
import {load} from '@loaders.gl/core';
import {Tileset3D, LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE} from '@loaders.gl/tiles';
import {Subtree} from '../../types';
import {parseImplicitTiles, replaceContentUrlTemplate} from './helpers/parse-3d-implicit-tiles';

function getTileType(tile) {
  if (!tile.contentUrl) {
    return TILE_TYPE.EMPTY;
  }

  const contentUrl = tile.contentUrl;
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
export function normalizeTileHeaders(tileset) {
  const basePath = tileset.basePath;
  const root = normalizeTileData(tileset.root, tileset);

  const stack: any[] = [];
  stack.push(root);

  while (stack.length > 0) {
    const tile = stack.pop() || {};
    const children = tile.children || [];
    for (const childHeader of children) {
      normalizeTileData(childHeader, {basePath});
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
export async function normalizeImplicitTileHeaders(tileset: Tileset3D) {
  if (!tileset.root) {
    return null;
  }

  const basePath = tileset.basePath;
  const implicitTilingExtension = tileset.root.extensions['3DTILES_implicit_tiling'];
  const {
    subdivisionScheme,
    maximumLevel,
    subtreeLevels,
    subtrees: {uri: subtreesUriTemplate}
  } = implicitTilingExtension;
  const subtreeUrl = replaceContentUrlTemplate(subtreesUriTemplate, 0, 0, 0, 0);
  const rootSubtreeUrl = resolveUri(subtreeUrl, basePath);
  const rootSubtree = await load(rootSubtreeUrl, Tile3DSubtreeLoader);
  const contentUrlTemplate = resolveUri(tileset.root.content.uri, basePath);
  const refine = tileset.root.refine;
  // @ts-ignore
  const rootLodMetricValue = tileset.root.geometricError;
  const rootBoundingVolume = tileset.root.boundingVolume;

  const options = {
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

  return await normalizeImplicitTileData(tileset.root, rootSubtree, options);
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

  const {children, contentUrl} = await parseImplicitTiles({subtree: rootSubtree, options});

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
