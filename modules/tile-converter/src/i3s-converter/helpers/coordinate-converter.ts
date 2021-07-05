import {Matrix3, Quaternion, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';
import TileHeader from '@loaders.gl/tiles/src/tileset/tile-3d';
import {GeoidHeightModel} from '../../lib/geoid-height-model';
import {Tileset3D} from '@loaders.gl/tiles';

import type {BoundingVolumes, Extent, Mbs, Obb} from '../../types';

/**
 * Create bounding volumes object from tile and geoid height model.
 * @param tile
 * @param geoidHeightModel
 * @returns - Bounding volumes object
 */
export function createBoundingVolumes(
  tile: TileHeader,
  geoidHeightModel: GeoidHeightModel
): BoundingVolumes {
  let radius;
  let halfSize;
  let quaternion;

  const boundingVolume = tile.boundingVolume;
  const cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(
    boundingVolume.center,
    new Vector3()
  );
  cartographicCenter[2] =
    cartographicCenter[2] -
    geoidHeightModel.getHeight(cartographicCenter[1], cartographicCenter[0]);
  if (boundingVolume instanceof OrientedBoundingBox) {
    halfSize = boundingVolume.halfSize;
    radius = new Vector3(halfSize[0], halfSize[1], halfSize[2]).len();
    quaternion = boundingVolume.quaternion;
  } else {
    radius = tile.boundingVolume.radius;
    halfSize = [radius, radius, radius];
    quaternion = new Quaternion()
      .fromMatrix3(new Matrix3([halfSize[0], 0, 0, 0, halfSize[1], 0, 0, 0, halfSize[2]]))
      .normalize();
  }

  return {
    mbs: [cartographicCenter[0], cartographicCenter[1], cartographicCenter[2], radius],
    obb: {
      center: [cartographicCenter[0], cartographicCenter[1], cartographicCenter[2]],
      halfSize,
      quaternion
    }
  };
}

/**
 * Convert common coordinate to extent coordinate
 * @param tileset
 * @returns - Extent
 */
export function convertCommonToI3SExtentCoordinate(tileset: Tileset3D): Extent {
  const cartesianCenter = tileset.cartesianCenter;
  const radius = tileset.lodMetricValue;
  const rightTop = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(cartesianCenter[0] + radius, cartesianCenter[1] + radius, cartesianCenter[2]),
    new Vector3()
  );
  const leftBottom = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(cartesianCenter[0] - radius, cartesianCenter[1] - radius, cartesianCenter[2]),
    new Vector3()
  );
  const isFirstRight = rightTop[0] < leftBottom[0];
  const isFirstTop = rightTop[1] < leftBottom[1];

  return [
    isFirstRight ? rightTop[0] : leftBottom[0],
    isFirstTop ? rightTop[1] : leftBottom[1],
    isFirstRight ? leftBottom[0] : rightTop[0],
    isFirstTop ? leftBottom[1] : rightTop[1]
  ];
}

/**
 * Creates oriented boundinb box from mbs.
 * @param mbs - Minimum Bounding Sphere
 * @returns - Oriented BOunding Box
 */
export function createObbFromMbs(mbs: Mbs): Obb {
  const radius = mbs[3];
  const center = new Vector3(mbs[0], mbs[1], mbs[2]);
  const halfAxex = new Matrix3([radius, 0, 0, 0, radius, 0, 0, 0, radius]);
  return new OrientedBoundingBox(center, halfAxex);
}
