import {LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE} from '@loaders.gl/tiles';

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

export function normalizeTileData(tile, options) {
  if (tile.content) {
    const contentUri = tile.content.uri || tile.content.url;
    tile.contentUrl = `${options.basePath}/${contentUri}`;
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

  const stack = [];
  stack.push(root);

  while (stack.length > 0) {
    const tile = stack.pop();
    const children = tile.children || [];
    for (const childHeader of children) {
      normalizeTileData(childHeader, {basePath});
      stack.push(childHeader);
    }
  }

  return root;
}
