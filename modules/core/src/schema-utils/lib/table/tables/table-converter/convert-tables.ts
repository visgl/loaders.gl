// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, ArrayRowTable, ObjectRowTable, ColumnarTable} from '@loaders.gl/core/schema';
import type * as arrow from 'apache-arrow';
import type {TableShape} from './table-converter';
import {convertTable} from '../convert-table';

/**
 * Converts between loaders.gl table wrapper shapes.
 */
export function convertTables(
  table: Table | arrow.Table,
  shape: 'object-row-table'
): ObjectRowTable;
export function convertTables(table: Table | arrow.Table, shape: 'array-row-table'): ArrayRowTable;
export function convertTables(table: Table | arrow.Table, shape: 'columnar-table'): ColumnarTable;
export function convertTables(table: Table | arrow.Table, shape: 'arrow'): arrow.Table;
export function convertTables(table: Table | arrow.Table, shape: TableShape): Table | arrow.Table {
  switch (shape) {
    case 'object-row-table':
      return convertTable(table, 'object-row-table');
    case 'array-row-table':
      return convertTable(table, 'array-row-table');
    case 'columnar-table':
      return convertTable(table, 'columnar-table');
    case 'arrow':
      return convertTable(table, 'arrow');
    default:
      throw new Error(`Unsupported table conversion target: ${shape}`);
  }
}
