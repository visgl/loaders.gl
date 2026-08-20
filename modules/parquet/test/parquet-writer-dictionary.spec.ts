// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetJSLoader, ParquetJSWriter, ParquetLoader, ParquetReader} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {parquetReadObjects} from 'hyparquet';
import {compressors} from 'hyparquet-compressors';
import {expect, test} from 'vitest';

const INPUT: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: [
      {name: 'sequence', type: 'int32', nullable: false},
      {name: 'label', type: 'utf8', nullable: false},
      {name: 'token', type: {type: 'fixed-size-binary', byteWidth: 3}, nullable: false}
    ],
    metadata: {}
  },
  data: Array.from({length: 10}, (_, index) => ({
    sequence: index,
    label: index % 2 ? 'alpha' : 'beta',
    token: new Uint8Array(index % 2 ? [1, 2, 3] : [4, 5, 6])
  }))
};

test.each([false, true])(
  'ParquetJSWriter emits chunk dictionaries and multiple Data Page V2=%s pages',
  async useDataPageV2 => {
    const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {
        pageSize: 3,
        useDataPageV2,
        dictionary: 'auto',
        columnDictionaries: {sequence: false, token: true}
      }
    });
    const output = await load(parquetBuffer, ParquetJSLoader, {core: {worker: false}});
    expect(output).toMatchObject({shape: 'object-row-table', data: INPUT.data});

    const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
    const [sequence, label, token] = metadata.row_groups[0].columns.map(column => column.meta_data!);
    expect(sequence.encodings).not.toContain(8);
    for (const column of [label, token]) {
      expect(column.encodings).toEqual(expect.arrayContaining([0, 8]));
      expect(Number(column.dictionary_page_offset)).toBeLessThan(Number(column.data_page_offset));
      expect(column.encoding_stats).toEqual([
        expect.objectContaining({page_type: 2, encoding: 0, count: 1}),
        expect.objectContaining({
          page_type: useDataPageV2 ? 3 : 0,
          encoding: 8,
          count: 4
        })
      ]);
    }
  }
);

test('ParquetJSWriter falls back when a forced dictionary exceeds its size limit', async () => {
  const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
    worker: false,
    parquet: {dictionary: true, dictionaryPageSizeLimit: 1}
  });
  const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
  expect(metadata.row_groups[0].columns.every(column => !column.meta_data?.encodings.includes(8))).toBe(
    true
  );
});

test('ParquetJSWriter rejects unknown dictionary column overrides', async () => {
  await expect(
    encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {columnDictionaries: {typo: true}}
    })
  ).rejects.toThrow('Unknown column dictionary override "typo"');
});

test('ParquetJSWriter multi-page dictionaries interoperate with maintained browser readers', async () => {
  const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
    worker: false,
    parquet: {
      pageSize: 3,
      useDataPageV2: true,
      dictionary: true,
      columnDictionaries: {sequence: false}
    }
  });
  const [typescriptTable, wasmTable, hyparquetRows] = await Promise.all([
    load(parquetBuffer, ParquetJSLoader, {core: {worker: false}}),
    load(parquetBuffer, ParquetLoader, {core: {worker: false}}),
    parquetReadObjects({file: parquetBuffer, compressors})
  ]);
  const expectedRows = INPUT.data.map(({sequence, label}) => ({sequence, label}));
  expect(selectScalarColumns(typescriptTable.data)).toEqual(expectedRows);
  expect(selectScalarColumns(wasmTable.data)).toEqual(expectedRows);
  expect(selectScalarColumns(hyparquetRows)).toEqual(expectedRows);
});

/** Selects scalar columns whose representation is identical across maintained readers. */
function selectScalarColumns(rows: unknown[]): Array<{sequence: number; label: string}> {
  return rows.map(row => {
    const objectRow = row as {sequence: number; label: string};
    return {sequence: objectRow.sequence, label: objectRow.label};
  });
}
