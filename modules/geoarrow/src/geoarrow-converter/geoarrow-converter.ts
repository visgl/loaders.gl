// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Converter} from '@loaders.gl/schema-utils';
import type {GeoArrowConvertFromEncoding} from '../convert-table-to-geoarrow';
import {convertGeoArrow, isGeoArrowApacheTable} from './convert-geoarrow';

const convertGeoArrowUnchecked = convertGeoArrow as (
  input: unknown,
  targetShape:
    | 'geoarrow'
    | 'object-row-table'
    | 'array-row-table'
    | 'columnar-table'
    | 'geojson-table'
    | 'arrow-table',
  options?: unknown
) => unknown;

/**
 * Options shared by conversions from GeoArrow Apache Arrow tables to loaders.gl table shapes.
 */
export type GeoArrowConvertToOptions = {
  batchSize?: number;
};

/**
 * Options shared by conversions from loaders.gl tables to GeoArrow Apache Arrow tables.
 */
export type GeoArrowConvertFromOptions = {
  batchSize?: number;
  geoarrow?: {
    encoding?: GeoArrowConvertFromEncoding;
  };
};

/**
 * Leaf converter for GeoArrow Arrow tables and loaders.gl table shapes.
 */
export const GeoArrowTableConverter: Converter<
  | 'geoarrow'
  | 'object-row-table'
  | 'array-row-table'
  | 'columnar-table'
  | 'geojson-table'
  | 'arrow-table',
  GeoArrowConvertFromOptions | GeoArrowConvertToOptions
> = {
  id: 'geoarrow-table',
  from: [
    'geoarrow',
    'object-row-table',
    'array-row-table',
    'columnar-table',
    'geojson-table',
    'arrow-table'
  ],
  to: [
    'geoarrow',
    'object-row-table',
    'array-row-table',
    'columnar-table',
    'geojson-table',
    'arrow-table'
  ],
  canConvert(sourceShape, targetShape) {
    const sourceIsGeoArrow = sourceShape === 'geoarrow';
    const targetIsGeoArrow = targetShape === 'geoarrow';
    return sourceIsGeoArrow !== targetIsGeoArrow;
  },
  detectInputShape(input) {
    return isGeoArrowApacheTable(input as any) ? 'geoarrow' : null;
  },
  convert(input, targetShape, options) {
    switch (targetShape) {
      case 'geoarrow':
        return convertGeoArrowUnchecked(input, 'geoarrow', options);
      case 'object-row-table':
        return convertGeoArrowUnchecked(input, 'object-row-table', options);
      case 'array-row-table':
        return convertGeoArrowUnchecked(input, 'array-row-table', options);
      case 'columnar-table':
        return convertGeoArrowUnchecked(input, 'columnar-table', options);
      case 'geojson-table':
        return convertGeoArrowUnchecked(input, 'geojson-table', options);
      case 'arrow-table':
        return convertGeoArrowUnchecked(input, 'arrow-table', options);
      default:
        throw new Error(`Unsupported GeoArrow conversion target: ${targetShape}`);
    }
  }
} as const;

export const GeoArrowConverter = GeoArrowTableConverter;

/**
 * Opt-in converter bundle for GeoArrow table conversions.
 */
export const GEOARROW_CONVERTERS = [GeoArrowTableConverter] as const;

export {convertGeoArrow};
