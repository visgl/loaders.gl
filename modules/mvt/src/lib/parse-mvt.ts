// import {VectorTile} from '@mapbox/vector-tile';
import VectorTile from './mapbox-vector-tile/vector-tile';
import BinaryVectorTile from './binary-vector-tile/vector-tile';

import {flatGeojsonToBinary} from '@loaders.gl/gis';
import Protobuf from 'pbf';
import type {FlatFeature} from '@loaders.gl/schema';
import type {MvtMapboxCoordinates, MvtOptions} from '../lib/types';
import VectorTileFeatureBinary from './binary-vector-tile/vector-tile-feature';
import VectorTileFeatureMapBox from './mapbox-vector-tile/vector-tile-feature';
import {LoaderOptions} from '@loaders.gl/loader-utils';

/**
 * Parse MVT arrayBuffer and return GeoJSON.
 *
 * @param arrayBuffer A MVT arrayBuffer
 * @param options
 * @returns A GeoJSON geometry object or a binary representation
 */
export default function parseMVT(arrayBuffer: ArrayBuffer, options?: LoaderOptions) {
  options = normalizeOptions(options);
  const features: (FlatFeature | MvtMapboxCoordinates)[] = [];

  if (options) {
    const binary = options.gis.format === 'binary';
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

    if (binary) {
      const data = flatGeojsonToBinary(features as FlatFeature[], geometryInfo);
      // Add the original byteLength (as a reasonable approximation of the size of the binary data)
      // TODO decide where to store extra fields like byteLength (header etc) and document
      // @ts-ignore
      data.byteLength = arrayBuffer.byteLength;
      return data;
    }
  }
  return features;
}

/**
 * @param options
 * @returns options
 */
function normalizeOptions(options: LoaderOptions | undefined) {
  if (options) {
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
      throw new Error(
        'MVT Loader: WGS84 coordinates need tileIndex property. Check documentation.'
      );
    }
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
  options: MvtOptions
): MvtMapboxCoordinates {
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
  options: MvtOptions
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
function transformToLocalCoordinates(line: number[], feature: {extent: number}): void {
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

function transformToLocalCoordinatesBinary(data: number[], feature: {extent: number}) {
  // For the binary code path, the feature data is just
  // one big flat array, so we just divide each value
  const {extent} = feature;
  for (let i = 0, il = data.length; i < il; ++i) {
    data[i] /= extent;
  }
}
