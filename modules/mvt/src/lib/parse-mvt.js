// import {VectorTile} from '@mapbox/vector-tile';
import VectorTile from './mapbox-vector-tile/vector-tile';

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
  options.gis = options.gis || {};

  const features = [];

  if (arrayBuffer.byteLength > 0) {
    const tile = new VectorTile(new Protobuf(arrayBuffer));
    const loaderOptions = options.mvt;

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
  }

  if (options.gis.format === 'binary') {
    const data = geojsonToBinary(features);
    // Add the original byteLength (as a reasonable approximation of the size of the binary data)
    // TODO decide where to store extra fields like byteLength (header etc) and document
    // @ts-ignore
    data.byteLength = arrayBuffer.byteLength;
    return data;
  }

  return features;
}

function getDecodedFeature(feature, options = {}) {
  const wgs84Coordinates = options.coordinates === 'wgs84';
  const hasTileIndex =
    options.tileIndex &&
    Number.isFinite(options.tileIndex.x) &&
    Number.isFinite(options.tileIndex.y) &&
    Number.isFinite(options.tileIndex.z);

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
