import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {OrientedBoundingBox} from '@math.gl/culling';

export function buildMinimapData(tiles) {
  return tiles
    .map(tile => {
      if (!tile.selected || !tile.viewportIds.includes('main')) {
        return null;
      }
      const boundingVolume = tile.boundingVolume;
      const cartographicOrigin = new Vector3();
      Ellipsoid.WGS84.cartesianToCartographic(boundingVolume.center, cartographicOrigin);
      let radius = boundingVolume.radius;
      if (!radius && boundingVolume instanceof OrientedBoundingBox) {
        const halfSize = boundingVolume.halfSize;
        radius = new Vector3(halfSize[0], halfSize[1], halfSize[2]).len();
      }
      return {
        coordinates: [cartographicOrigin[0], cartographicOrigin[1], cartographicOrigin[2]],
        radius: boundingVolume.radius
      };
    })
    .filter(tile => tile);
}
