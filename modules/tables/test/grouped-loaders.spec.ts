// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, parse, parseSync} from '@loaders.gl/core';
import {CSVLoader, AvroLoader, AvroSchemaLoader, BSONLoader, ExcelLoader} from '@loaders.gl/tables';
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv';
import {AvroLoaderWithParser} from '@loaders.gl/tables/avro';
import {AvroSchemaLoaderWithParser} from '@loaders.gl/tables/avro-schema';
import {CSVLoader as LegacyCSVLoader} from '@loaders.gl/tables/csv/index';
import {AvroLoader as LegacyAvroLoader} from '@loaders.gl/tables/avro/index';
import {BSONLoaderWithParser} from '@loaders.gl/tables/bson';
import {BSONLoader as LegacyBSONLoader} from '@loaders.gl/tables/bson/index';
import {ExcelLoaderWithParser} from '@loaders.gl/tables/excel';
import {ExcelLoader as LegacyExcelLoader} from '@loaders.gl/tables/excel/index';

import {ArrowLoader} from '@loaders.gl/tables';
import {ArrowLoaderWithParser} from '@loaders.gl/tables/arrow';
import {ArrowLoader as LegacyArrowLoader} from '@loaders.gl/tables/arrow/index';

import {JSONLoader} from '@loaders.gl/tables';
import {JSONLoaderWithParser} from '@loaders.gl/tables/json';
import {JSONLoader as LegacyJSONLoader} from '@loaders.gl/tables/json/index';

import {LanceLoader} from '@loaders.gl/tables';
import {LanceLoaderWithParser} from '@loaders.gl/tables/lance';
import {LanceLoader as LegacyLanceLoader} from '@loaders.gl/tables/lance/index';

import {ORCLoader} from '@loaders.gl/tables';
import {ORCLoaderWithParser} from '@loaders.gl/tables/orc';
import {ORCLoader as LegacyORCLoader} from '@loaders.gl/tables/orc/index';

import {ParquetLoader} from '@loaders.gl/tables';
import {ParquetLoaderWithParser} from '@loaders.gl/tables/parquet';
import {ParquetLoader as LegacyParquetLoader} from '@loaders.gl/tables/parquet/index';

import {GeoArrowLoader} from '@loaders.gl/tables';
import {GeoArrowLoaderWithParser} from '@loaders.gl/tables/arrow';

import {JSONTableLoader} from '@loaders.gl/tables';
import {JSONTableLoaderWithParser} from '@loaders.gl/tables/json';

import {NDJSONLoader} from '@loaders.gl/tables';
import {NDJSONLoaderWithParser} from '@loaders.gl/tables/json';

import {GeoJSONLoader} from '@loaders.gl/tables';
import {GeoJSONLoaderWithParser} from '@loaders.gl/tables/json';

import {NDGeoJSONLoader} from '@loaders.gl/tables';
import {NDGeoJSONLoaderWithParser} from '@loaders.gl/tables/json';

import {ParquetJSLoader} from '@loaders.gl/tables';
import {ParquetJSLoaderWithParser} from '@loaders.gl/tables/parquet';

import {GeoParquetLoader} from '@loaders.gl/tables';
import {GeoParquetLoaderWithParser} from '@loaders.gl/tables/parquet';

test.each(
  [
    [GeoParquetLoader, GeoParquetLoaderWithParser],
    [ParquetJSLoader, ParquetJSLoaderWithParser],
    [NDGeoJSONLoader, NDGeoJSONLoaderWithParser],
    [GeoJSONLoader, GeoJSONLoaderWithParser],
    [NDJSONLoader, NDJSONLoaderWithParser],
    [JSONTableLoader, JSONTableLoaderWithParser],
    [GeoArrowLoader, GeoArrowLoaderWithParser],
    [ParquetLoader, ParquetLoaderWithParser],
    [ORCLoader, ORCLoaderWithParser],
    [LanceLoader, LanceLoaderWithParser],
    [JSONLoader, JSONLoaderWithParser],
    [ArrowLoader, ArrowLoaderWithParser],
    [ExcelLoader, ExcelLoaderWithParser],
    [BSONLoader, BSONLoaderWithParser],
    [CSVLoader, CSVLoaderWithParser],
    [AvroLoader, AvroLoaderWithParser],
    [AvroSchemaLoader, AvroSchemaLoaderWithParser]
  ].map(([metadata, implementation]) => ({name: metadata.name, metadata, implementation}))
)('table metadata preloads $name', async ({metadata, implementation}) => {
  expect(metadata).not.toHaveProperty('parse');
  expect(metadata).not.toHaveProperty('parseSync');
  expect(await metadata.preload()).toBe(implementation);
  expect(implementation).not.toHaveProperty('preload');
  expect(implementation.module).toBe('tables');
});

