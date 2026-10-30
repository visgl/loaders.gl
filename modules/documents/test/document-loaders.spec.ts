// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseSync} from '@loaders.gl/core';
import * as documents from '@loaders.gl/documents';
import {BSONLoaderWithParser} from '@loaders.gl/documents/bson-loader';
import {BSONWriter} from '@loaders.gl/documents/bson-writer';
import {BSONObjectId, createBSONValue} from '@loaders.gl/documents/bson-codec';

test.each([
  'XML',
  'HTML',
  'YAML',
  'TOML',
  'BSON',
  'Markdown'
] as const)('%s metadata preloads a matching document parser', async format => {
  const loader = documents[`${format}Loader`];
  expect(loader.module).toBe('documents');
  expect(loader).not.toHaveProperty('parse');
  expect(loader).not.toHaveProperty('parseTextSync');
  const parser = await loader.preload();
  expect(parser.id).toBe(loader.id);
  expect(parser.module).toBe('documents');
  expect(parser.parse).toBeTypeOf('function');
  expect(parser).not.toHaveProperty('preload');
});

test('BSON public loader and writer preserve scalar values through async and sync APIs', async () => {
  const value = {
    id: new BSONObjectId('0123456789abcdef01234567'),
    large: 2n ** 60n,
    timestamp: createBSONValue({$bsonType: 'timestamp', value: 42n})
  };
  const buffer = BSONWriter.encodeSync(value);
  const parsed = parseSync(buffer, BSONLoaderWithParser);
  expect(BSONWriter.encodeSync(parsed)).toEqual(buffer);
  expect(BSONWriter.encodeSync(await parse(buffer, documents.BSONLoader))).toEqual(buffer);
  expect(documents.BSONLoader).toMatchObject(documents.BSONFormat);
});
