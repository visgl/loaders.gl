// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createDataSource, encode, load} from '@loaders.gl/core';
import {ParquetJSLoader, ParquetJSWriter} from '@loaders.gl/parquet';
import {ParquetSource} from '@loaders.gl/parquet/parquet-source-loader';
import {ParquetSourceLoader as ParquetSourceLoaderWithParser} from '@loaders.gl/parquet/parquet-source-loader';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {expect, test} from 'vitest';

const INPUT: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: [
      {name: 'id', type: 'int32', nullable: false},
      {name: 'label', type: 'utf8', nullable: false}
    ],
    metadata: {}
  },
  data: [
    {id: 1, label: 'one'},
    {id: 2, label: 'two'},
    {id: 3, label: 'three'}
  ]
};

const KEY = new TextEncoder().encode('0123456789abcdef');
const KEY_METADATA = new TextEncoder().encode('writer-footer-key');
const FILE_UNIQUE = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

test.each(['AES_GCM_V1', 'AES_GCM_CTR_V1'] as const)(
  'ParquetJSWriter emits a decryptable encrypted footer with %s',
  async algorithm => {
    const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {
        encryption: {
          algorithm,
          fileUnique: FILE_UNIQUE,
          keyMetadata: KEY_METADATA,
          keyRetriever: () => KEY
        }
      }
    });
    const output = await load(parquetBuffer, ParquetJSLoader, {
      core: {worker: false},
      parquet: {
        keyRetriever: keyMetadata => {
          expect(keyMetadata).toEqual(KEY_METADATA);
          return KEY;
        }
      }
    });

    expect(new TextDecoder().decode(new Uint8Array(parquetBuffer).slice(0, 4))).toBe('PARE');
    expect(output).toMatchObject({shape: 'object-row-table', data: INPUT.data});
    expect(new TextDecoder().decode(new Uint8Array(parquetBuffer).slice(-4))).toBe('PARE');
  }
);

test.each(['AES_GCM_V1', 'AES_GCM_CTR_V1'] as const)(
  'ParquetJSWriter encrypts column pages, Bloom filters, and page indexes with %s',
  async algorithm => {
    const parquetBuffer = await encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {
        pageSize: 1,
        pageIndex: true,
        bloomFilter: true,
        encryption: {
          algorithm,
          fileUnique: FILE_UNIQUE,
          keyMetadata: KEY_METADATA,
          encryptColumns: true,
          keyRetriever: () => KEY
        }
      }
    });
    const output = await load(parquetBuffer, ParquetJSLoader, {
      core: {worker: false},
      parquet: {keyRetriever: () => KEY}
    });

    expect(output).toMatchObject({shape: 'object-row-table', data: INPUT.data});

    const source = (await createDataSource(new Blob([parquetBuffer]), [ParquetSourceLoaderWithParser], {
      core: {type: 'parquet', worker: false},
      parquet: {keyRetriever: () => KEY}
    })) as ParquetSource;
    const plan = await source.getScanPlan({
      columns: ['label'],
      predicate: {op: '=', args: [{property: 'id'}, 2]}
    });
    expect(plan.pages.indexesRead).toBeGreaterThan(0);
    expect(plan.pages.plans[0]?.selectedPages).toBe(1);
    const batches = [];
    for await (const batch of source.read({
      columns: ['label'],
      predicate: {op: '=', args: [{property: 'id'}, 2]}
    })) {
      batches.push(batch);
    }
    expect(batches.flatMap(batch => batch.data.getChild('label')?.toArray() || [])).toEqual(['two']);
    await source.close();
  }
);
