import Protobuf from 'pbf';

/**
 * Wrapper around Mapbox PBF representation of
 * a feature in a vector tile. It has the same semantics
 * as the original library (https://github.com/mapbox/vector-tile-js)
 * except that the features it contains expose their data
 * in a binary optimized format, rather than geoJSON.
 * The standard geoJSON types are preserved, but rather than
 * the geometry containing a `coordinates` (multi-dimensional) array
 * the spatial data is stored in a flat `data` array and then
 * referenced by indices in a separate `lines` array, e.g.
 *   geometry: {
 *     type: 'Point', data: [1,2], lines: [0]
 *   }
 */
export default class VectorTileFeature {
  static types: ['Unknown', 'Point', 'LineString', 'Polygon'];

  properties: object;
  extent: any;
  type: number;
  id?: number;

  constructor(pbf: Protobuf, end, extent, keys, values, firstPassData);

  loadGeometry();
  any;
  classifyRings(geom: {data: [number]; lines: [number]}): {
    data: [number];
    areas: [[number]];
    lines: [[number]];
  };
  toBinaryCoordinates(
    options: {x: number; y: number; z: number} | (([number], VectorTileFeature) => void)
  ): object;
}

export const TEST_EXPORTS;
