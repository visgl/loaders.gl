// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, Table, TableBatch} from '@loaders.gl/core/schema';
import {convertArrowToTable} from './convert-arrow-table';

/** Table layouts supported by the Arrow wrapper adapters. */
type ArrowTableShape = Exclude<Table['shape'], 'geojson-table' | 'arrow-table'>;

/** A converted layout retaining the input wrapper's additional properties. */
type ConvertedArrowTable<Input, Shape extends ArrowTableShape> = Omit<
  Input,
  'shape' | 'data' | 'schema'
> &
  Extract<Table, {shape: Shape}>;

/**
 * Converts an Arrow wrapper while preserving its schema and additional metadata.
 * Infers a schema when the wrapper omits it. Use the native Arrow table directly for Arrow output.
 * @param table Arrow table wrapper.
 * @param shape Requested table layout.
 * @returns Converted table with the input wrapper's metadata.
 */
export function convertArrowTable<Input extends ArrowTable, Shape extends ArrowTableShape>(
  table: Input,
  shape: Shape
): ConvertedArrowTable<Input, Shape>;
export function convertArrowTable(table: ArrowTable, shape: ArrowTableShape): Table {
  const converted = convertArrowToTable(table.data, shape);
  return {
    ...table,
    ...converted,
    schema: table.schema ?? converted.schema
  };
}

/**
 * Converts an Arrow batch while retaining length, batch type, progress and metadata.
 * Does not combine or buffer batches.
 * @param batch Arrow table batch.
 * @param shape Requested table layout.
 * @returns Converted batch with the input batch's metadata.
 */
export function convertArrowTableBatch<
  Input extends ArrowTableBatch,
  Shape extends ArrowTableShape
>(
  batch: Input,
  shape: Shape
): ConvertedArrowTable<Input, Shape> & Extract<TableBatch, {shape: Shape}> {
  return convertArrowTable(batch, shape) as ConvertedArrowTable<Input, Shape> &
    Extract<TableBatch, {shape: Shape}>;
}
