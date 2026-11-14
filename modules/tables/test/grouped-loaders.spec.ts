// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSource, load, parse, parseSync} from '@loaders.gl/core';
import {CSVLoader, AvroLoader, AvroSchemaLoader} from '@loaders.gl/tables';
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv-loader';
import {AvroLoaderWithParser} from '@loaders.gl/tables/avro-loader';
import {AvroSchemaLoaderWithParser} from '@loaders.gl/tables/avro-schema';
import {CSVLoader as FormatCSVLoader} from '@loaders.gl/tables/csv';
import {AvroLoader as FormatAvroLoader} from '@loaders.gl/tables/avro';

import {ArrowLoader} from '@loaders.gl/tables';
import {ArrowLoaderWithParser} from '@loaders.gl/tables/arrow-loader';
import {ArrowLoader as FormatArrowLoader} from '@loaders.gl/tables/arrow';

import {JSONLoader} from '@loaders.gl/tables';
import {JSONLoaderWithParser} from '@loaders.gl/tables/json-loader';
import {JSONLoader as FormatJSONLoader} from '@loaders.gl/tables/json';

import {LanceLoader} from '@loaders.gl/tables';
import {LanceLoaderWithParser} from '@loaders.gl/tables/lance-loader';
import {LanceLoader as FormatLanceLoader} from '@loaders.gl/tables/lance';

import {ORCLoader} from '@loaders.gl/tables';
import {ORCLoaderWithParser} from '@loaders.gl/tables/orc-loader';
import {ORCLoader as FormatORCLoader} from '@loaders.gl/tables/orc';

import {ParquetLoader} from '@loaders.gl/tables';
import {ParquetLoaderWithParser} from '@loaders.gl/tables/parquet-loader';
import {ParquetLoader as FormatParquetLoader} from '@loaders.gl/tables/parquet';

import {GeoArrowLoader} from '@loaders.gl/tables';
import {GeoArrowLoaderWithParser} from '@loaders.gl/tables/geoarrow-loader';

import {JSONTableLoader} from '@loaders.gl/tables';
import {JSONTableLoaderWithParser} from '@loaders.gl/tables/json-table-loader';

import {NDJSONLoader} from '@loaders.gl/tables';
import {NDJSONLoaderWithParser} from '@loaders.gl/tables/ndjson-loader';

import {GeoJSONLoader} from '@loaders.gl/tables';
import {GeoJSONLoaderWithParser} from '@loaders.gl/tables/geojson-loader';

import {NDGeoJSONLoader} from '@loaders.gl/tables';
import {NDGeoJSONLoaderWithParser} from '@loaders.gl/tables/ndgeojson-loader';

import {GeoParquetLoader} from '@loaders.gl/tables';
import {GeoParquetLoaderWithParser} from '@loaders.gl/tables/geoparquet-loader';

test.each(
  [
    [GeoParquetLoader, GeoParquetLoaderWithParser],
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

test('format table roots share their implementation owner', () => {
  expect(FormatCSVLoader).toBe(CSVLoader);
  expect(FormatAvroLoader).toBe(AvroLoader);
});

test('core parses CSV from group metadata and a synchronous parser subpath', async () => {
  const data = new TextEncoder().encode('name,value\na,1\n').buffer;
  const options = {worker: false, csv: {shape: 'object-row-table' as const}};
  const asynchronous = await parse(data, CSVLoader, options);
  const synchronous = parseSync(data, CSVLoaderWithParser, options);
  expect(asynchronous).toMatchObject({shape: 'object-row-table', data: [{name: 'a', value: 1}]});
  expect(synchronous).toEqual(asynchronous);
});

test('format arrow metadata shares its grouped owner', () => {
  expect(FormatArrowLoader).toBe(ArrowLoader);
});

test('format json metadata shares its grouped owner', () => {
  expect(FormatJSONLoader).toBe(JSONLoader);
});

test('format lance metadata shares its grouped owner', () => {
  expect(FormatLanceLoader).toBe(LanceLoader);
});

test('format orc metadata shares its grouped owner', () => {
  expect(FormatORCLoader).toBe(ORCLoader);
});

test('format parquet metadata shares its grouped owner', () => {
  expect(FormatParquetLoader).toBe(ParquetLoader);
});

test('grouped JSON metadata supports synchronous and asynchronous entrypoints', async () => {
  const input = new TextEncoder().encode('{"value":7}').buffer;
  expect(await parse(input, JSONLoader, {worker: false})).toEqual({value: 7});
  expect(parseSync(input, JSONLoaderWithParser)).toEqual({value: 7});
});

test('format GeoJSON metadata keeps transport hooks outside grouped metadata', async () => {
  const {GeoJSONLoader: format} = await import('@loaders.gl/tables/json');
  expect(format).toMatchObject(GeoJSONLoader);
  expect(format.serializeWorkerResult).toBe(GeoJSONLoaderWithParser.serializeWorkerResult);
  expect(format.deserializeWorkerResult).toBe(GeoJSONLoaderWithParser.deserializeWorkerResult);
  expect(GeoJSONLoader).not.toHaveProperty('serializeWorkerResult');
});

test('core asynchronously constructs grouped Lance and ORC sources from metadata', async () => {
  const {LanceSource} = await import('@loaders.gl/tables/lance-source-loader');
  const {ORCSource} = await import('@loaders.gl/tables/orc-source-loader');
  expect(await createDataSource(new Blob(), LanceLoader)).toBeInstanceOf(LanceSource);
  expect(await createDataSource(new Blob(), ORCLoader)).toBeInstanceOf(ORCSource);
});

test.each([
  ArrowLoader,
  LanceLoader,
  ORCLoader
])('$name exposes a source factory through its parser implementation', async loader => {
  const implementation = await loader.preload();
  expect(implementation.createDataSourceSync).toBeTypeOf('function');
  expect(implementation.parse).toBeTypeOf('function');
});
