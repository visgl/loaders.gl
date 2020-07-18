import Protobuf from 'pbf';

export default class VectorTileFeature {
	static types: ['Unknown', 'Point', 'LineString', 'Polygon'];

  properties: object;
  extent: any;
  type: number;

	constructor(pbf: Protobuf, end, extent, keys, values);

	loadGeometry(); any;
  bbox(): [number, number, number, number];
	toGeoJSON(x, y, z): object;
}
