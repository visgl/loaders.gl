// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {encode} from '@loaders.gl/core';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetJSWriter} from '@loaders.gl/parquet';
import type {ObjectRowTable} from '@loaders.gl/schema';
import {ParquetSource} from '../src/parquet-source-loader';
import type {ParquetSourceBatch, ParquetSourceExplain} from '../src/parquet-source-types';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';
import {PARQUET_CODECS} from '../src/parquetjs/codecs';
import {FileMetaData, KeyValue, SizeStatistics, Statistics} from '../src/parquetjs/parquet-thrift';
import {decodeFileMetadata, serializeThrift} from '../src/parquetjs/utils/read-utils';
import {concatUint8Arrays} from '../src/parquetjs/utils/binary-utils';
import {CompactInt64} from '../src/parquetjs/utils/uint8-array-compact-protocol';

const KEY = new Uint8Array(16).fill(7);
const FILE_UNIQUE = Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8);
const INPUT: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: [
      {name: 'id', type: 'int32', nullable: false},
      {name: 'label', type: 'utf8', nullable: false},
      {
        name: 'amount',
        type: {type: 'decimal', precision: 5, scale: 2, bitWidth: 128},
        nullable: true
      },
      {name: 'geometry', type: 'binary', nullable: true},
      {name: 'longitude', type: 'float32', nullable: false},
      {name: 'latitude', type: 'float64', nullable: false},
      {name: 'active', type: 'bool', nullable: false},
      {name: 'unsigned32', type: 'uint32', nullable: false},
      {name: 'unsigned64', type: 'uint64', nullable: false}
    ],
    metadata: {suite: 'deep-source'}
  },
  data: [
    {
      id: 0,
      label: 'zero',
      amount: 1.25,
      geometry: null,
      longitude: -3.5,
      latitude: 4.5,
      active: false,
      unsigned32: 0,
      unsigned64: 0n
    },
    {
      id: 1,
      label: 'one',
      amount: null,
      geometry: Uint8Array.of(1, 2, 3),
      longitude: 2.5,
      latitude: -5.5,
      active: true,
      unsigned32: 4294967295,
      unsigned64: 18446744073709551615n
    },
    {
      id: 2,
      label: 'two',
      amount: 2.5,
      geometry: Uint8Array.of(4),
      longitude: 3.5,
      latitude: 6.5,
      active: false,
      unsigned32: 2,
      unsigned64: 2n
    },
    {
      id: 3,
      label: 'two',
      amount: -3.75,
      geometry: new Uint8Array(),
      longitude: 0.5,
      latitude: 0.5,
      active: true,
      unsigned32: 3,
      unsigned64: 3n
    }
  ]
};

let plainFixture: ArrayBuffer;
let encryptedFixture: ArrayBuffer;
let signedFixture: ArrayBuffer;

beforeAll(async () => {
  plainFixture = await encode(INPUT, ParquetJSWriter, {
    worker: false,
    parquet: {
      rowGroupSize: 2,
      pageSize: 1,
      dictionary: false,
      writeStatistics: true,
      writeSizeStatistics: true
    }
  });
  encryptedFixture = await encode(INPUT, ParquetJSWriter, {
    worker: false,
    parquet: {
      pageSize: 1,
      useDataPageV2: true,
      dictionary: true,
      pageIndex: true,
      bloomFilter: {label: true, amount: true},
      encryption: {
        algorithm: 'AES_GCM_CTR_V1',
        fileUnique: FILE_UNIQUE,
        keyMetadata: Uint8Array.of(9),
        encryptColumns: true,
        columnKeyMetadata: {label: Uint8Array.of(10)},
        keyRetriever: () => KEY
      }
    }
  });
  signedFixture = await encode(INPUT, ParquetJSWriter, {
    worker: false,
    parquet: {
      footerSignature: {
        fileUnique: FILE_UNIQUE,
        keyMetadata: Uint8Array.of(11),
        keyRetriever: () => KEY
      }
    }
  });
});

