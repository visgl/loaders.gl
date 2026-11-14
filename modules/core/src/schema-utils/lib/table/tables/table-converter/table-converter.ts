// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Converter} from '../../../converters/converters';
import type {Table} from '@loaders.gl/core/schema';
import type * as arrow from 'apache-arrow';
import {isNativeArrowTable} from '../../../../../lib/loader-utils/native-arrow';
import {convertTables} from './convert-tables';

/**
 * Shapes supported by the loaders.gl table converter.
 */
export type TableShape = 'object-row-table' | 'array-row-table' | 'columnar-table' | 'arrow';

/**
 * Leaf converter for loaders.gl table wrapper shapes.
 */
export const TableConverter: Converter<TableShape> = {
  id: 'table',
  from: ['object-row-table', 'array-row-table', 'columnar-table', 'arrow'],
  to: ['object-row-table', 'array-row-table', 'columnar-table', 'arrow'],
  canConvert(sourceShape, targetShape) {
    return sourceShape !== targetShape;
  },
  detectInputShape(input) {
    if (isNativeArrowTable(input)) return 'arrow';
    if (
      typeof input === 'object' &&
      input !== null &&
      'shape' in input &&
      typeof input.shape === 'string' &&
      ['object-row-table', 'array-row-table', 'columnar-table'].includes(input.shape)
    ) {
      return input.shape as TableShape;
    }
    return null;
  },
  convert(input, targetShape) {
    switch (targetShape) {
      case 'object-row-table':
        return convertTables(input as Table | arrow.Table, 'object-row-table');
      case 'array-row-table':
        return convertTables(input as Table | arrow.Table, 'array-row-table');
      case 'columnar-table':
        return convertTables(input as Table | arrow.Table, 'columnar-table');
      case 'arrow':
        return convertTables(input as Table | arrow.Table, 'arrow');
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
