import VectorTileFeature from './vector-tile-feature';

export default class VectorTileLayer{
  // Public
  version: number;
  name: string;
  extent: number;
  length: number;

  constructor(pbf, end);

	/** return feature `i` from this layer as a `VectorTileFeature` */
	feature(i: number): VectorTileFeature;
}
