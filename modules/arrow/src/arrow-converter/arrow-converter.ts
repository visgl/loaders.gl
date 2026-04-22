// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Converter} from '@loaders.gl/schema-utils';
import {convertArrow, isApacheArrowTable} from './convert-arrow';

const convertArrowUnchecked = convertArrow as (
  input: unknown,
  targetShape:
    | 'arrow'
    | 'object-row-table'
    | 'array-row-table'
    | 'columnar-table'
    | 'arrow-table'
    | 'geojson-table',
  options?: unknown
) => unknown;

/**
 * Options shared by conversions from Apache Arrow tables to loaders.gl table shapes.
 */
export type ArrowConvertToOptions = {
  batchSize?: number;
};

/**
 * Options shared by conversions from loaders.gl tables to Apache Arrow tables.
 */
export type ArrowConvertFromOptions = {
  batchSize?: number;
};

/**
 * Leaf converter for Apache Arrow table interop.
 */
export const ArrowConverter: Converter<
  | 'arrow'
  | 'object-row-table'
  | 'array-row-table'
  | 'columnar-table'
  | 'arrow-table'
  | 'geojson-table',
  ArrowConvertFromOptions | ArrowConvertToOptions
> = {
  id: 'arrow',
  from: [
    'arrow',
    'object-row-table',
    'array-row-table',
    'columnar-table',
    'arrow-table',
    'geojson-table'
  ],
  to: [
    'arrow',
    'object-row-table',
    'array-row-table',
    'columnar-table',
    'arrow-table',
    'geojson-table'
  ],
  canConvert(sourceShape, targetShape) {
    const sourceIsArrow = sourceShape === 'arrow';
    const targetIsArrow = targetShape === 'arrow';
    return sourceIsArrow !== targetIsArrow;
  },
  detectInputShape(input) {
    return isApacheArrowTable(input as any) ? 'arrow' : null;
  },
  convert(input, targetShape, options) {
    switch (targetShape) {
      case 'arrow':
        return convertArrowUnchecked(input, 'arrow', options);
      case 'object-row-table':
        return convertArrowUnchecked(input, 'object-row-table', options);
      case 'array-row-table':
        return convertArrowUnchecked(input, 'array-row-table', options);
      case 'columnar-table':
        return convertArrowUnchecked(input, 'columnar-table', options);
      case 'arrow-table':
        return convertArrowUnchecked(input, 'arrow-table', options);
      case 'geojson-table':
        return convertArrowUnchecked(input, 'geojson-table', options);
      default:
        throw new Error(`Unsupported Arrow conversion target: ${targetShape}`);
    }
  }
} as const;

/**
 * Opt-in converter bundle for Apache Arrow conversions.
 */
export const ARROW_CONVERTERS = [ArrowConverter] as const;

export {convertArrow};
