import VectorTileFeature from './vector-tile-feature';

/**
 * Wrapper around Mapbox PBF representation of
 * a vector tile layer. It has the same semantics
 * as the original library (https://github.com/mapbox/vector-tile-js)
 * except that the features it contains expose their data
 * in a binary optimized format, rather than GeoJSON
 *
 * The VectorTileLayer class is unmodified from the original source,
 * except that the `feature` method passes through an additional
 * `firstPassData` parameter to the VectorTileFeature
 */
export default class VectorTileLayer{
  // Public
  readonly version: number;
  name: string;
  extent: number;
  length: number;

  constructor(pbf, end);

  /** return feature `i` from this layer as a `VectorTileFeature` */
  feature(i: number, firstPassData: object): VectorTileFeature;
}
