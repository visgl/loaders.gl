import {VectorTile} from '@mapbox/vector-tile';
import {geojsonToBinary} from '@loaders.gl/gis';
import Protobuf from 'pbf';
import {transformCoordinates, transformToLocalCoordinates} from './transform-to-local-range';

/*
  * Parse MVT arrayBuffer and return GeoJSON.
  *
  * @param {arrayBuffer} _ A MVT arrayBuffer
  * @return {?Object} A GeoJSON geometry object
  */
export default function parseMVT(arrayBuffer, options) {
  options = options || {};
  options.mvt = options.mvt || {};

  if (arrayBuffer.byteLength === 0) {
    return [];
  }

  const tile = new VectorTile(new Protobuf(arrayBuffer));
  const loaderOptions = options.mvt;
  const features = [];

  const selectedLayers = Array.isArray(loaderOptions.layers)
    ? loaderOptions.layers
    : Object.keys(tile.layers);

  selectedLayers.forEach(layerName => {
    const vectorTileLayer = tile.layers[layerName];
    const featureOptions = {...loaderOptions, layerName};

    if (!vectorTileLayer) {
      return;
    }

    for (let i = 0; i < vectorTileLayer.length; i++) {
      const vectorTileFeature = vectorTileLayer.feature(i);

      const decodedFeature = getDecodedFeature(vectorTileFeature, featureOptions);
      features.push(decodedFeature);
    }
  });

  if (options.mvt._format === 'binary') {
    const data = geojsonToBinary(features);
    // TODO decide where to store this
    // @ts-ignore
    data.byteLength = arrayBuffer.byteLength;
    return data;
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

  const decodedFeature =
    wgs84Coordinates && hasTileIndex
      ? feature.toGeoJSON(options.tileIndex.x, options.tileIndex.y, options.tileIndex.z)
      : transformCoordinates(feature, transformToLocalCoordinates);

  // Add layer name to GeoJSON properties
  if (options.layerProperty) {
    decodedFeature.properties[options.layerProperty] = options.layerName;
  }

  return decodedFeature;
}
