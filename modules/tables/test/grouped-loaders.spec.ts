// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createDataSource, load, parse, parseSync} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/tables/csv';
import {AvroLoader, AvroSchemaLoader} from '@loaders.gl/tables/avro';
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv/bundled';
import {AvroLoaderWithParser} from '@loaders.gl/tables/avro/bundled';
import {AvroSchemaLoaderWithParser} from '@loaders.gl/tables/avro/bundled';

import {ArrowLoader} from '@loaders.gl/tables/arrow';
import {ArrowLoaderWithParser} from '@loaders.gl/tables/arrow/bundled';

import {JSONLoader} from '@loaders.gl/tables/json';
import {JSONLoaderWithParser} from '@loaders.gl/tables/json/bundled';

import {LanceLoader} from '@loaders.gl/tables/lance';
import {LanceLoaderWithParser} from '@loaders.gl/tables/lance/bundled';

import {ORCLoader} from '@loaders.gl/tables/orc';
import {ORCLoaderWithParser} from '@loaders.gl/tables/orc/bundled';

import {ParquetLoader} from '@loaders.gl/tables/parquet';
import {ParquetLoaderWithParser} from '@loaders.gl/tables/parquet/bundled';

import {GeoArrowLoader} from '@loaders.gl/tables/arrow';
import {GeoArrowLoaderWithParser} from '@loaders.gl/tables/geoarrow/bundled';

import {JSONTableLoader} from '@loaders.gl/tables/json';
import {JSONTableLoaderWithParser} from '@loaders.gl/tables/json/bundled';

import {NDJSONLoader} from '@loaders.gl/tables/json';
import {NDJSONLoaderWithParser} from '@loaders.gl/tables/json/bundled';

import {GeoJSONLoader} from '@loaders.gl/tables/geojson/bundled';
import {GeoJSONLoaderWithParser} from '@loaders.gl/tables/geojson/bundled';

import {NDGeoJSONLoader} from '@loaders.gl/tables/json';
import {NDGeoJSONLoaderWithParser} from '@loaders.gl/tables/geojson/bundled';

import {GeoParquetLoader} from '@loaders.gl/tables/parquet';
import {GeoParquetLoaderWithParser} from '@loaders.gl/tables/parquet/bundled';

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

test('core parses CSV from group metadata and a synchronous parser subpath', async () => {
  const data = new TextEncoder().encode('name,value\na,1\n').buffer;
  const options = {worker: false, csv: {shape: 'object-row-table' as const}};
  const asynchronous = await parse(data, CSVLoader, options);
  const synchronous = parseSync(data, CSVLoaderWithParser, options);
  expect(asynchronous).toMatchObject({shape: 'object-row-table', data: [{name: 'a', value: 1}]});
  expect(synchronous).toEqual(asynchronous);
});

test('grouped JSON metadata supports synchronous and asynchronous entrypoints', async () => {
  const input = new TextEncoder().encode('{"value":7}').buffer;
  expect(await parse(input, JSONLoader, {core: {worker: false}})).toEqual({value: 7});
  expect(parseSync(input, JSONLoaderWithParser)).toEqual({value: 7});
});

test('GeoJSON metadata exposes the worker transport hooks', () => {
  expect(GeoJSONLoader.serializeWorkerResult).toBe(GeoJSONLoaderWithParser.serializeWorkerResult);
  expect(GeoJSONLoader.deserializeWorkerResult).toBe(
    GeoJSONLoaderWithParser.deserializeWorkerResult
  );
});

test('core asynchronously constructs grouped Lance and ORC sources from metadata', async () => {
  const {LanceSource} = await import('@loaders.gl/tables/lance/bundled');
  const {ORCSource} = await import('@loaders.gl/tables/orc/bundled');
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