test('legacy table roots share their implementation owner', () => {
  expect(LegacyCSVLoader).toBe(CSVLoader);
  expect(LegacyAvroLoader).toBe(AvroLoader);
});

test('core parses CSV from group metadata and a synchronous parser subpath', async () => {
  const data = new TextEncoder().encode('name,value\na,1\n').buffer;
  const options = {worker: false, csv: {shape: 'object-row-table' as const}};
  const asynchronous = await parse(data, CSVLoader, options);
  const synchronous = parseSync(data, CSVLoaderWithParser, options);
  expect(asynchronous).toMatchObject({shape: 'object-row-table', data: [{name: 'a', value: 1}]});
  expect(synchronous).toEqual(asynchronous);
});

test('legacy bson metadata shares its grouped owner', () => {
  expect(LegacyBSONLoader).toBe(BSONLoader);
});

test('legacy Excel retains transport hooks while grouped metadata stays lightweight', () => {
  expect(LegacyExcelLoader).toMatchObject(ExcelLoader);
  expect(LegacyExcelLoader.serializeWorkerResult).toBe(ExcelLoaderWithParser.serializeWorkerResult);
  expect(LegacyExcelLoader.deserializeWorkerResult).toBe(
    ExcelLoaderWithParser.deserializeWorkerResult
  );
  expect(ExcelLoader).not.toHaveProperty('serializeWorkerResult');
  expect(ExcelLoader).not.toHaveProperty('deserializeWorkerResult');
});

test('grouped BSON supports asynchronous metadata and synchronous parser access', async () => {
  const {BSONWriter} = await import('@loaders.gl/tables');
  const input = {name: 'grouped', value: 1};
  const data = BSONWriter.encodeSync(input);
  expect(await parse(data, BSONLoader)).toEqual(input);
  expect(parseSync(data, BSONLoaderWithParser)).toEqual(input);
});

test('legacy arrow metadata shares its grouped owner', () => {
  expect(LegacyArrowLoader).toBe(ArrowLoader);
});

test('legacy json metadata shares its grouped owner', () => {
  expect(LegacyJSONLoader).toBe(JSONLoader);
});

test('legacy lance metadata shares its grouped owner', () => {
  expect(LegacyLanceLoader).toBe(LanceLoader);
});

test('legacy orc metadata shares its grouped owner', () => {
  expect(LegacyORCLoader).toBe(ORCLoader);
});

test('legacy parquet metadata shares its grouped owner', () => {
  expect(LegacyParquetLoader).toBe(ParquetLoader);
});

test('grouped JSON metadata supports synchronous and asynchronous entrypoints', async () => {
  const input = new TextEncoder().encode('{"value":7}').buffer;
  expect(await parse(input, JSONLoader, {worker: false})).toEqual({value: 7});
  expect(parseSync(input, JSONLoaderWithParser)).toEqual({value: 7});
});

test('grouped Lance source metadata defers synchronous source construction', async () => {
  const {LanceSourceLoader} = await import('@loaders.gl/tables');
  const {LanceSourceLoader: implementation} = await import(
    '@loaders.gl/tables/lance/lance-source-loader'
  );
  expect(() => LanceSourceLoader.createDataSource(new Blob(), {})).toThrow('requires async load()');
  expect(await LanceSourceLoader.preload()).toBe(implementation);
  expect(LanceSourceLoader.options).toEqual(implementation.options);
  expect(LanceSourceLoader.testURL('dataset.lance/')).toBe(true);
  expect(LanceSourceLoader.testURL('dataset.csv')).toBe(false);
});

test('legacy GeoJSON metadata keeps transport hooks outside grouped metadata', async () => {
  const {GeoJSONLoader: legacy} = await import('@loaders.gl/tables/json/index');
  expect(legacy).toMatchObject(GeoJSONLoader);
  expect(legacy.serializeWorkerResult).toBe(GeoJSONLoaderWithParser.serializeWorkerResult);
  expect(legacy.deserializeWorkerResult).toBe(GeoJSONLoaderWithParser.deserializeWorkerResult);
  expect(GeoJSONLoader).not.toHaveProperty('serializeWorkerResult');
});

test('core asynchronously constructs grouped Lance and ORC sources from metadata', async () => {
  const {LanceSourceLoader, ORCSourceLoader} = await import('@loaders.gl/tables');
  const {LanceSource} = await import('@loaders.gl/tables/lance/lance-source-loader');
  const {ORCSource} = await import('@loaders.gl/tables/orc/orc-source-loader');
  expect(await load(new Blob(), LanceSourceLoader)).toBeInstanceOf(LanceSource);
  expect(await load(new Blob(), ORCSourceLoader)).toBeInstanceOf(ORCSource);
  expect(() => ORCSourceLoader.createDataSource(new Blob(), {})).toThrow('requires async load()');
});
