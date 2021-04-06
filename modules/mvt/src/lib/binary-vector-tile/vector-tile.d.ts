import VectorTileLayer from './vector-tile-layer';
import Protobuf from 'pbf';

/**
 * Wrapper around Mapbox PBF representation of
 * a vector tile. It has the same semantics
 * as the original library (https://github.com/mapbox/vector-tile-js)
 * except that the features it contains expose their data
 * in a binary optimized format, rather than GeoJSON.
 *
 * The VectorTile class is unmodified from the original source
 */
export default class VectorTile {
  constructor(pbf: Protobuf, end?);
  layers: VectorTileLayer[];
}
