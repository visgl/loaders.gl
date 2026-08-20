// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import test from 'test/utils/vitest-tape';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetReader} from '@loaders.gl/parquet';
import {fetchFile} from '@loaders.gl/core';

const FRUITS_URL = '@loaders.gl/parquet/test/data/fruits.parquet';
const DICTIONARY_URL = '@loaders.gl/parquet/test/data/apache/good/alltypes_dictionary.parquet';
const WIDE_URL = '@loaders.gl/parquet/test/data/apache/good/delta_binary_packed.parquet';
// const TEST_NUM_ROWS = 1; // 10000;
// const TEST_VTIME =  Date.now();

/** Blob-backed file that records random-access request count and concurrency. */
class TrackedBlobFile extends BlobFile {
  /** Number of reads initiated since the last metric reset. */
  readCount = 0;
  /** Number of reads that have not completed. */
  activeReadCount = 0;
  /** Largest number of simultaneous reads since the last metric reset. */
  maximumActiveReadCount = 0;

  /** Clears read metrics without changing the underlying file. */
  resetMetrics(): void {
    this.readCount = 0;
    this.activeReadCount = 0;
    this.maximumActiveReadCount = 0;
  }

  /** Reads one range while updating request and concurrency metrics. */
  override async read(
    start?: number | bigint,
    length?: number,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    this.readCount++;
    this.activeReadCount++;
    this.maximumActiveReadCount = Math.max(
      this.maximumActiveReadCount,
      this.activeReadCount
    );
    try {
      return await super.read(start, length, signal);
    } finally {
      this.activeReadCount--;
    }
  }
}

// eslint-disable-next-line
test('ParquetReader#fruits.parquet', async t => {
  const response = await fetchFile(FRUITS_URL);
  const arrayBuffer = await response.arrayBuffer();
  const reader = new ParquetReader(new BlobFile(arrayBuffer));
  // t.equal(reader.getRowCount(), TEST_NUM_ROWS * 4, 'rowCount');

  const metadata = await reader.getSchemaMetadata();
  t.deepEqual(metadata, { 'myuid': '420', 'fnord': 'dronf' })
  
  const schema = await reader.getSchema();

  t.equal(schema.fieldList.length, 12, 'field count');
  t.ok(schema.fields.name, 'field.name');
  t.ok(schema.fields.stock, 'field.stock');
  t.ok(schema.fields.stock.fields?.quantity, 'field.quantity');
  t.ok(schema.fields.stock.fields?.warehouse, 'field.warehouse');
  t.ok(schema.fields.price, 'field.price');

  {
    const field = schema.fields.name;
    t.equal(field?.name, 'name', 'name');
    t.equal(field?.primitiveType, 'BYTE_ARRAY', 'BYTE_ARRAY');
    // TODO - why is this failing
    // t.equal(field?.originalType, 'UTF8', 'UTF8');
    t.deepEqual(field?.path, ['name']);
    t.equal(field?.repetitionType, 'REQUIRED', 'REQUIRED');
    t.equal(field?.encoding, 'PLAIN', 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 0, 'rLevelMax = 0');
    t.equal(field?.dLevelMax, 0, 'dLevelMax = 0');
    t.equal(Boolean(field?.isNested), false, '!isNested');
    t.equal(field?.fieldCount, undefined, '!fieldCount');
  }

  {
    const field = schema.fields.stock;
    t.equal(field?.name, 'stock', 'stock');
    t.equal(field?.primitiveType, undefined, '');
    t.equal(field?.originalType, undefined, '');
    t.deepEqual(field?.path, ['stock']);
    t.equal(field?.repetitionType, 'REPEATED', 'REPEATED');
    t.equal(field?.encoding, undefined, '');
    t.equal(field?.compression, undefined, '');
    t.equal(field?.rLevelMax, 1, '');
    t.equal(field?.dLevelMax, 1, '');
    t.equal(Boolean(field?.isNested), true, '');
    t.equal(field?.fieldCount, 2, '');
  }

  {
    const field = schema.fields.stock.fields?.quantity;
    t.equal(field?.name, 'quantity', 'quantity');
    t.equal(field?.primitiveType, 'INT64', 'INT64');
    t.equal(field?.originalType, undefined, '');
    t.deepEqual(field?.path, ['stock', 'quantity']);
    t.equal(field?.repetitionType, 'REPEATED', 'REPEATED');
    t.equal(field?.encoding, 'PLAIN', 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 2, '');
    t.equal(field?.dLevelMax, 2, '');
    t.equal(Boolean(field?.isNested), false, '');
    t.equal(field?.fieldCount, undefined, '');
  }

  {
    const field = schema.fields.stock.fields?.warehouse;
    t.equal(field?.name, 'warehouse', 'warehouse');
    t.equal(field?.primitiveType, 'BYTE_ARRAY', 'BYTE_ARRAY');
    // TODO - why is this failing
    // t.equal(field?.originalType, 'UTF8', 'UTF8');
    t.deepEqual(field?.path, ['stock', 'warehouse']);
    t.equal(field?.repetitionType, 'REQUIRED', 'REQUIRED');
    t.equal(field?.encoding, 'PLAIN', 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 1, '');
    t.equal(field?.dLevelMax, 1, '');
    t.equal(Boolean(field?.isNested), false, '');
    t.equal(field?.fieldCount, undefined, '');
  }

  {
    const field = schema.fields.price;
    t.equal(field?.name, 'price', 'price');
    t.equal(field?.primitiveType, 'DOUBLE', 'DOUBLE');
    t.equal(field?.originalType, undefined, '');
    t.deepEqual(field?.path, ['price']);
    t.equal(field?.repetitionType, 'REQUIRED', 'REQUIRED');
    t.equal(field?.encoding, 'PLAIN', 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 0, '');
    t.equal(field?.dLevelMax, 0, '');
    t.equal(Boolean(field?.isNested), false, '');
    t.equal(field?.fieldCount, undefined, '');
  }

  /*
  {
    const cursor = reader.getCursor();
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      t.deepEqual(await cursor.next(), {
        name: 'apples',
        quantity: 10,
        price: 2.6,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 1000 * i),
        finger: new TextEncoder().encode('FNORD'),
        inter: { months: 42, days: 23, milliseconds: 777 },
        stock: [
          { quantity: [10], warehouse: "A" },
          { quantity: [20], warehouse: "B" }
        ],
        colour: [ 'green', 'red' ]
      });

      t.deepEqual(await cursor.next(), {
        name: 'oranges',
        quantity: 20,
        price: 2.7,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 2000 * i),
        finger: new TextEncoder().encode('FNORD'),
        inter: { months: 42, days: 23, milliseconds: 777 },
        stock: [
          { quantity: [50, 33], warehouse: "X" }
        ],
        colour: [ 'orange' ]
      });

      t.deepEqual(await cursor.next(), {
        name: 'kiwi',
        price: 4.2,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 8000 * i),
        finger: new TextEncoder().encode('FNORD'),
        inter: { months: 42, days: 23, milliseconds: 777 },
        stock: [
          { quantity: [42], warehouse: "f" },
          { quantity: [20], warehouse: "x" }
        ],
        colour: [ 'green', 'brown' ],
        meta_json: { expected_ship_date: TEST_VTIME }
      });

      t.deepEqual(await cursor.next(), {
        name: 'banana',
        price: 3.2,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 6000 * i),
        finger: new TextEncoder().encode('FNORD'),
        inter: { months: 42, days: 23, milliseconds: 777 },
        colour: [ 'yellow' ],
        meta_json: { shape: 'curved' }
      });
    }

    t.equal(await cursor.next(), null, '');
  }

  {
    const cursor = reader.getCursor(['name']);
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      t.deepEqual(await cursor.next(), { name: 'apples' });
      t.deepEqual(await cursor.next(), { name: 'oranges' });
      t.deepEqual(await cursor.next(), { name: 'kiwi' });
      t.deepEqual(await cursor.next(), { name: 'banana' });
    }

    t.equal(await cursor.next(), null, '');
  }

  {
    const cursor = reader.getCursor(['name', 'quantity']);
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      t.deepEqual(await cursor.next(), { name: 'apples', quantity: 10 });
      t.deepEqual(await cursor.next(), { name: 'oranges', quantity: 20 });
      t.deepEqual(await cursor.next(), { name: 'kiwi' });
      t.deepEqual(await cursor.next(), { name: 'banana' });
    }

    t.equal(await cursor.next(), null, '');
  }
  */

  reader.close();
  t.end();
});

