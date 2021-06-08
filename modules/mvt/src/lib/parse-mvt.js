// import {VectorTile} from '@mapbox/vector-tile';
import VectorTile from './mapbox-vector-tile/vector-tile';
import BinaryVectorTile from './binary-vector-tile/vector-tile';

import {featuresToBinary} from './binary-vector-tile/features-to-binary';
import Protobuf from 'pbf';

/*
 * Parse MVT arrayBuffer and return GeoJSON.
 *
 * @param {arrayBuffer} _ A MVT arrayBuffer
 * @return {?Object} A GeoJSON geometry object or a binary representation
 */
export default function parseMVT(arrayBuffer, options) {
  options = normalizeOptions(options);

  const binary = options.gis.format === 'binary';
  const features = [];
  const firstPassData = {
    pointPositionsCount: 0,
    pointFeaturesCount: 0,
    linePositionsCount: 0,
    linePathsCount: 0,
    lineFeaturesCount: 0,
    polygonPositionsCount: 0,
    polygonObjectsCount: 0,
    polygonRingsCount: 0,
    polygonFeaturesCount: 0
  };

  if (arrayBuffer.byteLength > 0) {
    const tile = binary
      ? new BinaryVectorTile(new Protobuf(arrayBuffer))
      : new VectorTile(new Protobuf(arrayBuffer));
    const loaderOptions = options.mvt;

    const selectedLayers = Array.isArray(loaderOptions.layers)
      ? loaderOptions.layers
      : Object.keys(tile.layers);

    selectedLayers.forEach((layerName) => {
      const vectorTileLayer = tile.layers[layerName];
      const featureOptions = {...loaderOptions, layerName};

      if (!vectorTileLayer) {
        return;
      }

      for (let i = 0; i < vectorTileLayer.length; i++) {
        const vectorTileFeature = vectorTileLayer.feature(i, firstPassData);

        const decodedFeature = binary
          ? getDecodedFeatureBinary(vectorTileFeature, featureOptions)
          : getDecodedFeature(vectorTileFeature, featureOptions);
        features.push(decodedFeature);
      }
    });
  }

  if (binary) {
    const data = featuresToBinary(features, firstPassData);
    // Add the original byteLength (as a reasonable approximation of the size of the binary data)
    // TODO decide where to store extra fields like byteLength (header etc) and document
    // @ts-ignore
    data.byteLength = arrayBuffer.byteLength;
    return data;
  }

  return features;
}

function normalizeOptions(options) {
  options = {
    ...options,
    mvt: options.mvt || {},
    gis: options.gis || {}
  };

  // Validate
  const wgs84Coordinates = options.coordinates === 'wgs84';
  const {tileIndex} = options;
  const hasTileIndex =
    tileIndex &&
    Number.isFinite(tileIndex.x) &&
    Number.isFinite(tileIndex.y) &&
    Number.isFinite(tileIndex.z);

  if (wgs84Coordinates && !hasTileIndex) {
    throw new Error('MVT Loader: WGS84 coordinates need tileIndex property. Check documentation.');
  }

  return options;
}

function getDecodedFeature(feature, options = {}) {
  const decodedFeature = feature.toGeoJSON(
    options.coordinates === 'wgs84' ? options.tileIndex : transformToLocalCoordinates
  );

  // Add layer name to GeoJSON properties
  if (options.layerProperty) {
    decodedFeature.properties[options.layerProperty] = options.layerName;
  }

  return decodedFeature;
}

function getDecodedFeatureBinary(feature, options = {}) {
  const decodedFeature = feature.toBinaryCoordinates(
    options.coordinates === 'wgs84' ? options.tileIndex : transformToLocalCoordinatesBinary
  );

  // Add layer name to GeoJSON properties
  if (options.layerProperty) {
    decodedFeature.properties[options.layerProperty] = options.layerName;
  }

  return decodedFeature;
}

function transformToLocalCoordinates(line, feature) {
  // This function transforms local coordinates in a
  // [0 - bufferSize, this.extent + bufferSize] range to a
  // [0 - (bufferSize / this.extent), 1 + (bufferSize / this.extent)] range.
  // The resulting extent would be 1.
  const {extent} = feature;

  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    p[0] /= extent;
    p[1] /= extent;
  }
}

function transformToLocalCoordinatesBinary(data, feature) {
  // For the binary code path, the feature data is just
  // one big flat array, so we just divide each value
  const {extent} = feature;
  for (let i = 0, il = data.length; i < il; ++i) {
    data[i] /= extent;
  }
}
