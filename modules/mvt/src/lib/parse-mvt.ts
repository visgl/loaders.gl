import {flatGeojsonToBinary} from '@loaders.gl/gis';
import type {
  FlatFeature,
  Feature,
  GeojsonGeometryInfo,
  BinaryFeatures,
  GeoJSONRowTable
} from '@loaders.gl/schema';
import Protobuf from 'pbf';

import type {MVTMapboxCoordinates, MVTOptions, MVTLoaderOptions} from '../lib/types';

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
  const mvtOptions = normalizeOptions(options);

  const shape = options?.gis?.format || options?.mvt?.shape;
  switch (shape) {
    case 'columnar-table': // binary + some JS arrays
      return {shape: 'columnar-table', data: parseToBinary(arrayBuffer, mvtOptions)};
    case 'geojson-row-table': {
      const table: GeoJSONRowTable = {
        shape: 'geojson-row-table',
        data: parseToGeojson(arrayBuffer, mvtOptions)
      };
      return table;
    }
    case 'geojson':
      return parseToGeojson(arrayBuffer, mvtOptions);
    case 'binary-geometry':
      return parseToBinary(arrayBuffer, mvtOptions);
    case 'binary':
      return parseToBinary(arrayBuffer, mvtOptions);
    default:
      throw new Error(shape);
  }
}

function parseToBinary(arrayBuffer: ArrayBuffer, options: MVTOptions): BinaryFeatures {
  const [flatGeoJsonFeatures, geometryInfo] = parseToFlatGeoJson(arrayBuffer, options);

  const binaryData = flatGeojsonToBinary(flatGeoJsonFeatures, geometryInfo);
  // Add the original byteLength (as a reasonable approximation of the size of the binary data)
  // TODO decide where to store extra fields like byteLength (header etc) and document
  // @ts-ignore
  binaryData.byteLength = arrayBuffer.byteLength;
  return binaryData;
}

function parseToFlatGeoJson(
  arrayBuffer: ArrayBuffer,
  options: MVTOptions
): [FlatFeature[], GeojsonGeometryInfo] {
  const features: FlatFeature[] = [];
  const geometryInfo: GeojsonGeometryInfo = {
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

  if (arrayBuffer.byteLength <= 0) {
    return [features, geometryInfo];
  }

  const tile = new BinaryVectorTile(new Protobuf(arrayBuffer));

  const selectedLayers =
    options && Array.isArray(options.layers) ? options.layers : Object.keys(tile.layers);

  selectedLayers.forEach((layerName: string) => {
    const vectorTileLayer = tile.layers[layerName];
    if (!vectorTileLayer) {
      return;
    }

    for (let i = 0; i < vectorTileLayer.length; i++) {
      const vectorTileFeature = vectorTileLayer.feature(i, geometryInfo);
      const decodedFeature = getDecodedFeatureBinary(vectorTileFeature, options, layerName);
      features.push(decodedFeature);
    }
  });

  return [features, geometryInfo];
}

function parseToGeojson(arrayBuffer: ArrayBuffer, options: MVTOptions): Feature[] {
  if (arrayBuffer.byteLength <= 0) {
    return [];
  }

  const features: MVTMapboxCoordinates[] = [];
  const tile = new VectorTile(new Protobuf(arrayBuffer));

  const selectedLayers = Array.isArray(options.layers) ? options.layers : Object.keys(tile.layers);

  selectedLayers.forEach((layerName: string) => {
    const vectorTileLayer = tile.layers[layerName];
    if (!vectorTileLayer) {
      return;
    }

    for (let i = 0; i < vectorTileLayer.length; i++) {
      const vectorTileFeature = vectorTileLayer.feature(i);
      const decodedFeature = getDecodedFeature(vectorTileFeature, options, layerName);
      features.push(decodedFeature);
    }
  });

  return features as Feature[];
}

function normalizeOptions(options?: MVTLoaderOptions): MVTOptions {
  if (!options?.mvt) {
    throw new Error('mvt options required');
  }

  // Validate
  const wgs84Coordinates = options.mvt?.coordinates === 'wgs84';
  const {tileIndex} = options.mvt;
  const hasTileIndex =
    tileIndex &&
    Number.isFinite(tileIndex.x) &&
    Number.isFinite(tileIndex.y) &&
    Number.isFinite(tileIndex.z);

  if (wgs84Coordinates && !hasTileIndex) {
    throw new Error('MVT Loader: WGS84 coordinates need tileIndex property');
  }

  return options.mvt;
}

/**
 * @param feature
 * @param options
 * @returns decoded feature
 */
function getDecodedFeature(
  feature: VectorTileFeatureMapBox,
  options: MVTOptions,
  layerName: string
): MVTMapboxCoordinates {
  const decodedFeature = feature.toGeoJSON(
    options.coordinates === 'wgs84' ? options.tileIndex : transformToLocalCoordinates
  );

  // Add layer name to GeoJSON properties
  if (options.layerProperty) {
    decodedFeature.properties[options.layerProperty] = layerName;
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
  options: MVTOptions,
  layerName: string
): FlatFeature {
  const decodedFeature = feature.toBinaryCoordinates(
    options.coordinates === 'wgs84' ? options.tileIndex : transformToLocalCoordinatesBinary
  );

  // Add layer name to GeoJSON properties
  if (options.layerProperty && decodedFeature.properties) {
    decodedFeature.properties[options.layerProperty] = layerName;
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
