// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BinaryFeatureCollection, Feature, FlatFeature} from '@loaders.gl/schema';
import type {GeojsonGeometryInfo} from '../../geometry-api/geometry-info';
import {
  convertFlatGeojsonToBinaryFeatureCollection,
  type FlatGeojsonToBinaryOptions
} from '../convert-flat-geojson-to-binary-features';
import {
  convertGeojsonToBinaryFeatureCollection,
  type GeojsonToBinaryOptions
} from '../convert-geojson-to-binary-features';
import {
  convertGeojsonToFlatGeojson,
  type GeojsonToFlatGeojsonOptions
} from '../convert-geojson-to-flat-geojson';
import {convertBinaryFeatureCollectionToGeojson} from '../convert-binary-features-to-geojson';
import type {
  BinaryToGeojsonFeatureOptions,
  BinaryToGeojsonOptions,
  FeatureCollectionShape
} from './feature-collection-converter';

/**
 * Converts between feature collection representations.
 */
export function convertFeatureCollection(
  data: Feature[],
  shape: 'flat-geojson',
  options?: GeojsonToFlatGeojsonOptions
): FlatFeature[];
export function convertFeatureCollection(
  data: Feature[],
  shape: 'binary-feature-collection',
  options?: GeojsonToBinaryOptions
): BinaryFeatureCollection;
export function convertFeatureCollection(
  data: FlatFeature[],
  shape: 'binary-feature-collection',
  options?: FlatGeojsonToBinaryOptions
): BinaryFeatureCollection;
export function convertFeatureCollection(
  data: BinaryFeatureCollection,
  shape: 'geojson',
  options: BinaryToGeojsonFeatureOptions
): Feature;
export function convertFeatureCollection(
  data: BinaryFeatureCollection,
  shape: 'geojson',
  options?: BinaryToGeojsonOptions
): Feature[];
export function convertFeatureCollection(
  data: Feature[] | FlatFeature[] | BinaryFeatureCollection,
  shape: FeatureCollectionShape,
  options?:
    | GeojsonToFlatGeojsonOptions
    | GeojsonToBinaryOptions
    | FlatGeojsonToBinaryOptions
    | BinaryToGeojsonOptions
    | BinaryToGeojsonFeatureOptions
): FlatFeature[] | BinaryFeatureCollection | Feature[] | Feature {
  const featureArray = Array.isArray(data) ? (data as Feature[] | FlatFeature[]) : null;

  switch (shape) {
    case 'flat-geojson':
      if (!featureArray || !isGeojsonFeatureCollection(featureArray)) {
        throw new Error(
          'FeatureCollectionConverter.convert expected GeoJSON features for to="flat-geojson"'
        );
      }
      return convertGeojsonToFlatGeojson(
        featureArray,
        options as GeojsonToFlatGeojsonOptions | undefined
      );

    case 'binary-feature-collection':
      if (featureArray && isFlatFeatureCollection(featureArray)) {
        return convertFlatGeojsonToBinaryFeatureCollection(
          featureArray,
          getGeometryInfoFromFlatFeatures(featureArray),
          options as FlatGeojsonToBinaryOptions | undefined
        );
      }
      if (featureArray && isGeojsonFeatureCollection(featureArray)) {
        return convertGeojsonToBinaryFeatureCollection(
          featureArray,
          options as GeojsonToBinaryOptions | undefined
        );
      }
      throw new Error(
        'FeatureCollectionConverter.convert expected GeoJSON or Flat GeoJSON input for to="binary-feature-collection"'
      );

    case 'geojson':
      if (!isBinaryFeatureCollection(data)) {
        throw new Error(
          'FeatureCollectionConverter.convert expected a binary feature collection for to="geojson"'
        );
      }
      return convertBinaryFeatureCollectionToGeojson(
        data,
        options as BinaryToGeojsonOptions | BinaryToGeojsonFeatureOptions | undefined
      ) as Feature[] | Feature;

    default:
      throw new Error(`Unsupported feature collection conversion target: ${shape}`);
  }
}

/**
 * Checks whether an input is a binary feature collection.
 */
export function isBinaryFeatureCollection(
  data: Feature[] | FlatFeature[] | BinaryFeatureCollection
): data is BinaryFeatureCollection {
  return typeof data === 'object' && data !== null && !Array.isArray(data) && 'shape' in data;
}

/**
 * Checks whether an input is a flat GeoJSON feature array.
 */
export function isFlatFeatureCollection(data: Feature[] | FlatFeature[]): data is FlatFeature[] {
  const firstFeature = data[0];
  return Boolean(
    firstFeature &&
      typeof firstFeature === 'object' &&
      firstFeature.geometry &&
      typeof firstFeature.geometry === 'object' &&
      'data' in firstFeature.geometry
  );
}

/**
 * Checks whether an input is a GeoJSON feature array.
 */
export function isGeojsonFeatureCollection(data: Feature[] | FlatFeature[]): data is Feature[] {
  return !isFlatFeatureCollection(data);
}

function getGeometryInfoFromFlatFeatures(flatFeatures: FlatFeature[]): GeojsonGeometryInfo {
  const geometryInfo: GeojsonGeometryInfo = {
    coordLength: getCoordLength(flatFeatures),
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

  for (const feature of flatFeatures) {
    switch (feature.geometry.type) {
      case 'Point':
        geometryInfo.pointFeaturesCount += 1;
        geometryInfo.pointPositionsCount += feature.geometry.indices.length;
        break;
      case 'LineString':
        geometryInfo.lineFeaturesCount += 1;
        geometryInfo.linePathsCount += feature.geometry.indices.length;
        geometryInfo.linePositionsCount += feature.geometry.data.length / geometryInfo.coordLength;
        break;
      case 'Polygon':
        geometryInfo.polygonFeaturesCount += 1;
        geometryInfo.polygonObjectsCount += feature.geometry.indices.length;
        geometryInfo.polygonRingsCount += feature.geometry.indices.reduce(
          (ringCount, polygon) => ringCount + polygon.length,
          0
        );
        geometryInfo.polygonPositionsCount +=
          feature.geometry.data.length / geometryInfo.coordLength;
        break;
      default:
        throw new Error(`Unsupported flat geometry type`);
    }
  }

  return geometryInfo;
}

function getCoordLength(flatFeatures: FlatFeature[]): number {
  for (const feature of flatFeatures) {
    if (feature.geometry.data.length > 0) {
      switch (feature.geometry.type) {
        case 'Point':
          return feature.geometry.data.length / Math.max(feature.geometry.indices.length, 1);
        case 'LineString': {
          const vertexCount = feature.geometry.indices.length > 0 ? feature.geometry.indices[0] : 0;
          return vertexCount > 0 ? feature.geometry.data.length / vertexCount : 2;
        }
        case 'Polygon': {
          const firstRingVertexCount = feature.geometry.indices[0]?.[0] || 0;
          return firstRingVertexCount > 0 ? feature.geometry.data.length / firstRingVertexCount : 2;
        }
        default:
          break;
      }
    }
  }
  return 2;
}