test('source metadata classifies spatial roles and preserves numeric, binary and optional statistics', async () => {
  const source = new ParquetSource(new File([plainFixture], 'tiny.PARQUET'), {
    core: {worker: false}
  });
  try {
    const query = await source.getQueryMetadata();
    expect(query.name).toBe('tiny');
    expect(
      query.columns
        .filter((column) => column.role !== 'attribute')
        .map((column) => [column.name, column.role])
    ).toEqual([
      ['geometry', 'geometry'],
      ['longitude', 'longitude'],
      ['latitude', 'latitude']
    ]);
    expect(query.statistics?.rowCount).toBe(4);
    const metadata = await source.getMetadata();
    const columns = Object.fromEntries(
      metadata.rowGroups[0].columns.map((column) => [column.path[0], column])
    );
    expect(columns.longitude.statistics).toMatchObject({min: -3.5, max: 2.5, nullCount: 0});
    expect(columns.latitude.statistics).toMatchObject({min: -5.5, max: 4.5});
    expect(columns.active.statistics).toMatchObject({min: false, max: true});
    expect(columns.amount.statistics).toMatchObject({min: 1.25, max: 1.25, nullCount: 1});
    expect(columns.geometry.statistics).toMatchObject({
      min: Uint8Array.of(1, 2, 3),
      max: Uint8Array.of(1, 2, 3),
      nullCount: 1
    });
    expect(columns.geometry.sizeStatistics).toMatchObject({
      unencodedByteArrayDataBytes: 3,
      definitionLevelHistogram: [1, 1]
    });
    expect(Object.isFrozen(columns.geometry.statistics)).toBe(true);
  } finally {
    await source.close();
  }
});

test('source accepts legacy bounds and unsigned physical statistics, omitting unusable optional statistics', async () => {
  const buffer = rewriteFooter(plainFixture, (metadata) => {
    const columns = metadata.row_groups[0].columns;
    const findColumn = (name: string) =>
      columns.find((column) => column.meta_data!.path_in_schema[0] === name)!.meta_data!;
    findColumn('unsigned32').statistics = new Statistics({
      min: PARQUET_CODECS.PLAIN.encodeValues('INT32', [0], {}),
      max: Uint8Array.of(255, 255, 255, 255),
      distinct_count: 2
    });
    findColumn('unsigned64').statistics = new Statistics({
      min_value: new Uint8Array(8),
      max_value: new Uint8Array(8).fill(255)
    });
    findColumn('longitude').statistics = new Statistics({
      min_value: Uint8Array.of(1),
      max_value: Uint8Array.of(1),
      null_count: 0
    });
    findColumn('longitude').size_statistics = new SizeStatistics({});
    findColumn('latitude').statistics = new Statistics({});
    metadata.key_value_metadata!.push(new KeyValue({key: 'without-value'}));
  });
  const source = new ParquetSource(new Blob([buffer]), {core: {worker: false}});
  try {
    const metadata = await source.getMetadata();
    const columns = Object.fromEntries(
      metadata.rowGroups[0].columns.map((column) => [column.path[0], column])
    );
    expect(columns.unsigned32.statistics).toMatchObject({
      min: 0,
      max: 4294967295,
      distinctCount: 2
    });
    expect(columns.unsigned64.statistics).toMatchObject({min: 0n, max: 18446744073709551615n});
    expect(columns.longitude.statistics).toMatchObject({min: undefined, max: undefined});
    expect(columns.longitude.sizeStatistics).toBeUndefined();
    expect(columns.latitude.statistics).toBeUndefined();
    expect(metadata.keyValueMetadata).not.toHaveProperty('without-value');
  } finally {
    await source.close();
  }
});

