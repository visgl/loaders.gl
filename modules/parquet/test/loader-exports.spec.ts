// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as parquet from '@loaders.gl/parquet';
import {ParquetJSLoaderWithParser} from '@loaders.gl/parquet/parquet-js-loader';

test('Parquet root exposes the primary metadata loader', () => {
  expect(parquet.ParquetLoader.id).toBe('parquet');
  expect(parquet.ParquetLoader).not.toHaveProperty('parse');
  expect(parquet.ParquetLoader.preload).toBeTypeOf('function');
  expect(parquet.GeoParquetLoader).toBeDefined();
  expect(parquet.ParquetJSWriter).toBeDefined();
});

test('TypeScript Parquet backend is available through its parser subpath only', () => {
  expect(parquet).not.toHaveProperty('ParquetJSLoader');
  expect(parquet).not.toHaveProperty('ParquetJSLoaderWithParser');
  expect(ParquetJSLoaderWithParser.parse).toBeTypeOf('function');
  expect(ParquetJSLoaderWithParser.id).toBe('parquet-js');
});
