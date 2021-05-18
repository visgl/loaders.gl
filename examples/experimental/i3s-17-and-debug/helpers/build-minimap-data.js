import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';

export function buildMinimapData(tiles) {
  return tiles
    .map(tile => {
      if (!tile.selected || !tile.viewportIds.includes('main')) {
        return null;
      }
      const {boundingVolume} = tile;
      const cartographicOrigin = new Vector3();
      Ellipsoid.WGS84.cartesianToCartographic(boundingVolume.center, cartographicOrigin);
      let radius = 10; // Set default radius to 10 meters
      if (boundingVolume.radius) {
        radius = boundingVolume.radius;
      } else if (boundingVolume.halfAxes) {
        const boundingShpere = boundingVolume.getBoundingSphere();
        radius = boundingShpere.radius;
      }
      return {
        coordinates: cartographicOrigin,
        radius
      };
    })
    .filter(Boolean);
}
