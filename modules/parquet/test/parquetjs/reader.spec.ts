import { expect, test } from "vitest";
import { ArrayBufferFile, BlobFile } from '@loaders.gl/loader-utils';
import { ParquetReader } from '@loaders.gl/parquet';
import { fetchFile } from '@loaders.gl/core';
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
    override async read(start?: number | bigint, length?: number, signal?: AbortSignal): Promise<ArrayBuffer> {
        this.readCount++;
        this.activeReadCount++;
        this.maximumActiveReadCount = Math.max(this.maximumActiveReadCount, this.activeReadCount);
        try {
            return await super.read(start, length, signal);
        }
        finally {
            this.activeReadCount--;
        }
    }
}

/** In-memory file that records whether the reader requested copying range reads. */
class TrackedArrayBufferFile extends ArrayBufferFile {
    /** Number of copying reads requested from the file adapter. */
    readCount = 0;

    /** Records a fallback range read before delegating to the file adapter. */
    override async read(
        start?: number | bigint,
        length?: number,
        signal?: AbortSignal
    ): Promise<ArrayBuffer> {
        this.readCount++;
        return await super.read(start, length, signal);
    }
}

test('ParquetReader#uses zero-copy ranges for in-memory files', async () => {
    const response = await fetchFile(DICTIONARY_URL);
    const file = new TrackedArrayBufferFile(await response.arrayBuffer());
    const reader = new ParquetReader(file, {
        retainByteArrayViews: true,
        useTypedLevelBuffers: true,
        useTypedValueBuffers: true
    });

    const iterator = reader.rowGroupIterator({columnList: ['id']});
    const firstRowGroup = await iterator.next();

    expect(firstRowGroup.done).toBe(false);
    expect(file.readCount).toBe(0);
    reader.close();
});
test('ParquetReader#rejects external columns before using the in-memory fast path', async () => {
    const response = await fetchFile(FRUITS_URL);
    const reader = new ParquetReader(new ArrayBufferFile(await response.arrayBuffer()), {
        useTypedLevelBuffers: true,
        useTypedValueBuffers: true
    });
    const metadata = await reader.getFileMetadata();
    const schema = await reader.getSchema();
    metadata.row_groups[0].columns[0].file_path = 'external.parquet';

    await expect(reader.readRowGroup(schema, metadata.row_groups[0], [])).rejects.toThrow(
        'external references are not supported'
    );
    reader.close();
});
// eslint-disable-next-line
test('ParquetReader#fruits.parquet', async () => {
    const response = await fetchFile(FRUITS_URL);
    const arrayBuffer = await response.arrayBuffer();
    const reader = new ParquetReader(new BlobFile(arrayBuffer));
    // t.equal(reader.getRowCount(), TEST_NUM_ROWS * 4, 'rowCount');
    const metadata = await reader.getSchemaMetadata();
    expect(metadata).toEqual({ 'myuid': '420', 'fnord': 'dronf' });
    const schema = await reader.getSchema();
    expect(schema.fieldList.length, 'field count').toBe(12);
    expect(schema.fields.name, 'field.name').toBeTruthy();
    expect(schema.fields.stock, 'field.stock').toBeTruthy();
    expect(schema.fields.stock.fields?.quantity, 'field.quantity').toBeTruthy();
    expect(schema.fields.stock.fields?.warehouse, 'field.warehouse').toBeTruthy();
    expect(schema.fields.price, 'field.price').toBeTruthy();
    {
        const field = schema.fields.name;
        expect(field?.name, 'name').toBe('name');
        expect(field?.primitiveType, 'BYTE_ARRAY').toBe('BYTE_ARRAY');
        // TODO - why is this failing
        // t.equal(field?.originalType, 'UTF8', 'UTF8');
        expect(field?.path).toEqual(['name']);
        expect(field?.repetitionType, 'REQUIRED').toBe('REQUIRED');
        expect(field?.encoding, 'PLAIN').toBe('PLAIN');
        expect(field?.compression, 'UNCOMPRESSED').toBe('UNCOMPRESSED');
        expect(field?.rLevelMax, 'rLevelMax = 0').toBe(0);
        expect(field?.dLevelMax, 'dLevelMax = 0').toBe(0);
        expect(Boolean(field?.isNested), '!isNested').toBe(false);
        expect(field?.fieldCount, '!fieldCount').toBe(undefined);
    }
    {
        const field = schema.fields.stock;
        expect(field?.name, 'stock').toBe('stock');
        expect(field?.primitiveType, '').toBe(undefined);
        expect(field?.originalType, '').toBe(undefined);
        expect(field?.path).toEqual(['stock']);
        expect(field?.repetitionType, 'REPEATED').toBe('REPEATED');
        expect(field?.encoding, '').toBe(undefined);
        expect(field?.compression, '').toBe(undefined);
        expect(field?.rLevelMax, '').toBe(1);
        expect(field?.dLevelMax, '').toBe(1);
        expect(Boolean(field?.isNested), '').toBe(true);
        expect(field?.fieldCount, '').toBe(2);
    }
    {
        const field = schema.fields.stock.fields?.quantity;
        expect(field?.name, 'quantity').toBe('quantity');
        expect(field?.primitiveType, 'INT64').toBe('INT64');
        expect(field?.originalType, '').toBe(undefined);
        expect(field?.path).toEqual(['stock', 'quantity']);
        expect(field?.repetitionType, 'REPEATED').toBe('REPEATED');
        expect(field?.encoding, 'PLAIN').toBe('PLAIN');
        expect(field?.compression, 'UNCOMPRESSED').toBe('UNCOMPRESSED');
        expect(field?.rLevelMax, '').toBe(2);
        expect(field?.dLevelMax, '').toBe(2);
        expect(Boolean(field?.isNested), '').toBe(false);
        expect(field?.fieldCount, '').toBe(undefined);
    }
    {
        const field = schema.fields.stock.fields?.warehouse;
        expect(field?.name, 'warehouse').toBe('warehouse');
        expect(field?.primitiveType, 'BYTE_ARRAY').toBe('BYTE_ARRAY');
        // TODO - why is this failing
        // t.equal(field?.originalType, 'UTF8', 'UTF8');
        expect(field?.path).toEqual(['stock', 'warehouse']);
        expect(field?.repetitionType, 'REQUIRED').toBe('REQUIRED');
        expect(field?.encoding, 'PLAIN').toBe('PLAIN');
        expect(field?.compression, 'UNCOMPRESSED').toBe('UNCOMPRESSED');
        expect(field?.rLevelMax, '').toBe(1);
        expect(field?.dLevelMax, '').toBe(1);
        expect(Boolean(field?.isNested), '').toBe(false);
        expect(field?.fieldCount, '').toBe(undefined);
    }
    {
        const field = schema.fields.price;
        expect(field?.name, 'price').toBe('price');
        expect(field?.primitiveType, 'DOUBLE').toBe('DOUBLE');
        expect(field?.originalType, '').toBe(undefined);
        expect(field?.path).toEqual(['price']);
        expect(field?.repetitionType, 'REQUIRED').toBe('REQUIRED');
        expect(field?.encoding, 'PLAIN').toBe('PLAIN');
        expect(field?.compression, 'UNCOMPRESSED').toBe('UNCOMPRESSED');
        expect(field?.rLevelMax, '').toBe(0);
        expect(field?.dLevelMax, '').toBe(0);
        expect(Boolean(field?.isNested), '').toBe(false);
        expect(field?.fieldCount, '').toBe(undefined);
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
});
test('ParquetReader#coalesces and concurrently reads selected column chunks', async () => {
    const response = await fetchFile(DICTIONARY_URL);
    const arrayBuffer = await response.arrayBuffer();
    const file = new TrackedBlobFile(arrayBuffer);
    const reader = new ParquetReader(file);
    const metadata = await reader.getFileMetadata();
    const firstSchema = await reader.getSchema();
    const secondSchema = await reader.getSchema();
    expect(secondSchema, 'caches the parsed schema within one reader').toBe(firstSchema);
    file.resetMetrics();
    const rowGroupMetadata = metadata.row_groups[0];
    const rowGroup = await reader.readRowGroup(firstSchema, rowGroupMetadata, []);
    expect(file.readCount, 'reads each dictionary-backed column chunk with one coalesced range').toBe(rowGroupMetadata.columns.length);
    expect(file.maximumActiveReadCount > 1, 'reads independent selected columns concurrently').toBeTruthy();
    expect(rowGroup.rowCount, 'preserves the decoded row count').toBe(2);
    expect(Object.keys(rowGroup.columnData).length, 'preserves every decoded column').toBe(rowGroupMetadata.columns.length);
    reader.close();
});
test('ParquetReader#bounds concurrent reads for wide row groups', async () => {
    const response = await fetchFile(WIDE_URL);
    const arrayBuffer = await response.arrayBuffer();
    const file = new TrackedBlobFile(arrayBuffer);
    const reader = new ParquetReader(file);
    const metadata = await reader.getFileMetadata();
    const schema = await reader.getSchema();
    const rowGroupMetadata = metadata.row_groups[0];
    file.resetMetrics();
    const rowGroup = await reader.readRowGroup(schema, rowGroupMetadata, []);
    expect(file.readCount, 'reads every selected column once').toBe(rowGroupMetadata.columns.length);
    expect(file.maximumActiveReadCount, 'caps simultaneous column reads').toBe(16);
    expect(Object.keys(rowGroup.columnData).length, 'preserves every column across concurrency batches').toBe(rowGroupMetadata.columns.length);
    reader.close();
});
