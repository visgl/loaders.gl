// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {CSVLoader, AvroLoader, AvroSchemaLoader, BSONLoader, ExcelLoader} from '@loaders.gl/tables';
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv';
import {AvroLoaderWithParser} from '@loaders.gl/tables/avro';
import {AvroSchemaLoaderWithParser} from '@loaders.gl/tables/avro-schema';
import {CSVLoader as LegacyCSVLoader} from '@loaders.gl/csv';
import {AvroLoader as LegacyAvroLoader} from '@loaders.gl/avro';
import {BSONLoaderWithParser} from '@loaders.gl/tables/bson';
import {BSONLoader as LegacyBSONLoader} from '@loaders.gl/bson';
import {ExcelLoaderWithParser} from '@loaders.gl/tables/excel';
import {ExcelLoader as LegacyExcelLoader} from '@loaders.gl/excel';

test.each([
  [ExcelLoader, ExcelLoaderWithParser],
  [BSONLoader, BSONLoaderWithParser],
  [CSVLoader, CSVLoaderWithParser],
  [AvroLoader, AvroLoaderWithParser],
  [AvroSchemaLoader, AvroSchemaLoaderWithParser]
])('table metadata preloads the implementation for $0.id', async (metadata, implementation) => {
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
