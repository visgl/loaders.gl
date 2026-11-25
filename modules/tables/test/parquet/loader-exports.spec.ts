// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as tablesModule from '@loaders.gl/tables';
import {ParquetWriter} from '@loaders.gl/tables/parquet/bundled';
import * as parquetModule from '@loaders.gl/tables/parquet';
import {ParquetWasmLoaderWithParser} from '../../../../website/src/alternate-loaders/parquet/parquet-wasm-loader';
import {ParquetJSLoaderWithParser} from '../../../../website/src/alternate-loaders/parquet/parquet-js-loader';

test('Parquet root exposes the primary metadata loader', () => {
  expect(parquetModule.ParquetLoader.id).toBe('parquet');
  expect(parquetModule.ParquetLoader).not.toHaveProperty('parse');
  expect(parquetModule.ParquetLoader.preload).toBeTypeOf('function');
  expect(parquetModule.GeoParquetLoader).toBeDefined();
  expect(parquetModule).not.toHaveProperty('ParquetWriter');
});

test('Alternate TypeScript reader stays outside the published tables roots', () => {
  expect(tablesModule).not.toHaveProperty('ParquetJSLoader');
  expect(parquetModule).not.toHaveProperty('ParquetJSLoader');
  expect(parquetModule).not.toHaveProperty('ParquetJSLoaderWithParser');
  expect(ParquetJSLoaderWithParser.parse).toBeTypeOf('function');
  expect(ParquetJSLoaderWithParser.id).toBe('parquet-js');
});

test('Alternate WASM reader stays outside the published tables roots', () => {
  expect(parquetModule).not.toHaveProperty('ParquetWasmLoaderWithParser');
  expect(ParquetWasmLoaderWithParser.parse).toBeTypeOf('function');
  expect(ParquetWasmLoaderWithParser.worker).toBe(false);
  expect(ParquetWasmLoaderWithParser.workerInBatches).toBe(false);
});

test('Parquet format exposes one canonical TypeScript writer', () => {
  expect(tablesModule).not.toHaveProperty('ParquetWriter');
  expect(ParquetWriter.id).toBe('parquet');
  expect(ParquetWriter.encode).toBeTypeOf('function');
  expect(parquetModule).not.toHaveProperty('ParquetJSWriter');
  expect(tablesModule).not.toHaveProperty('ParquetJSWriter');
  expect(parquetModule).not.toHaveProperty('ParquetWasmWriter');
});
