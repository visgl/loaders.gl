// Broken out from parquetjs integration tests

import {Test} from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {makeReadableFile, makeWritableFile} from '@loaders.gl/loader-utils';
import {ParquetSchema, ParquetReader, ParquetEncoder} from '@loaders.gl/parquet';

const FRUITS_FILE_NAME = '/tmp/fruits.parquet';
const TEST_NUM_ROWS = 10000;
const TEST_VTIME = Date.now();

function mkTestSchema(opts) {
  return new ParquetSchema({
    name: {type: 'UTF8', compression: opts.compression},
    // quantity:   { type: 'INT64', encoding: 'RLE', typeLength: 6, optional: true, compression: opts.compression }, // parquet-mr actually doesnt support this
    quantity: {type: 'INT64', optional: true, compression: opts.compression},
    price: {type: 'DOUBLE', compression: opts.compression},
    date: {type: 'TIMESTAMP_MICROS', compression: opts.compression},
    day: {type: 'DATE', compression: opts.compression},
    finger: {type: 'FIXED_LEN_BYTE_ARRAY', compression: opts.compression, typeLength: 5},
    inter: {type: 'INTERVAL', compression: opts.compression},
    stock: {
      repeated: true,
      fields: {
        quantity: {type: 'INT64', repeated: true},
        warehouse: {type: 'UTF8', compression: opts.compression}
      }
    },
    colour: {type: 'UTF8', repeated: true, compression: opts.compression},
    meta_json: {type: 'BSON', optional: true, compression: opts.compression}
  });
}

