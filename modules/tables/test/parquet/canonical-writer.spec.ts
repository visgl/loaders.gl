// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {encode, parse} from '@loaders.gl/core';
import {encodeWKBGeometryValue} from '@loaders.gl/core/arrow-geometry/geometry-field';
import {convertTableToArrow} from '@loaders.gl/core/schema-utils';
import type {ObjectRowTable} from '@loaders.gl/core/schema';
import {ParquetLoader} from '@loaders.gl/tables/parquet';
import {ParquetWriter} from '@loaders.gl/tables/parquet/bundled';
import {ParquetWasmWriter} from '../../../../website/src/alternate-loaders/parquet/parquet-wasm-writer';
import {
  ParquetWasmLoaderWithParser,
  decodeParquetWasmFixture
} from '../../../../website/src/alternate-loaders/parquet/parquet-wasm-loader';

test.each([
  'rows',
  'arrow'
] as const)('canonical TypeScript writer interoperates with WASM for %s input', async inputShape => {
  const table: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {fields: [{name: 'value', type: 'int32', nullable: true}], metadata: {}},
    data: [{value: 7}, {value: null}, {value: -4}]
  };
  const input = inputShape === 'arrow' ? convertTableToArrow(table) : table;
  const nativeBytes = await encode(input, ParquetWriter);
  const independentTable = await decodeParquetWasmFixture(nativeBytes);
  expect(Array.from(independentTable.getChild('value')!)).toEqual([7, null, -4]);
  const comparisonBytes = await encode(input, ParquetWasmWriter);
  for (const [bytes, loader] of [
    [nativeBytes, ParquetWasmLoaderWithParser],
    [nativeBytes, ParquetLoader],
    [comparisonBytes, ParquetLoader]
  ] as const) {
    const result = await parse(bytes, loader, {
      core: {worker: false},
      parquet: {shape: 'object-row-table'}
    });
    expect(
      result,
      `${bytes === nativeBytes ? 'TypeScript' : 'WASM'} writer to ${loader === ParquetLoader ? 'TypeScript' : 'WASM'} reader`
    ).toMatchObject({shape: 'object-row-table', data: table.data});
  }
});

test('canonical writer synthesizes GeoParquet metadata from native Arrow geometry fields', async () => {
  const geometry = encodeWKBGeometryValue({type: 'Point', coordinates: [1, 2]})!;
  const table = convertTableToArrow({
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          nullable: true,
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            'ARROW:extension:metadata': '{}'
          }
        }
      ],
      metadata: {source: 'canonical-writer-test'}
    },
    data: [{geometry}]
  });
  const bytes = await encode(table, ParquetWriter);
  const result = await parse(bytes, ParquetLoader, {worker: false, parquet: {shape: 'arrow'}});
  expect(result).toHaveProperty('numRows', 1);
  if ('numRows' in result) {
    const metadata = JSON.parse(result.schema.metadata.get('geo')!);
    expect(metadata.primary_column).toBe('geometry');
    expect(metadata.columns.geometry.encoding.toLowerCase()).toBe('wkb');
    expect(result.schema.metadata.get('source')).toBe('canonical-writer-test');
  }
});
