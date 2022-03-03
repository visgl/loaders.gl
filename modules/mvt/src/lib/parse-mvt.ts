import {flatGeojsonToBinary} from '@loaders.gl/gis';
import type {FlatFeature} from '@loaders.gl/schema';
import Protobuf from 'pbf';

import type { MVTLoaderOptions } from '../mvt-loader';
import type {MVTMapboxCoordinates, MVTOptions} from '../lib/types';

import VectorTile from './mapbox-vector-tile/vector-tile';
import BinaryVectorTile from './binary-vector-tile/vector-tile';
import VectorTileFeatureBinary from './binary-vector-tile/vector-tile-feature';
import VectorTileFeatureMapBox from './mapbox-vector-tile/vector-tile-feature';

/**
 * Parse MVT arrayBuffer and return GeoJSON.
 *
 * @param arrayBuffer A MVT arrayBuffer
 * @param options
 * @returns A GeoJSON geometry object or a binary representation
 */
export default function parseMVT(arrayBuffer: ArrayBuffer, options?: MVTLoaderOptions) {
  options = normalizeOptions(options);

  let shape = options?.mvt?.shape;

  function geojson = parseToGeojson()

  switch (shape) {
    case 'columnar-table': // binary + some JS arrays
      return {shape: 'columnar-table', data: parseToBinary()};
    case 'geojson-table':
      return {shape: 'geojson-table', data: parseToGeojson()};
    case 'geojson':
      return parseToGeojson();
    case 'binary-geometry':
      return parseToBinary();
    default:
      throw new Error(shape)
  }
}

function parseToGeojson(arrayBuffer: ArrayBuffer, options: MVTLoaderOptions, binary: boolean = false) {
  const features: (FlatFeature | MVTMapboxCoordinates)[] = [];

  const geometryInfo = {
    coordLength: 2,
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

    selectedLayers.forEach((layerName: string) => {
      const vectorTileLayer = tile.layers[layerName];
      const featureOptions = {...loaderOptions, layerName};

      if (!vectorTileLayer) {
        return;
      }

      for (let i = 0; i < vectorTileLayer.length; i++) {
        const vectorTileFeature = vectorTileLayer.feature(i, geometryInfo);

        const decodedFeature = binary
          ? getDecodedFeatureBinary(vectorTileFeature as VectorTileFeatureBinary, featureOptions)
          : getDecodedFeature(vectorTileFeature as VectorTileFeatureMapBox, featureOptions);
        features.push(decodedFeature);
      }
    });
  }

  return features;
}

function parseToBinary(arrayBuffer: ArrayBuffer, options: MVTLoaderOptions) {
  const features = parseToGeojson(arrayBuffer, options, true)  as FlatFeature[];

const data = flatGeojsonToBinary(features, geometryInfo);
    // Add the original byteLength (as a reasonable approximation of the size of the binary data)
    // TODO decide where to store extra fields like byteLength (header etc) and document
    // @ts-ignore
    data.byteLength = arrayBuffer.byteLength;
    return data;
  }
}

/**
 * @param options
 * @returns options
 */
function normalizeOptions(options?: MVTLoaderOptions): MVTLoaderOptions {
  options = {
    ...options,
    mvt: options?.mvt || {},
    gis: options?.gis || {}
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
    throw new Error(
      'MVT Loader: WGS84 coordinates need tileIndex property. Check documentation.'
    );
  }

  return options;
}

/**
 * @param feature
 * @param options
 * @returns decoded feature
 */
function getDecodedFeature(
  feature: VectorTileFeatureMapBox,
  options: MVTOptions
): MVTMapboxCoordinates {
  const decodedFeature = feature.toGeoJSON(
    options.coordinates === 'wgs84' ? options.tileIndex : transformToLocalCoordinates
  );

  // Add layer name to GeoJSON properties
  if (options.layerProperty) {
    decodedFeature.properties[options.layerProperty] = options.layerName;
  }

  return decodedFeature;
}

/**
 * @param feature
 * @param options
 * @returns decoded binary feature
 */
function getDecodedFeatureBinary(
  feature: VectorTileFeatureBinary,
  options: MVTOptions
): FlatFeature {
  const decodedFeature = feature.toBinaryCoordinates(
    options.coordinates === 'wgs84' ? options.tileIndex : transformToLocalCoordinatesBinary
  );

  // Add layer name to GeoJSON properties
  if (options.layerProperty && decodedFeature.properties) {
    decodedFeature.properties[options.layerProperty] = options.layerName;
  }

  return decodedFeature;
}

/**
 * @param line
 * @param feature
 */
function transformToLocalCoordinates(line: number[], feature: {extent: any}): void {
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

function transformToLocalCoordinatesBinary(data: number[], feature: {extent: any}) {
  // For the binary code path, the feature data is just
  // one big flat array, so we just divide each value
  const {extent} = feature;
  for (let i = 0, il = data.length; i < il; ++i) {
    data[i] /= extent;
  }
}