test('executing a scan plan retains projection, exact filtering, limits and source provenance', async () => {
  const source = new ParquetSource(new Blob([plainFixture]), {core: {worker: false}});
  try {
    const plan = await source.getScanPlan({
      columns: ['label'],
      predicate: {op: '>=', args: [{property: 'id'}, 1]},
      limit: 2
    });
    const batches = await collectBatches(source.executeScanPlan(plan));
    expect(batches.flatMap((batch) => Array.from(batch.data.getChild('label')!))).toEqual([
      'one',
      'two'
    ]);
    expect(batches.reduce((sum, batch) => sum + batch.length, 0)).toBe(2);
    expect(batches.map((batch) => batch.data.schema.fields.map((field) => field.name))).toEqual([
      ['label'],
      ['label']
    ]);
    const override = await collectBatches(
      source.executeScanPlan(plan, {columns: ['id'], limit: 1})
    );
    expect(Array.from(override[0].data.getChild('id')!)).toEqual([1]);
    await expect(
      collectBatches(
        source.executeScanPlan({...plan, source: 'other'} as unknown as ParquetSourceExplain)
      )
    ).rejects.toThrow('only execute Parquet scan plans');
  } finally {
    await source.close();
  }
});

test('encrypted dictionary pages, indexes and Bloom filters preserve exact selective reads', async () => {
  const source = new ParquetSource(new Blob([encryptedFixture]), {
    core: {worker: false},
    parquet: {keyRetriever: () => KEY}
  });
  try {
    const plan = await source.getScanPlan({
      columns: ['label'],
      predicate: {op: '=', args: [{property: 'label'}, 'two']}
    });
    expect(plan.bloomFilters.read).toBe(1);
    expect(plan.pages.selected).toBeGreaterThan(0);
    expect(plan.pages.selected).toBeLessThan(plan.pages.total);
    const batches = await collectBatches(source.executeScanPlan(plan));
    expect(batches.flatMap((batch) => Array.from(batch.data.getChild('label')!))).toEqual([
      'two',
      'two'
    ]);
    const missing = await source.getScanPlan({
      columns: ['label'],
      predicate: {op: '=', args: [{property: 'label'}, 'absent']}
    });
    expect(missing.rowGroups.prunedByBloomFilter).toBe(1);
    expect(missing.rowGroups.indices).toEqual([]);
    const decimal = await collectBatches(
      source.read({columns: ['id'], predicate: {op: '=', args: [{property: 'amount'}, 2.5]}})
    );
    expect(decimal.flatMap((batch) => Array.from(batch.data.getChild('id')!))).toEqual([2]);
    const pages = [];
    for await (const batch of source.readPages({
      columns: ['id'],
      predicate: {op: '=', args: [{property: 'label'}, 'two']}
    }))
      pages.push(batch);
    expect(pages).toHaveLength(1);
    expect(pages[0].projectedColumns).toEqual(['id']);
    expect(pages[0].filterColumns).toEqual(['label']);
    expect(pages[0].columns.map((column) => column.path[0])).toEqual(['id', 'label']);
    expect(pages[0].columns.find((column) => column.path[0] === 'label')!.dictionary).toBeDefined();
    expect(pages[0].residualFilter?.predicate).toEqual({
      op: '=',
      args: [{property: 'label'}, 'two']
    });
  } finally {
    await source.close();
  }
});

test('signed footers demand keys and encryption rejects conflicting file identifiers', async () => {
  const reader = new ParquetReader(new BlobFile(signedFixture));
  await expect(reader.getFileMetadata()).rejects.toThrow(
    'Signed Parquet footer requires parquet.keyRetriever'
  );
  reader.close();
  await expect(
    encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {
        encryption: {fileUnique: FILE_UNIQUE, keyRetriever: () => KEY},
        footerSignature: {
          fileUnique: new Uint8Array(8),
          keyMetadata: Uint8Array.of(1),
          keyRetriever: () => KEY
        }
      }
    })
  ).rejects.toThrow('file_unique values must match');
  await expect(
    encode(INPUT, ParquetJSWriter, {
      worker: false,
      parquet: {
        encryption: {fileUnique: new Uint8Array(7), keyRetriever: () => KEY}
      }
    })
  ).rejects.toThrow('file_unique must be 8 bytes');
});

