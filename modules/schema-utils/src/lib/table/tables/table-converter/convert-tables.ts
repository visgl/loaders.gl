// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Table,
  ArrayRowTable,
  ObjectRowTable,
  ColumnarTable,
  ArrowTable
} from '@loaders.gl/schema';
import type {TableShape} from './table-converter';
import {convertTable} from '../convert-table';

/**
 * Converts between loaders.gl table wrapper shapes.
 */
export function convertTables(table: Table, shape: 'object-row-table'): ObjectRowTable;
export function convertTables(table: Table, shape: 'array-row-table'): ArrayRowTable;
export function convertTables(table: Table, shape: 'columnar-table'): ColumnarTable;
export function convertTables(table: Table, shape: 'arrow-table'): ArrowTable;
export function convertTables(table: Table, shape: TableShape): Table {
  switch (shape) {
    case 'object-row-table':
      return convertTable(table, 'object-row-table');
    case 'array-row-table':
      return convertTable(table, 'array-row-table');
    case 'columnar-table':
      return convertTable(table, 'columnar-table');
    case 'arrow-table':
      return convertTable(table, 'arrow-table');
    default:
      throw new Error(`Unsupported table conversion target: ${shape}`);
  }
}
