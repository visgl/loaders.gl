/* eslint-disable camelcase */
import test from 'tape-promise/tape';
import {ParquetReader} from '@loaders.gl/parquet';
import {fetchFile} from '@loaders.gl/core';

const FRUITS_URL = '@loaders.gl/parquet/test/data/fruits.parquet';
// const TEST_NUM_ROWS = 1; // 10000;
// const TEST_VTIME =  Date.now();

// eslint-disable-next-line
test('ParquetReader#fruits.parquet', async assert => {
  const response = await fetchFile(FRUITS_URL);
  const arrayBuffer = await response.arrayBuffer();
  const reader = await ParquetReader.openArrayBuffer(arrayBuffer);
  // assert.equal(reader.getRowCount(), TEST_NUM_ROWS * 4, 'rowCount');
  assert.deepEqual(reader.getMetadata(), { "myuid": "420", "fnord": "dronf" })

  const schema = reader.getSchema();
  assert.equal(schema.fieldList.length, 12, 'field count');
  assert.ok(schema.fields.name, 'field.name');
  assert.ok(schema.fields.stock, 'field.stock');
  assert.ok(schema.fields.stock.fields?.quantity, 'field.quantity');
  assert.ok(schema.fields.stock.fields?.warehouse, 'field.warehouse');
  assert.ok(schema.fields.price, 'field.price');

  {
    const field = schema.fields.name;
    assert.equal(field?.name, 'name', 'name');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY', 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8', 'UTF8');
    assert.deepEqual(field?.path, ['name']);
    assert.equal(field?.repetitionType, 'REQUIRED', 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN', 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0, 'rLevelMax = 0');
    assert.equal(field?.dLevelMax, 0, 'dLevelMax = 0');
    assert.equal(Boolean(field?.isNested), false, '!isNested');
    assert.equal(field?.fieldCount, undefined, '!fieldCount');
  }

  {
    const field = schema.fields.stock;
    assert.equal(field?.name, 'stock', 'stock');
    assert.equal(field?.primitiveType, undefined, '');
    assert.equal(field?.originalType, undefined, '');
    assert.deepEqual(field?.path, ['stock']);
    assert.equal(field?.repetitionType, 'REPEATED', 'REPEATED');
    assert.equal(field?.encoding, undefined, '');
    assert.equal(field?.compression, undefined, '');
    assert.equal(field?.rLevelMax, 1, '');
    assert.equal(field?.dLevelMax, 1, '');
    assert.equal(Boolean(field?.isNested), true, '');
    assert.equal(field?.fieldCount, 2, '');
  }

  {
    const field = schema.fields.stock.fields?.quantity;
    assert.equal(field?.name, 'quantity', 'quantity');
    assert.equal(field?.primitiveType, 'INT64', 'INT64');
    assert.equal(field?.originalType, undefined, '');
    assert.deepEqual(field?.path, ['stock', 'quantity']);
    assert.equal(field?.repetitionType, 'REPEATED', 'REPEATED');
    assert.equal(field?.encoding, 'PLAIN', 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 2, '');
    assert.equal(field?.dLevelMax, 2, '');
    assert.equal(Boolean(field?.isNested), false, '');
    assert.equal(field?.fieldCount, undefined, '');
  }

  {
    const field = schema.fields.stock.fields?.warehouse;
    assert.equal(field?.name, 'warehouse', 'warehouse');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY', 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8', 'UTF8');
    assert.deepEqual(field?.path, ['stock', 'warehouse']);
    assert.equal(field?.repetitionType, 'REQUIRED', 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN', 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 1, '');
    assert.equal(field?.dLevelMax, 1, '');
    assert.equal(Boolean(field?.isNested), false, '');
    assert.equal(field?.fieldCount, undefined, '');
  }

  {
    const field = schema.fields.price;
    assert.equal(field?.name, 'price', 'price');
    assert.equal(field?.primitiveType, 'DOUBLE', 'DOUBLE');
    assert.equal(field?.originalType, undefined, '');
    assert.deepEqual(field?.path, ['price']);
    assert.equal(field?.repetitionType, 'REQUIRED', 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN', 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED', 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0, '');
    assert.equal(field?.dLevelMax, 0, '');
    assert.equal(Boolean(field?.isNested), false, '');
    assert.equal(field?.fieldCount, undefined, '');
  }

  /*
  {
    const cursor = reader.getCursor();
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      assert.deepEqual(await cursor.next(), {
        name: 'apples',
        quantity: 10,
        price: 2.6,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 1000 * i),
        finger: Buffer.from("FNORD"),
        inter: { months: 42, days: 23, milliseconds: 777 },
        stock: [
          { quantity: [10], warehouse: "A" },
          { quantity: [20], warehouse: "B" }
        ],
        colour: [ 'green', 'red' ]
      });

      assert.deepEqual(await cursor.next(), {
        name: 'oranges',
        quantity: 20,
        price: 2.7,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 2000 * i),
        finger: Buffer.from("FNORD"),
        inter: { months: 42, days: 23, milliseconds: 777 },
        stock: [
          { quantity: [50, 33], warehouse: "X" }
        ],
        colour: [ 'orange' ]
      });

      assert.deepEqual(await cursor.next(), {
        name: 'kiwi',
        price: 4.2,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 8000 * i),
        finger: Buffer.from("FNORD"),
        inter: { months: 42, days: 23, milliseconds: 777 },
        stock: [
          { quantity: [42], warehouse: "f" },
          { quantity: [20], warehouse: "x" }
        ],
        colour: [ 'green', 'brown' ],
        meta_json: { expected_ship_date: TEST_VTIME }
      });

      assert.deepEqual(await cursor.next(), {
        name: 'banana',
        price: 3.2,
        day: new Date('2017-11-26'),
        date: new Date(TEST_VTIME + 6000 * i),
        finger: Buffer.from("FNORD"),
        inter: { months: 42, days: 23, milliseconds: 777 },
        colour: [ 'yellow' ],
        meta_json: { shape: 'curved' }
      });
    }

    assert.equal(await cursor.next(), null, '');
  }

  {
    const cursor = reader.getCursor(['name']);
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      assert.deepEqual(await cursor.next(), { name: 'apples' });
      assert.deepEqual(await cursor.next(), { name: 'oranges' });
      assert.deepEqual(await cursor.next(), { name: 'kiwi' });
      assert.deepEqual(await cursor.next(), { name: 'banana' });
    }

    assert.equal(await cursor.next(), null, '');
  }

  {
    const cursor = reader.getCursor(['name', 'quantity']);
    for (let i = 0; i < TEST_NUM_ROWS; ++i) {
      assert.deepEqual(await cursor.next(), { name: 'apples', quantity: 10 });
      assert.deepEqual(await cursor.next(), { name: 'oranges', quantity: 20 });
      assert.deepEqual(await cursor.next(), { name: 'kiwi' });
      assert.deepEqual(await cursor.next(), { name: 'banana' });
    }

    assert.equal(await cursor.next(), null, '');
  }
  */

  reader.close();
  assert.end();
});
