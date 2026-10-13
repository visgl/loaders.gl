// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as parquetModule from '@loaders.gl/parquet';
import {ParquetWasmLoaderWithParser} from '@loaders.gl/parquet/parquet-wasm-loader';
import {ParquetJSLoaderWithParser} from '@loaders.gl/parquet/parquet-js-loader';

test('Parquet root exposes the primary metadata loader', () => {
  expect(parquetModule.ParquetLoader.id).toBe('parquet');
  expect(parquetModule.ParquetLoader).not.toHaveProperty('parse');
  expect(parquetModule.ParquetLoader.preload).toBeTypeOf('function');
  expect(parquetModule.GeoParquetLoader).toBeDefined();
  expect(parquetModule.ParquetJSWriter).toBeDefined();
});

test('TypeScript Parquet backend is available through its parser subpath only', () => {
  expect(parquetModule).not.toHaveProperty('ParquetJSLoader');
  expect(parquetModule).not.toHaveProperty('ParquetJSLoaderWithParser');
  expect(ParquetJSLoaderWithParser.parse).toBeTypeOf('function');
  expect(ParquetJSLoaderWithParser.id).toBe('parquet-js');
});

test('Parquet WASM reader is explicit and never exported from the root', () => {
  expect(parquetModule).not.toHaveProperty('ParquetWasmLoaderWithParser');
  expect(ParquetWasmLoaderWithParser.parse).toBeTypeOf('function');
  expect(ParquetWasmLoaderWithParser.worker).toBe(false);
});
