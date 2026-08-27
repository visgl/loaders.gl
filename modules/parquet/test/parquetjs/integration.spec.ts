// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { isBrowser, fetchFile } from '@loaders.gl/core';
import { BlobFile } from '@loaders.gl/loader-utils';
import { ParquetSchema, ParquetReader, ParquetEncoder } from '@loaders.gl/parquet';
const FRUITS_URL = '@loaders.gl/parquet/test/data/fruits.parquet';
const GENERATED_PARQUET_DIRECTORY = 'tmp/test-artifacts/parquet';
const GENERATED_PARQUET_FILE = `${GENERATED_PARQUET_DIRECTORY}/fruits.parquet`;
const TEST_NUM_ROWS = 10000;
const TEST_VTIME = Date.now();
const FNORD_BYTES = new TextEncoder().encode('FNORD');
function mkTestSchema(opts) {
    return new ParquetSchema({
        name: { type: 'UTF8', compression: opts.compression },
        // quantity:   { type: 'INT64', encoding: 'RLE', typeLength: 6, optional: true, compression: opts.compression }, // parquet-mr actually doesnt support this
        quantity: { type: 'INT64', optional: true, compression: opts.compression },
        price: { type: 'DOUBLE', compression: opts.compression },
        date: { type: 'TIMESTAMP_MICROS', compression: opts.compression },
        day: { type: 'DATE', compression: opts.compression },
        finger: { type: 'FIXED_LEN_BYTE_ARRAY', compression: opts.compression, typeLength: 5 },
        inter: { type: 'INTERVAL', compression: opts.compression },
        stock: {
            repeated: true,
            fields: {
                quantity: { type: 'INT64', repeated: true },
                warehouse: { type: 'UTF8', compression: opts.compression }
            }
        },
        colour: { type: 'UTF8', repeated: true, compression: opts.compression },
        meta_json: { type: 'BSON', optional: true, compression: opts.compression }
    });
}
function mkTestRows(opts) {
    const rows: {
        [key: string]: unknown;
    }[] = [];
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
        rows.push({
            name: 'apples',
            quantity: 10,
            price: 2.6,
            day: new Date('2017-11-26'),
            date: new Date(TEST_VTIME + 1000 * i),
            finger: 'FNORD',
            inter: { months: 42, days: 23, milliseconds: 777 },
            stock: [
                { quantity: 10, warehouse: 'A' },
                { quantity: 20, warehouse: 'B' }
            ],
            colour: ['green', 'red']
        });
        rows.push({
            name: 'oranges',
            quantity: 20,
            price: 2.7,
            day: new Date('2017-11-26'),
            date: new Date(TEST_VTIME + 2000 * i),
            finger: 'FNORD',
            inter: { months: 42, days: 23, milliseconds: 777 },
            stock: {
                quantity: [50, 33],
                warehouse: 'X'
            },
            colour: ['orange']
        });
        rows.push({
            name: 'kiwi',
            price: 4.2,
            quantity: undefined,
            day: new Date('2017-11-26'),
            date: new Date(TEST_VTIME + 8000 * i),
            finger: 'FNORD',
            inter: { months: 42, days: 23, milliseconds: 777 },
            stock: [
                { quantity: 42, warehouse: 'f' },
                { quantity: 20, warehouse: 'x' }
            ],
            colour: ['green', 'brown'],
            meta_json: { expected_ship_date: TEST_VTIME }
        });
        rows.push({
            name: 'banana',
            price: 3.2,
            day: new Date('2017-11-26'),
            date: new Date(TEST_VTIME + 6000 * i),
            finger: 'FNORD',
            inter: { months: 42, days: 23, milliseconds: 777 },
            colour: ['yellow'],
            meta_json: { shape: 'curved' }
        });
    }
    return rows;
}
async function writeTestFile(opts) {
    const { mkdir } = await import('node:fs/promises');
    const schema = mkTestSchema(opts);
    await mkdir(GENERATED_PARQUET_DIRECTORY, { recursive: true });
    const writer = await ParquetEncoder.openFile(schema, GENERATED_PARQUET_FILE, opts);
    writer.setMetadata('myuid', '420');
    writer.setMetadata('fnord', 'dronf');
    const rows = mkTestRows(opts);
    for (const row of rows) {
        await writer.appendRow(row);
    }
    await writer.close();
}
// eslint-disable-next-line max-statements
async function readTestFile() {
    const response = await fetchFile(FRUITS_URL);
    const arrayBuffer = await response.arrayBuffer();
    const reader = new ParquetReader(new BlobFile(arrayBuffer));
    expect(reader.getRowCount()).toBe(TEST_NUM_ROWS * 4);
    expect(reader.getSchemaMetadata()).toEqual({ myuid: '420', fnord: 'dronf' });
    const schema = await reader.getSchema();
    expect(schema.fieldList.length).toBe(12);
    expect(schema.fields.name).toBeTruthy();
    expect(schema.fields.stock).toBeTruthy();
    expect(schema.fields.stock.fields?.quantity).toBeTruthy();
    expect(schema.fields.stock.fields?.warehouse).toBeTruthy();
    expect(schema.fields.price).toBeTruthy();
    {
        const field = schema.fields.name;
        expect(field?.name).toBe('name');
        expect(field?.primitiveType).toBe('BYTE_ARRAY');
        expect(field?.originalType).toBe('UTF8');
        expect(field?.path).toEqual(['name']);
        expect(field?.repetitionType).toBe('REQUIRED');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(0);
        expect(field?.dLevelMax).toBe(0);
        expect(Boolean(field?.isNested)).toBe(false);
        expect(field?.fieldCount).toBe(undefined);
    }
    {
        const field = schema.fields.stock;
        expect(field?.name).toBe('stock');
        expect(field?.primitiveType).toBe(undefined);
        expect(field?.originalType).toBe(undefined);
        expect(field?.path).toEqual(['stock']);
        expect(field?.repetitionType).toBe('REPEATED');
        expect(field?.encoding).toBe(undefined);
        expect(field?.compression).toBe(undefined);
        expect(field?.rLevelMax).toBe(1);
        expect(field?.dLevelMax).toBe(1);
        expect(Boolean(field?.isNested)).toBe(true);
        expect(field?.fieldCount).toBe(2);
    }
    {
        const field = schema.fields.stock.fields?.quantity;
        expect(field?.name).toBe('quantity');
        expect(field?.primitiveType).toBe('INT64');
        expect(field?.originalType).toBe(undefined);
        expect(field?.path).toEqual(['stock', 'quantity']);
        expect(field?.repetitionType).toBe('REPEATED');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(2);
        expect(field?.dLevelMax).toBe(2);
        expect(Boolean(field?.isNested)).toBe(false);
        expect(field?.fieldCount).toBe(undefined);
    }
    {
        const field = schema.fields.stock.fields?.warehouse;
        expect(field?.name).toBe('warehouse');
        expect(field?.primitiveType).toBe('BYTE_ARRAY');
        expect(field?.originalType).toBe('UTF8');
        expect(field?.path).toEqual(['stock', 'warehouse']);
        expect(field?.repetitionType).toBe('REQUIRED');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(1);
        expect(field?.dLevelMax).toBe(1);
        expect(Boolean(field?.isNested)).toBe(false);
        expect(field?.fieldCount).toBe(undefined);
    }
    {
        const field = schema.fields.price;
        expect(field?.name).toBe('price');
        expect(field?.primitiveType).toBe('DOUBLE');
        expect(field?.originalType).toBe(undefined);
        expect(field?.path).toEqual(['price']);
        expect(field?.repetitionType).toBe('REQUIRED');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(0);
        expect(field?.dLevelMax).toBe(0);
        expect(Boolean(field?.isNested)).toBe(false);
        expect(field?.fieldCount).toBe(undefined);
    }
    {
        const cursor = reader.rowIterator();
        for (let i = 0; i < TEST_NUM_ROWS; ++i) {
            expect(await cursor.next()).toEqual({
                name: 'apples',
                quantity: 10,
                price: 2.6,
                day: new Date('2017-11-26'),
                date: new Date(TEST_VTIME + 1000 * i),
                finger: FNORD_BYTES,
                inter: { months: 42, days: 23, milliseconds: 777 },
                stock: [
                    { quantity: [10], warehouse: 'A' },
                    { quantity: [20], warehouse: 'B' }
                ],
                colour: ['green', 'red']
            });
            expect(await cursor.next()).toEqual({
                name: 'oranges',
                quantity: 20,
                price: 2.7,
                day: new Date('2017-11-26'),
                date: new Date(TEST_VTIME + 2000 * i),
                finger: FNORD_BYTES,
                inter: { months: 42, days: 23, milliseconds: 777 },
                stock: [{ quantity: [50, 33], warehouse: 'X' }],
                colour: ['orange']
            });
            expect(await cursor.next()).toEqual({
                name: 'kiwi',
                price: 4.2,
                day: new Date('2017-11-26'),
                date: new Date(TEST_VTIME + 8000 * i),
                finger: FNORD_BYTES,
                inter: { months: 42, days: 23, milliseconds: 777 },
                stock: [
                    { quantity: [42], warehouse: 'f' },
                    { quantity: [20], warehouse: 'x' }
                ],
                colour: ['green', 'brown'],
                meta_json: { expected_ship_date: TEST_VTIME }
            });
            expect(await cursor.next()).toEqual({
                name: 'banana',
                price: 3.2,
                day: new Date('2017-11-26'),
                date: new Date(TEST_VTIME + 6000 * i),
                finger: FNORD_BYTES,
                inter: { months: 42, days: 23, milliseconds: 777 },
                colour: ['yellow'],
                meta_json: { shape: 'curved' }
            });
        }
        expect(await cursor.next()).toBe(null);
    }
    {
        const cursor = reader.rowIterator({ columnList: ['name', 'quantity'] });
        for (let i = 0; i < TEST_NUM_ROWS; ++i) {
            expect(await cursor.next()).toEqual({ name: 'apples' });
            expect(await cursor.next()).toEqual({ name: 'oranges' });
            expect(await cursor.next()).toEqual({ name: 'kiwi' });
            expect(await cursor.next()).toEqual({ name: 'banana' });
        }
        expect(await cursor.next()).toBe(null);
    }
    {
        const cursor = reader.rowIterator({ columnList: ['name', 'quantity'] });
        for (let i = 0; i < TEST_NUM_ROWS; ++i) {
            expect(await cursor.next()).toEqual({ name: 'apples', quantity: 10 });
            expect(await cursor.next()).toEqual({ name: 'oranges', quantity: 20 });
            expect(await cursor.next()).toEqual({ name: 'kiwi' });
            expect(await cursor.next()).toEqual({ name: 'banana' });
        }
        expect(await cursor.next()).toBe(null);
    }
    reader.close();
}
test('Parquet#DataPageHeaderV1#write a test file', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: false, compression: 'UNCOMPRESSED' };
    await writeTestFile(opts);
});
test('Parquet#DataPageHeaderV1#write a test file and then read it back', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: false, compression: 'UNCOMPRESSED' };
    await writeTestFile(opts);
    await readTestFile(t);
});
test('Parquet#DataPageHeaderV2#write a test file', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'UNCOMPRESSED' };
    await writeTestFile(opts);
    await readTestFile(t);
});
test('Parquet#DataPageHeaderV2#write a test file and then read it back', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'UNCOMPRESSED' };
    await writeTestFile(opts);
    await readTestFile(t);
});
test('Parquet#DataPageHeaderV2#write a test file with GZIP compression', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'GZIP' };
    await writeTestFile(opts);
});
test('Parquet#DataPageHeaderV2#write a test file with GZIP compression and then read it back', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'GZIP' };
    await writeTestFile(opts);
    await readTestFile(t);
});
test('Parquet#DataPageHeaderV2#write a test file with SNAPPY compression', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'SNAPPY' };
    await writeTestFile(opts);
});
test('Parquet#DataPageHeaderV2#write a test file with SNAPPY compression and then read it back', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'SNAPPY' };
    await writeTestFile(opts);
    await readTestFile(t);
});
test('Parquet#DataPageHeaderV2#write a test file with LZO compression', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'LZO' };
    await writeTestFile(opts);
});
test('Parquet#DataPageHeaderV2#write a test file with LZO compression and then read it back', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'LZO' };
    await writeTestFile(opts);
    await readTestFile(t);
});
test('Parquet#DataPageHeaderV2#write a test file with BROTLI compression', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'BROTLI' };
    await writeTestFile(opts);
});
test('Parquet#DataPageHeaderV2#write a test file with BROTLI compression and then read it back', async () => {
    if (isBrowser) {
        return;
    }
    const opts = { useDataPageV2: true, compression: 'BROTLI' };
    await writeTestFile(opts);
    await readTestFile(t);
});
test.skip('Stream/Transform#write a test file', async () => {
});