function mkTestRows(opts) {
  const rows: {[key: string]: unknown}[] = [];

  for (let i = 0; i < TEST_NUM_ROWS; ++i) {
    rows.push({
      name: 'apples',
      quantity: 10,
      price: 2.6,
      day: new Date('2017-11-26'),
      date: new Date(TEST_VTIME + 1000 * i),
      finger: 'FNORD',
      inter: {months: 42, days: 23, milliseconds: 777},
      stock: [
        {quantity: 10, warehouse: 'A'},
        {quantity: 20, warehouse: 'B'}
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
      inter: {months: 42, days: 23, milliseconds: 777},
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
      inter: {months: 42, days: 23, milliseconds: 777},
      stock: [
        {quantity: 42, warehouse: 'f'},
        {quantity: 20, warehouse: 'x'}
      ],
      colour: ['green', 'brown'],
      meta_json: {expected_ship_date: TEST_VTIME}
    });

    rows.push({
      name: 'banana',
      price: 3.2,
      day: new Date('2017-11-26'),
      date: new Date(TEST_VTIME + 6000 * i),
      finger: 'FNORD',
      inter: {months: 42, days: 23, milliseconds: 777},
      colour: ['yellow'],
      meta_json: {shape: 'curved'}
    });
  }

  return rows;
}

// HELPERS

export async function writeTestFile(opts) {
  const schema = mkTestSchema(opts);

  const file = makeWritableFile(FRUITS_FILE_NAME);
  const writer = new ParquetEncoder(schema, file, opts);
  writer.setMetadata('myuid', '420');
  writer.setMetadata('fnord', 'dronf');

  const rows = mkTestRows(opts);

  for (const row of rows) {
    await writer.appendRow(row);
  }

  await writer.close();
}

// eslint-disable-next-line max-statements
export async function readTestFile(t: Test, options?: {testRows?: boolean}) {
  const response = await fetchFile(FRUITS_FILE_NAME);
  const arrayBuffer = await response.arrayBuffer();
  const reader = new ParquetReader(makeReadableFile(arrayBuffer));
  t.deepEqual(await reader.getSchemaMetadata(), {myuid: '420', fnord: 'dronf'});

  const schema = await reader.getSchema();
  t.equal(schema.fieldList.length, 12);
  t.ok(schema.fields.name);
  t.ok(schema.fields.stock);
  t.ok(schema.fields.stock.fields?.quantity);
  t.ok(schema.fields.stock.fields?.warehouse);
  t.ok(schema.fields.price);

  {
    const field = schema.fields.name;
    t.equal(field?.name, 'name');
    t.equal(field?.primitiveType, 'BYTE_ARRAY');
    // TODO - fix !
    // t.equal(field?.originalType, 'UTF8');
    t.deepEqual(field?.path, ['name']);
    t.equal(field?.repetitionType, 'REQUIRED');
    t.equal(field?.encoding, 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 0);
    t.equal(field?.dLevelMax, 0);
    t.equal(Boolean(field?.isNested), false);
    t.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock;
    t.equal(field?.name, 'stock');
    t.equal(field?.primitiveType, undefined);
    t.equal(field?.originalType, undefined);
    t.deepEqual(field?.path, ['stock']);
    t.equal(field?.repetitionType, 'REPEATED');
    t.equal(field?.encoding, undefined);
    t.equal(field?.compression, undefined);
    t.equal(field?.rLevelMax, 1);
    t.equal(field?.dLevelMax, 1);
    t.equal(Boolean(field?.isNested), true);
    t.equal(field?.fieldCount, 2);
  }

  {
    const field = schema.fields.stock.fields?.quantity;
    t.equal(field?.name, 'quantity');
    t.equal(field?.primitiveType, 'INT64');
    t.equal(field?.originalType, undefined);
    t.deepEqual(field?.path, ['stock', 'quantity']);
    t.equal(field?.repetitionType, 'REPEATED');
    t.equal(field?.encoding, 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 2);
    t.equal(field?.dLevelMax, 2);
    t.equal(Boolean(field?.isNested), false);
    t.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock.fields?.warehouse;
    t.equal(field?.name, 'warehouse');
    t.equal(field?.primitiveType, 'BYTE_ARRAY');
    // TODO - fix !
    // t.equal(field?.originalType, 'UTF8');
    t.deepEqual(field?.path, ['stock', 'warehouse']);
    t.equal(field?.repetitionType, 'REQUIRED');
    t.equal(field?.encoding, 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 1);
    t.equal(field?.dLevelMax, 1);
    t.equal(Boolean(field?.isNested), false);
    t.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.price;
    t.equal(field?.name, 'price');
    t.equal(field?.primitiveType, 'DOUBLE');
    t.equal(field?.originalType, undefined);
    t.deepEqual(field?.path, ['price']);
    t.equal(field?.repetitionType, 'REQUIRED');
    t.equal(field?.encoding, 'PLAIN');
    t.equal(field?.compression, 'UNCOMPRESSED');
    t.equal(field?.rLevelMax, 0);
    t.equal(field?.dLevelMax, 0);
    t.equal(Boolean(field?.isNested), false);
    t.equal(field?.fieldCount, undefined);
  }

  if (!options?.testRows) {
    return;
  }

  t.equal(await reader.getRowCount(), TEST_NUM_ROWS * 4);

  {
    const cursor = reader.rowIterator();
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      t.deepEqual(await cursor.next(), {
        name: 'apples',
        quantity: 10,
        price: 2.6,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 1000 * i),
        finger: Buffer.from('FNORD'),
        inter: {months: 42, days: 23, milliseconds: 777},
        stock: [
          {quantity: [10], warehouse: 'A'},
          {quantity: [20], warehouse: 'B'}
        ],
        colour: ['green', 'red']
      });

      t.deepEqual(await cursor.next(), {
        name: 'oranges',
        quantity: 20,
        price: 2.7,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 2000 * i),
        finger: Buffer.from('FNORD'),
        inter: {months: 42, days: 23, milliseconds: 777},
        stock: [{quantity: [50, 33], warehouse: 'X'}],
        colour: ['orange']
      });

      t.deepEqual(await cursor.next(), {
        name: 'kiwi',
        price: 4.2,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 8000 * i),
        finger: Buffer.from('FNORD'),
        inter: {months: 42, days: 23, milliseconds: 777},
        stock: [
          {quantity: [42], warehouse: 'f'},
          {quantity: [20], warehouse: 'x'}
        ],
        colour: ['green', 'brown'],
        meta_json: {expected_ship_date: TEST_VTIME}
      });

      t.deepEqual(await cursor.next(), {
        name: 'banana',
        price: 3.2,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 6000 * i),
        finger: Buffer.from('FNORD'),
        inter: {months: 42, days: 23, milliseconds: 777},
        colour: ['yellow'],
        meta_json: {shape: 'curved'}
      });
    }

    t.equal(await cursor.next(), null);
  }

  {
    const cursor = reader.rowIterator({columnList: ['name', 'quantity']});
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      t.deepEqual(await cursor.next(), {name: 'apples'});
      t.deepEqual(await cursor.next(), {name: 'oranges'});
      t.deepEqual(await cursor.next(), {name: 'kiwi'});
      t.deepEqual(await cursor.next(), {name: 'banana'});
    }

    t.equal(await cursor.next(), null);
  }

  {
    const cursor = reader.rowIterator({columnList: ['name', 'quantity']});
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      t.deepEqual(await cursor.next(), {name: 'apples', quantity: 10});
      t.deepEqual(await cursor.next(), {name: 'oranges', quantity: 20});
      t.deepEqual(await cursor.next(), {name: 'kiwi'});
      t.deepEqual(await cursor.next(), {name: 'banana'});
    }

    t.equal(await cursor.next(), null);
  }

  reader.close();
}
