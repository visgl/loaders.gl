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
  const loaderOptions = options.mvt;
  const features = [];

  const selectedLayers = Array.isArray(loaderOptions.layers)
    ? loaderOptions.layers
    : Object.keys(tile.layers);

  selectedLayers.forEach(layerName => {
    const vectorTileLayer = tile.layers[layerName];

    if (!vectorTileLayer) {
      throw new Error(`MVT Loader: ${layerName} is not present in MVT layers`);
    }

    for (let i = 0; i < vectorTileLayer.length; i++) {
      const vectorTileFeature = vectorTileLayer.feature(i);

      const decodedFeature = getDecodedFeature(vectorTileFeature, loaderOptions, layerName);
      features.push(decodedFeature);
    }
  });

  return features;
}

function getDecodedFeature(feature, options = {}, layerName) {
  const wgs84Coordinates = options.coordinates === 'wgs84';
  const hasTileIndex =
    options.tileIndex && options.tileIndex.x && options.tileIndex.y && options.tileIndex.z;

  if (wgs84Coordinates && !hasTileIndex) {
    throw new Error('MVT Loader: WGS84 coordinates need tileIndex property. Check documentation.');
  }

  const decodedFeature =
    wgs84Coordinates && hasTileIndex
      ? feature.toGeoJSON(options.tileIndex.x, options.tileIndex.y, options.tileIndex.z)
      : transformCoordinates(feature, transformToLocalCoordinates);

  // Add layer name to GeoJSON properties
  const hasLayerProperty = decodedFeature.properties.hasOwnProperty('layer');
  const layerPropertyName = hasLayerProperty ? options.layerProperty : 'layer';
  if (layerPropertyName) {
    decodedFeature.properties[layerPropertyName] = layerName;
  }

  return decodedFeature;
}
