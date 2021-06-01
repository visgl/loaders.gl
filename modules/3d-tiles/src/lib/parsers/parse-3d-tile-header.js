import {LOD_METRIC_TYPE, TILE_REFINEMENT, TILE_TYPE} from '@loaders.gl/tiles';
import {Vector3, degrees} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

import {OrientedBoundingBox, BoundingSphere} from '@math.gl/culling';

const scratchNorthWest = new Vector3();
const scratchSouthEast = new Vector3();

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

/**
 * Create a bounding volume from the region
 * @param [region]
 * [west, south, east, north, minimum height, maximum height]
 * Latitudes and longitudes are in the WGS 84 datum as defined in EPSG 4979 and are in radians.
 * Heights are in meters above (or below) the WGS 84 ellipsoid.
 * @returns A new BoundingSphere instance.
 */
function createRegion(region) {
  // [west, south, east, north, minimum height, maximum height]
  // Latitudes and longitudes are in the WGS 84 datum as defined in EPSG 4979 and are in radians.
  // Heights are in meters above (or below) the WGS 84 ellipsoid.
  const [west, south, east, north, minHeight, maxHeight] = region;

  const northWest = Ellipsoid.WGS84.cartographicToCartesian(
    [degrees(west), degrees(north), minHeight],
    scratchNorthWest
  );
  const southEast = Ellipsoid.WGS84.cartographicToCartesian(
    [degrees(east), degrees(south), maxHeight],
    scratchSouthEast
  );
  const centerInCartesian = new Vector3().addVectors(northWest, southEast).multiplyScalar(0.5);
  const radius = new Vector3().subVectors(northWest, southEast).len() / 2.0;

  // TODO improve region boundingVolume
  // for now, create a sphere as the boundingVolume instead of box
  return new BoundingSphere(centerInCartesian, radius);
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

  const boxArray = tile.boundingVolume && tile.boundingVolume.box;
  const sphereArray = tile.boundingVolume && tile.boundingVolume.sphere;
  const regionArray = tile.boundingVolume && tile.boundingVolume.region;

  if (boxArray) {
    const halfSize = boxArray.slice(3);
    const box = new OrientedBoundingBox(boxArray.slice(0, 3), halfSize);
    tile.boundingVolume.box = box;
  }

  if (sphereArray) {
    const sphere = new BoundingSphere(sphereArray.slice(0, 3), sphereArray[3]);
    tile.boundingVolume.sphere = sphere;
  }

  if (regionArray) {
    tile.boundingVolume.region = createRegion(regionArray);
  }

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
