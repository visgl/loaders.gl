// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Converter} from '../../../converters/converters';
import type {Table} from '@loaders.gl/schema';
import {convertTables} from './convert-tables';

/**
 * Shapes supported by the loaders.gl table converter.
 */
export type TableShape = 'object-row-table' | 'array-row-table' | 'columnar-table' | 'arrow-table';

/**
 * Leaf converter for loaders.gl table wrapper shapes.
 */
export const TableConverter: Converter<TableShape> = {
  id: 'table',
  from: ['object-row-table', 'array-row-table', 'columnar-table', 'arrow-table'],
  to: ['object-row-table', 'array-row-table', 'columnar-table', 'arrow-table'],
  canConvert(sourceShape, targetShape) {
    return sourceShape !== targetShape;
  },
  detectInputShape(input) {
    if (
      typeof input === 'object' &&
      input !== null &&
      'shape' in input &&
      typeof input.shape === 'string' &&
      ['object-row-table', 'array-row-table', 'columnar-table', 'arrow-table'].includes(input.shape)
    ) {
      return input.shape as TableShape;
    }
    return null;
  },
  convert(input, targetShape) {
    switch (targetShape) {
      case 'object-row-table':
        return convertTables(input as Table, 'object-row-table');
      case 'array-row-table':
        return convertTables(input as Table, 'array-row-table');
      case 'columnar-table':
        return convertTables(input as Table, 'columnar-table');
      case 'arrow-table':
        return convertTables(input as Table, 'arrow-table');
      default:
        throw new Error(`Unsupported table conversion target: ${targetShape}`);
    }
  }
} as const;

/**
 * Opt-in converter bundle for table shape conversions.
 */
export const TABLE_CONVERTERS = [TableConverter] as const;

export {convertTables};
