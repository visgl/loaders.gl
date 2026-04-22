// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  BinaryFeatureCollection,
  BinaryGeometryType,
  Feature,
  FlatFeature
} from '@loaders.gl/schema';
import type {Converter} from '@loaders.gl/schema-utils';
import type {FlatGeojsonToBinaryOptions} from '../convert-flat-geojson-to-binary-features';
import type {GeojsonToBinaryOptions} from '../convert-geojson-to-binary-features';
import type {GeojsonToFlatGeojsonOptions} from '../convert-geojson-to-flat-geojson';
import {
  convertFeatureCollection,
  isBinaryFeatureCollection,
  isFlatFeatureCollection
} from './convert-feature-collection';

/**
 * Shapes supported by the feature collection converter.
 */
export type FeatureCollectionShape = 'geojson' | 'flat-geojson' | 'binary-feature-collection';

/**
 * Options for converting a binary feature collection to GeoJSON features.
 */
export type BinaryToGeojsonOptions = {
  type?: BinaryGeometryType;
};

/**
 * Options for extracting a single GeoJSON feature from a binary feature collection.
 */
export type BinaryToGeojsonFeatureOptions = BinaryToGeojsonOptions & {
  globalFeatureId: number;
};

/**
 * Leaf converter for feature collection representations.
 */
export const FeatureCollectionConverter: Converter<
  FeatureCollectionShape,
  | GeojsonToFlatGeojsonOptions
  | GeojsonToBinaryOptions
  | FlatGeojsonToBinaryOptions
  | BinaryToGeojsonOptions
  | BinaryToGeojsonFeatureOptions
> = {
  id: 'feature-collection',
  from: ['geojson', 'flat-geojson', 'binary-feature-collection'],
  to: ['geojson', 'flat-geojson', 'binary-feature-collection'],
  canConvert(sourceShape, targetShape) {
    if (sourceShape === targetShape) {
      return false;
    }
    if (sourceShape === 'geojson') {
      return targetShape === 'flat-geojson' || targetShape === 'binary-feature-collection';
    }
    if (sourceShape === 'flat-geojson') {
      return targetShape === 'binary-feature-collection';
    }
    return targetShape === 'geojson';
  },
  detectInputShape(input) {
    if (isBinaryFeatureCollection(input as Feature[] | FlatFeature[] | BinaryFeatureCollection)) {
      return 'binary-feature-collection';
    }
    if (Array.isArray(input)) {
      return isFlatFeatureCollection(input as Feature[] | FlatFeature[])
        ? 'flat-geojson'
        : 'geojson';
    }
    return null;
  },
  convert(input, targetShape, options) {
    switch (targetShape) {
      case 'flat-geojson':
        return convertFeatureCollection(input as any, 'flat-geojson', options as any);
      case 'binary-feature-collection':
        return convertFeatureCollection(input as any, 'binary-feature-collection', options as any);
      case 'geojson':
        return convertFeatureCollection(input as any, 'geojson', options as any);
      default:
        throw new Error(`Unsupported feature collection conversion target: ${targetShape}`);
    }
  }
} as const;

/**
 * Opt-in converter bundle for feature collection conversions.
 */
export const FEATURE_COLLECTION_CONVERTERS = [FeatureCollectionConverter] as const;

export {convertFeatureCollection};
