/* eslint-disable max-statements */
import test from 'tape-promise/tape';
import {ParquetSchema, convertParquetSchema} from '@loaders.gl/parquet';

// tslint:disable:ter-prefer-arrow-callback

test('ParquetSchema#should assign correct defaults in a simple flat schema', assert => {
  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    quantity: { type: 'INT64' },
    price: { type: 'DOUBLE' },
  });

  assert.equal(schema.fieldList.length, 3);
  assert.ok(schema.fields.name);
  assert.ok(schema.fields.quantity);
  assert.ok(schema.fields.price);

  {
    const field = schema.fields.name;
    assert.equal(field?.name, 'name');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['name']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.quantity;
    assert.equal(field?.name, 'quantity');
    assert.equal(field?.primitiveType, 'INT64');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['quantity']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.price;
    assert.equal(field?.name, 'price');
    assert.equal(field?.primitiveType, 'DOUBLE');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['price']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }


  assert.end();
});

test('ParquetSchema#should assign correct defaults in a flat schema with optional fieldList', assert => {
  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    quantity: { type: 'INT64', optional: true },
    price: { type: 'DOUBLE' },
  });

  assert.equal(schema.fieldList.length, 3);
  assert.ok(schema.fields.name);
  assert.ok(schema.fields.quantity);
  assert.ok(schema.fields.price);

  {
    const field = schema.fields.name;
    assert.equal(field?.name, 'name');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['name']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.quantity;
    assert.equal(field?.name, 'quantity');
    assert.equal(field?.primitiveType, 'INT64');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['quantity']);
    assert.equal(field?.repetitionType, 'OPTIONAL');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 1);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.price;
    assert.equal(field?.name, 'price');
    assert.equal(field?.primitiveType, 'DOUBLE');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['price']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  assert.end();
});

test('ParquetSchema#should assign correct defaults in a flat schema with repeated fieldList', assert => {
  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    quantity: { type: 'INT64', repeated: true },
    price: { type: 'DOUBLE' },
  });

  assert.equal(schema.fieldList.length, 3);
  assert.ok(schema.fields.name);
  assert.ok(schema.fields.quantity);
  assert.ok(schema.fields.price);

  {
    const field = schema.fields.name;
    assert.equal(field?.name, 'name');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['name']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.quantity;
    assert.equal(field?.name, 'quantity');
    assert.equal(field?.primitiveType, 'INT64');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['quantity']);
    assert.equal(field?.repetitionType, 'REPEATED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 1);
    assert.equal(field?.dLevelMax, 1);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.price;
    assert.equal(field?.name, 'price');
    assert.equal(field?.primitiveType, 'DOUBLE');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['price']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  assert.end();
});

test('ParquetSchema#should assign correct defaults in a nested schema without repetition modifiers', assert => {
  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    stock: {
      fields: {
        quantity: { type: 'INT64' },
        warehouse: { type: 'UTF8' },
      }
    },
    price: { type: 'DOUBLE' },
  });

  assert.equal(schema.fieldList.length, 5);
  assert.ok(schema.fields.name);
  assert.ok(schema.fields.stock);
  assert.ok(schema.fields.stock.fields?.quantity);
  assert.ok(schema.fields.stock.fields?.warehouse);
  assert.ok(schema.fields.price);

  {
    const field = schema.fields.name;
    assert.equal(field?.name, 'name');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['name']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock;
    assert.equal(field?.name, 'stock');
    assert.equal(field?.primitiveType, undefined);
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['stock']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, undefined);
    assert.equal(field?.compression, undefined);
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), true);
    assert.equal(field?.fieldCount, 2);
  }

  {
    const field = schema.fields.stock.fields?.quantity;
    assert.equal(field?.name, 'quantity');
    assert.equal(field?.primitiveType, 'INT64');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['stock', 'quantity']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock.fields?.warehouse;
    assert.equal(field?.name, 'warehouse');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['stock', 'warehouse']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.price;
    assert.equal(field?.name, 'price');
    assert.equal(field?.primitiveType, 'DOUBLE');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['price']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  assert.end();
});

