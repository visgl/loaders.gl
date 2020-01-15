import {VectorTile} from '@mapbox/vector-tile';
import Protobuf from 'pbf';

/*
  * Parse MVT arrayBuffer and return GeoJSON.
  *
  * @param {arrayBuffer} _ A MVT arrayBuffer
  * @return {?Object} A GeoJSON geometry object
  */
export default function parseMVT(input, options) {
  if (input.byteLength === 0) {
    return [];
  }

  const tile = new VectorTile(new Protobuf(input));
  const mvtOptions = options.mvt;
  const features = [];

  for (const layerName in tile.layers) {
    const vectorTileLayer = tile.layers[layerName];

    for (let i = 0; i < vectorTileLayer.length; i++) {
      const vectorTileFeature = vectorTileLayer.feature(i);

      const feature = vectorTileFeature.toGeoJSON(
        mvtOptions.tileProperties.x,
        mvtOptions.tileProperties.y,
        mvtOptions.tileProperties.z
      );

      features.push(feature);
    }
  }

  return features;
}
