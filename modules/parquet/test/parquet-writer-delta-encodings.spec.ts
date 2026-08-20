// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {encode, load} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetJSLoader, ParquetJSWriter, ParquetReader} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

const INPUT: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: [
      {name: 'sequence', type: 'int32', nullable: false},
      {name: 'counter', type: 'int64', nullable: false},
      {name: 'label', type: 'utf8', nullable: false},
      {name: 'payload', type: 'binary', nullable: false},
      {name: 'token', type: {type: 'fixed-size-binary', byteWidth: 3}, nullable: false}
    ],
    metadata: {}
  },
  data: Array.from({length: 9}, (_, index) => ({
    sequence: index * 10,
    counter: 9_007_199_254_740_993n + BigInt(index * 2),
    label: `shared-prefix-${index}`,
    payload: new Uint8Array(index + 1).fill(index),
    token: new Uint8Array([1, 2, index])
  }))
};

test.each([false, true])(
  'ParquetJSWriter emits stable delta encodings with Data Page V2=%s',
  async useDataPageV2 => {
    const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {
        pageSize: 4,
        useDataPageV2,
        dictionary: false,
        columnEncodings: {
          sequence: 'DELTA_BINARY_PACKED',
          counter: 'DELTA_BINARY_PACKED',
          label: 'DELTA_BYTE_ARRAY',
          payload: 'DELTA_LENGTH_BYTE_ARRAY',
          token: 'DELTA_BYTE_ARRAY'
        }
      }
    });
    const output = await load(parquetBuffer, ParquetJSLoader, {core: {worker: false}});
    expect(output).toMatchObject({shape: 'object-row-table', data: INPUT.data});

    const metadata = await new ParquetReader(new BlobFile(parquetBuffer)).getFileMetadata();
    expect(metadata.row_groups[0].columns.map(column => column.meta_data?.encodings)).toEqual([
      expect.arrayContaining([5]),
      expect.arrayContaining([5]),
      expect.arrayContaining([7]),
      expect.arrayContaining([6]),
      expect.arrayContaining([7])
    ]);
  }
);

test('ParquetJSWriter rejects delta encodings on unsupported columns', async () => {
  await expect(
    encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {columnEncodings: {label: 'DELTA_BINARY_PACKED'}}
    })
  ).rejects.toThrow('DELTA_BINARY_PACKED does not support BYTE_ARRAY');
});
