// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {RecordBatch, Table} from 'apache-arrow';
import {load, loadInBatches, parse, parseFile, parseInBatches, parseSync} from '@loaders.gl/core';
import type {ReadableFile} from '@loaders.gl/core/loader-utils';
import {
  ArrowLoader,
  CSVLoader,
  JSONTableLoader,
  ParquetLoader,
  type ArrowLoaderOptions
} from '@loaders.gl/tables';
import {ArrowLoaderWithParser} from '@loaders.gl/tables/arrow-loader';

const bytes = new ArrayBuffer(0);
declare const file: ReadableFile;
const table: Promise<Table> = parse(bytes, ArrowLoader, {arrow: {shape: 'arrow'}});
const csv: Promise<Table> = load('data.csv', CSVLoader, {csv: {shape: 'arrow'}});
const json: Promise<Table> = parse(bytes, JSONTableLoader, {json: {shape: 'arrow'}});
const shared: Promise<Table> = parse(bytes, [ArrowLoader, CSVLoader], {core: {shape: 'arrow'}});
const sync: Table = parseSync(bytes, ArrowLoaderWithParser, {core: {shape: 'arrow'}});
const randomAccess: Promise<Table> = parseFile(file, ParquetLoader, {parquet: {shape: 'arrow'}});
const batches: Promise<AsyncIterable<RecordBatch>> = parseInBatches([bytes], ArrowLoader, {
  arrow: {shape: 'arrow'}
});
const candidateBatches: Promise<AsyncIterable<RecordBatch>> = parseInBatches(
  [bytes],
  [ArrowLoader, CSVLoader],
  {core: {shape: 'arrow'}}
);
const loadedBatches: Promise<AsyncIterable<RecordBatch>> = loadInBatches(
  'data.arrow',
  ArrowLoader,
  {core: {shape: 'arrow'}}
);
// Existing wrapped results remain wrapped, including loader-scoped overrides.
parse(bytes, ArrowLoader).then(result => result.numRows);
parse(bytes, CSVLoader, {core: {worker: false}}).then(result => result.numRows);
parse<typeof ArrowLoader>(bytes, ArrowLoader, {arrow: {shape: 'arrow-table'}});
parse(bytes, ArrowLoader, {core: {shape: 'arrow'}, arrow: {shape: 'arrow-table'}}).then(
  result => result.shape
);
void [table, csv, json, shared, sync, randomAccess, batches, candidateBatches, loadedBatches];

// Optional options must not promise a native result when the shape can be omitted.
declare const dynamicOptions: ArrowLoaderOptions;
const dynamic = parse(bytes, ArrowLoader, dynamicOptions);
// @ts-expect-error A dynamic shape can still select a loaders.gl wrapper.
const nativeOnly: Promise<Table> = dynamic;
void nativeOnly;

// @ts-expect-error A loader-scoped shape must be a shape supported by ArrowLoader.
parse(bytes, ArrowLoader, {arrow: {shape: 'invalid-shape'}});
// @ts-expect-error The common shape is validated against ArrowLoader's shapes.
parse(bytes, ArrowLoader, {core: {shape: 'invalid-shape'}});
// @ts-expect-error Arrow parser settings retain their declared types.
parse(bytes, ArrowLoader, {arrow: {shape: 'arrow', batchDebounceMs: 'slow'}});
