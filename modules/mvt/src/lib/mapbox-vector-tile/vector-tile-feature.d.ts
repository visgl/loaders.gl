import Protobuf from 'pbf';

export default class VectorTileFeature {
	static types: ['Unknown', 'Point', 'LineString', 'Polygon'];

  properties: object;
  extent: any;
  type: number;
  id?: number;

	constructor(pbf: Protobuf, end, extent, keys, values);

	loadGeometry(); any;
  bbox(): [number, number, number, number];
  toGeoJSON(options: {x: number, y: number, z: number} | (([[number]], VectorTileFeature) => void)): object;
}
