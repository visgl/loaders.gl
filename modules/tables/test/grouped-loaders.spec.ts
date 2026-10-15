// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import {CSVLoader, AvroLoader, AvroSchemaLoader} from '@loaders.gl/tables';
import {CSVLoaderWithParser} from '@loaders.gl/tables/csv';
import {AvroLoaderWithParser} from '@loaders.gl/tables/avro';
import {AvroSchemaLoaderWithParser} from '@loaders.gl/tables/avro-schema';
import {CSVLoader as LegacyCSVLoader} from '@loaders.gl/csv';
import {AvroLoader as LegacyAvroLoader} from '@loaders.gl/avro';

test.each([
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