test.each([
  {batchSize: 0},
  {batchSize: 1.5},
  {concurrency: 0},
  {concurrency: 1.5},
  {rowGroups: [0, 0]}
])('source rejects invalid read boundaries %j', async (options) => {
  const source = new ParquetSource(new Blob([plainFixture]), {core: {worker: false}});
  try {
    await expect(collectBatches(source.read(options))).rejects.toThrow(
      /Invalid Parquet|Duplicate Parquet/
    );
  } finally {
    await source.close();
  }
});

test('source close cancels a suspended iterator and preserves the caller abort reason', async () => {
  const source = new ParquetSource(new Blob([plainFixture]), {core: {worker: false}});
  const iterator = source.scan({columns: ['id'], batchSize: 1})[Symbol.asyncIterator]();
  expect((await iterator.next()).value?.length).toBe(1);
  await source.close();
  await expect(iterator.next()).rejects.toMatchObject({name: 'AbortError'});
  const otherSource = new ParquetSource(new Blob([plainFixture]), {core: {worker: false}});
  const reason = new Error('caller cancelled');
  try {
    await otherSource.getSchema();
    await expect(
      collectBatches(otherSource.read({signal: AbortSignal.abort(reason)}))
    ).rejects.toBe(reason);
  } finally {
    await otherSource.close();
  }
});

test('worker reads stop at a partial batch limit and retain absolute source row provenance', async () => {
  const source = new ParquetSource(new Blob([plainFixture]), {core: {worker: true}});
  try {
    const batches = await collectBatches(
      source.read({columns: ['id'], rowGroups: [1, 0], concurrency: 2, limit: 1})
    );
    expect(batches).toHaveLength(1);
    expect(Array.from(batches[0].data.getChild('id')!)).toEqual([2]);
    expect(batches[0]).toMatchObject({
      length: 1,
      rowCount: 1,
      rowGroupIndex: 1,
      rowOffset: 2,
      rowGroupRowOffset: 0
    });
    expect(source.getTelemetry().rowsEmitted).toBe(1);
  } finally {
    await source.close();
  }
});

test('physical scan ranges reject external chunks and unsafe offsets before reading column data', async () => {
  for (const change of [
    (metadata: FileMetaData) => {
      metadata.row_groups[0].columns[0].file_path = 'external.parquet';
    },
    (metadata: FileMetaData) => {
      metadata.row_groups[0].columns[0].meta_data!.data_page_offset = new CompactInt64(-1);
    }
  ]) {
    const source = new ParquetSource(new Blob([rewriteFooter(plainFixture, change)]), {
      core: {worker: true}
    });
    try {
      await expect(collectBatches(source.scan({columns: ['id']}))).rejects.toThrow(
        /external column chunk|non-negative safe integers/
      );
    } finally {
      await source.close();
    }
  }
});

/** Collects only this tiny in-memory source's batches, keeping async failures awaited. */
async function collectBatches(
  iterable: AsyncIterable<ParquetSourceBatch>
): Promise<ParquetSourceBatch[]> {
  const batches: ParquetSourceBatch[] = [];
  for await (const batch of iterable) batches.push(batch);
  return batches;
}

/** Copies a real encoded footer to exercise optional external-writer metadata representations. */
function rewriteFooter(buffer: ArrayBuffer, change: (metadata: FileMetaData) => void): ArrayBuffer {
  const bytes = new Uint8Array(buffer);
  const footerLength = new DataView(buffer).getUint32(buffer.byteLength - 8, true);
  const footerOffset = buffer.byteLength - 8 - footerLength;
  const metadata = decodeFileMetadata(bytes.subarray(footerOffset, buffer.byteLength - 8)).metadata;
  change(metadata);
  const footer = serializeThrift(metadata);
  const trailer = new Uint8Array(8);
  new DataView(trailer.buffer).setUint32(0, footer.byteLength, true);
  trailer.set(new TextEncoder().encode('PAR1'), 4);
  return concatUint8Arrays([bytes.subarray(0, footerOffset), footer, trailer]).slice().buffer;
}