test('ParquetSchema#should assign correct defaults in a nested schema with optional fields', assert => {
  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    stock: {
      optional: true,
      fields: {
        quantity: { type: 'INT64', optional: true },
        warehouse: { type: 'UTF8' },
      }
    },
    price: { type: 'DOUBLE' },
  });

  assert.equal(schema.fieldList.length, 5);
  assert.ok(schema.fields.name);
  assert.ok(schema.fields.stock);
  assert.ok(schema.fields.stock.fields?.quantity);
  assert.ok(schema.fields.stock.fields?.warehouse);
  assert.ok(schema.fields.price);

  {
    const field = schema.fields.name;
    assert.equal(field?.name, 'name');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['name']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock;
    assert.equal(field?.name, 'stock');
    assert.equal(field?.primitiveType, undefined);
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['stock']);
    assert.equal(field?.repetitionType, 'OPTIONAL');
    assert.equal(field?.encoding, undefined);
    assert.equal(field?.compression, undefined);
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 1);
    assert.equal(Boolean(field?.isNested), true);
    assert.equal(field?.fieldCount, 2);
  }

  {
    const field = schema.fields.stock.fields?.quantity;
    assert.equal(field?.name, 'quantity');
    assert.equal(field?.primitiveType, 'INT64');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['stock', 'quantity']);
    assert.equal(field?.repetitionType, 'OPTIONAL');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 2);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock.fields?.warehouse;
    assert.equal(field?.name, 'warehouse');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['stock', 'warehouse']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 1);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.price;
    assert.equal(field?.name, 'price');
    assert.equal(field?.primitiveType, 'DOUBLE');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['price']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  assert.end();
});

test('ParquetSchema#should assign correct defaults in a nested schema with repeated fields', assert => {
  const schema = new ParquetSchema({
    name: { type: 'UTF8' },
    stock: {
      repeated: true,
      fields: {
        quantity: { type: 'INT64', optional: true },
        warehouse: { type: 'UTF8' },
      }
    },
    price: { type: 'DOUBLE' },
  });

  assert.equal(schema.fieldList.length, 5);
  assert.ok(schema.fields.name);
  assert.ok(schema.fields.stock);
  assert.ok(schema.fields.stock.fields?.quantity);
  assert.ok(schema.fields.stock.fields?.warehouse);
  assert.ok(schema.fields.price);

  {
    const field = schema.fields.name;
    assert.equal(field?.name, 'name');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['name']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock;
    assert.equal(field?.name, 'stock');
    assert.equal(field?.primitiveType, undefined);
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['stock']);
    assert.equal(field?.repetitionType, 'REPEATED');
    assert.equal(field?.encoding, undefined);
    assert.equal(field?.compression, undefined);
    assert.equal(field?.rLevelMax, 1);
    assert.equal(field?.dLevelMax, 1);
    assert.equal(Boolean(field?.isNested), true);
    assert.equal(field?.fieldCount, 2);
  }

  {
    const field = schema.fields.stock.fields?.quantity;
    assert.equal(field?.name, 'quantity');
    assert.equal(field?.primitiveType, 'INT64');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['stock', 'quantity']);
    assert.equal(field?.repetitionType, 'OPTIONAL');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 1);
    assert.equal(field?.dLevelMax, 2);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.stock.fields?.warehouse;
    assert.equal(field?.name, 'warehouse');
    assert.equal(field?.primitiveType, 'BYTE_ARRAY');
    assert.equal(field?.originalType, 'UTF8');
    assert.deepEqual(field?.path, ['stock', 'warehouse']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 1);
    assert.equal(field?.dLevelMax, 1);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  {
    const field = schema.fields.price;
    assert.equal(field?.name, 'price');
    assert.equal(field?.primitiveType, 'DOUBLE');
    assert.equal(field?.originalType, undefined);
    assert.deepEqual(field?.path, ['price']);
    assert.equal(field?.repetitionType, 'REQUIRED');
    assert.equal(field?.encoding, 'PLAIN');
    assert.equal(field?.compression, 'UNCOMPRESSED');
    assert.equal(field?.rLevelMax, 0);
    assert.equal(field?.dLevelMax, 0);
    assert.equal(Boolean(field?.isNested), false);
    assert.equal(field?.fieldCount, undefined);
  }

  assert.end();
});

test.skip('ParquetSchema#should convert to arrow schema', assert => {
  const parquetSchema = new ParquetSchema({
    name: { type: 'UTF8' },
    stock: {
      repeated: true,
      fields: {
        quantity: { type: 'INT64', optional: true },
        warehouse: { type: 'UTF8' },
      }
    },
    price: { type: 'DOUBLE' }
  });

  const schema = convertParquetSchema(parquetSchema, null);

  assert.ok(schema.fields[0].name === 'name', 'field name set');
  assert.ok(!schema.fields[0].nullable, 'field.nullable correct');
  assert.equal(schema.fields[0]?.metadata?.encoding, 'PLAIN', 'metadata set');

  assert.ok(schema.fields[1]);
  // @ts-ignore
  assert.ok(schema.fields[1].type.children);
  // @ts-ignore
  assert.equal(schema.fields[1].type.children.length, 2);
  // @ts-ignore
  assert.equal(schema.fields[1].type.children[0].name, 'quantity');
  // @ts-ignore
  assert.equal(schema.fields[1].type.children[1].name, 'warehouse');

  assert.end();
});