test('ParquetReader#coalesces and concurrently reads selected column chunks', async t => {
  const response = await fetchFile(DICTIONARY_URL);
  const arrayBuffer = await response.arrayBuffer();
  const file = new TrackedBlobFile(arrayBuffer);

  const reader = new ParquetReader(file);
  const metadata = await reader.getFileMetadata();
  const firstSchema = await reader.getSchema();
  const secondSchema = await reader.getSchema();
  t.equal(secondSchema, firstSchema, 'caches the parsed schema within one reader');

  file.resetMetrics();
  const rowGroupMetadata = metadata.row_groups[0];
  const rowGroup = await reader.readRowGroup(firstSchema, rowGroupMetadata, []);

  t.equal(
    file.readCount,
    rowGroupMetadata.columns.length,
    'reads each dictionary-backed column chunk with one coalesced range'
  );
  t.ok(file.maximumActiveReadCount > 1, 'reads independent selected columns concurrently');
  t.equal(rowGroup.rowCount, 2, 'preserves the decoded row count');
  t.equal(
    Object.keys(rowGroup.columnData).length,
    rowGroupMetadata.columns.length,
    'preserves every decoded column'
  );

  reader.close();
  t.end();
});

test('ParquetReader#bounds concurrent reads for wide row groups', async t => {
  const response = await fetchFile(WIDE_URL);
  const arrayBuffer = await response.arrayBuffer();
  const file = new TrackedBlobFile(arrayBuffer);
  const reader = new ParquetReader(file);
  const metadata = await reader.getFileMetadata();
  const schema = await reader.getSchema();
  const rowGroupMetadata = metadata.row_groups[0];

  file.resetMetrics();
  const rowGroup = await reader.readRowGroup(schema, rowGroupMetadata, []);

  t.equal(file.readCount, rowGroupMetadata.columns.length, 'reads every selected column once');
  t.equal(file.maximumActiveReadCount, 16, 'caps simultaneous column reads');
  t.equal(
    Object.keys(rowGroup.columnData).length,
    rowGroupMetadata.columns.length,
    'preserves every column across concurrency batches'
  );

  reader.close();
  t.end();
});
