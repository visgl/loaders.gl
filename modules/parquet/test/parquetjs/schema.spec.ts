// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { expect, test } from "vitest";
import { ParquetSchema, convertParquetSchema } from '@loaders.gl/parquet';
// tslint:disable:ter-prefer-arrow-callback
test('ParquetSchema#should assign correct defaults in a simple flat schema', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        quantity: { type: 'INT64' },
        price: { type: 'DOUBLE' },
    });
    expect(schema.fieldList.length).toBe(3);
    expect(schema.fields.name).toBeTruthy();
    expect(schema.fields.quantity).toBeTruthy();
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
        const field = schema.fields.quantity;
        expect(field?.name).toBe('quantity');
        expect(field?.primitiveType).toBe('INT64');
        expect(field?.originalType).toBe(undefined);
        expect(field?.path).toEqual(['quantity']);
        expect(field?.repetitionType).toBe('REQUIRED');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(0);
        expect(field?.dLevelMax).toBe(0);
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
});
test('ParquetSchema#should assign correct defaults in a flat schema with optional fieldList', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        quantity: { type: 'INT64', optional: true },
        price: { type: 'DOUBLE' },
    });
    expect(schema.fieldList.length).toBe(3);
    expect(schema.fields.name).toBeTruthy();
    expect(schema.fields.quantity).toBeTruthy();
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
        const field = schema.fields.quantity;
        expect(field?.name).toBe('quantity');
        expect(field?.primitiveType).toBe('INT64');
        expect(field?.originalType).toBe(undefined);
        expect(field?.path).toEqual(['quantity']);
        expect(field?.repetitionType).toBe('OPTIONAL');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(0);
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
});
test('ParquetSchema#should assign correct defaults in a flat schema with repeated fieldList', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        quantity: { type: 'INT64', repeated: true },
        price: { type: 'DOUBLE' },
    });
    expect(schema.fieldList.length).toBe(3);
    expect(schema.fields.name).toBeTruthy();
    expect(schema.fields.quantity).toBeTruthy();
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
        const field = schema.fields.quantity;
        expect(field?.name).toBe('quantity');
        expect(field?.primitiveType).toBe('INT64');
        expect(field?.originalType).toBe(undefined);
        expect(field?.path).toEqual(['quantity']);
        expect(field?.repetitionType).toBe('REPEATED');
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
});
test('ParquetSchema#should assign correct defaults in a nested schema without repetition modifiers', () => {
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
    expect(schema.fieldList.length).toBe(5);
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
        expect(field?.repetitionType).toBe('REQUIRED');
        expect(field?.encoding).toBe(undefined);
        expect(field?.compression).toBe(undefined);
        expect(field?.rLevelMax).toBe(0);
        expect(field?.dLevelMax).toBe(0);
        expect(Boolean(field?.isNested)).toBe(true);
        expect(field?.fieldCount).toBe(2);
    }
    {
        const field = schema.fields.stock.fields?.quantity;
        expect(field?.name).toBe('quantity');
        expect(field?.primitiveType).toBe('INT64');
        expect(field?.originalType).toBe(undefined);
        expect(field?.path).toEqual(['stock', 'quantity']);
        expect(field?.repetitionType).toBe('REQUIRED');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(0);
        expect(field?.dLevelMax).toBe(0);
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
        expect(field?.rLevelMax).toBe(0);
        expect(field?.dLevelMax).toBe(0);
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
});
test('ParquetSchema#should assign correct defaults in a nested schema with optional fields', () => {
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
    expect(schema.fieldList.length).toBe(5);
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
        expect(field?.repetitionType).toBe('OPTIONAL');
        expect(field?.encoding).toBe(undefined);
        expect(field?.compression).toBe(undefined);
        expect(field?.rLevelMax).toBe(0);
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
        expect(field?.repetitionType).toBe('OPTIONAL');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(0);
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
        expect(field?.rLevelMax).toBe(0);
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
});
test('ParquetSchema#should assign correct defaults in a nested schema with repeated fields', () => {
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
    expect(schema.fieldList.length).toBe(5);
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
        expect(field?.repetitionType).toBe('OPTIONAL');
        expect(field?.encoding).toBe('PLAIN');
        expect(field?.compression).toBe('UNCOMPRESSED');
        expect(field?.rLevelMax).toBe(1);
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
});
test.skip('ParquetSchema#should convert to arrow schema', () => {
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
    expect(schema.fields[0].name === 'name', 'field name set').toBeTruthy();
    expect(!schema.fields[0].nullable, 'field.nullable correct').toBeTruthy();
    expect(schema.fields[0]?.metadata?.encoding, 'metadata set').toBe('PLAIN');
    expect(schema.fields[1]).toBeTruthy();
    // @ts-ignore
    expect(schema.fields[1].type.children).toBeTruthy();
    // @ts-ignore
    expect(schema.fields[1].type.children.length).toBe(2);
    // @ts-ignore
    expect(schema.fields[1].type.children[0].name).toBe('quantity');
    // @ts-ignore
    expect(schema.fields[1].type.children[1].name).toBe('warehouse');
});
