import {VectorTile} from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import {transformCoordinates, transformToLocalCoordinates} from './transform-to-local-range';

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

      const decodedFeature = getDecodedFeature(vectorTileFeature, mvtOptions);
      features.push(decodedFeature);
    }
  }

  return features;
}

function getDecodedFeature(feature, options = {}) {
  const wgs84Coordinates = options.coordinates === 'wgs84';
  const hasTileIndex =
    options.tileIndex && options.tileIndex.x && options.tileIndex.y && options.tileIndex.z;

  if (wgs84Coordinates && !hasTileIndex) {
    throw new Error('MVT Loader: WGS84 coordinates need tileIndex property. Check documentation.');
  }

  if (wgs84Coordinates && hasTileIndex) {
    return feature.toGeoJSON(options.tileIndex.x, options.tileIndex.y, options.tileIndex.z);
  }

  return transformCoordinates(feature, transformToLocalCoordinates);
}
