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
      {name: 'measurement', type: 'float64', nullable: false},
      {name: 'sample', type: 'int32', nullable: false},
      {name: 'counter', type: 'int64', nullable: false},
      {
        name: 'token',
        type: {type: 'fixed-size-binary', byteWidth: 3},
        nullable: false
      },
      {name: 'label', type: 'utf8', nullable: false}
    ],
    metadata: {}
  },
  data: [
    {
      measurement: 1.25,
      sample: 1,
      counter: 9_007_199_254_740_993n,
      token: new Uint8Array([1, 2, 3]),
      label: 'alpha'
    },
    {
      measurement: -3.5,
      sample: 2,
      counter: -9_007_199_254_740_993n,
      token: new Uint8Array([4, 5, 6]),
      label: 'beta'
    },
    {
      measurement: 1024.125,
      sample: 3,
      counter: 0n,
      token: new Uint8Array([7, 8, 9]),
      label: 'gamma'
    }
  ]
};

test.each([false, true])(
  'ParquetJSWriter and ParquetJSLoader round-trip BYTE_STREAM_SPLIT with Data Page V2=%s',
  async useDataPageV2 => {
    const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {
        useDataPageV2,
        columnEncodings: {
          measurement: 'BYTE_STREAM_SPLIT',
          sample: 'BYTE_STREAM_SPLIT',
          counter: 'BYTE_STREAM_SPLIT',
          token: 'BYTE_STREAM_SPLIT'
        }
      }
    });
    const output = await load(parquetBuffer, ParquetJSLoader, {core: {worker: false}});

    expect(output.shape).toBe('object-row-table');
    if (output.shape === 'object-row-table') {
      expect(output.data).toEqual(INPUT.data);
    }

    const reader = new ParquetReader(new BlobFile(parquetBuffer));
    const metadata = await reader.getFileMetadata();
    expect(metadata.row_groups[0].columns[0].meta_data?.encodings).toContain(9);
    expect(metadata.row_groups[0].columns[1].meta_data?.encodings).toContain(9);
    expect(metadata.row_groups[0].columns[2].meta_data?.encodings).toContain(9);
    expect(metadata.row_groups[0].columns[3].meta_data?.encodings).toContain(9);
    expect(metadata.row_groups[0].columns[4].meta_data?.encodings).not.toContain(9);
  }
);

test('ParquetJSWriter rejects BYTE_STREAM_SPLIT for variable-width columns', async () => {
  await expect(
    encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {columnEncodings: {label: 'BYTE_STREAM_SPLIT'}}
    })
  ).rejects.toThrow('BYTE_STREAM_SPLIT does not support BYTE_ARRAY');
});

test('ParquetJSWriter rejects unknown column encoding overrides', async () => {
  await expect(
    encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {columnEncodings: {typo: 'BYTE_STREAM_SPLIT'}}
    })
  ).rejects.toThrow('Unknown column encoding override "typo"');
});
