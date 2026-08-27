import { expect, test } from "vitest";
import { ParquetSchema } from '@loaders.gl/parquet';
import { ParquetRowGroup, shredRecord, materializeColumns, materializeRows } from '@loaders.gl/parquet/parquetjs/schema/shred';
const TEXT_DECODER = new TextDecoder();
function bytes(values: number[]): Uint8Array {
    return new Uint8Array(values);
}
function decodeValues(values: Uint8Array[]): string[] {
    return values.map(value => TEXT_DECODER.decode(value));
}
test('ParquetShredder#should shred a single simple record', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        quantity: { type: 'INT64' },
        price: { type: 'DOUBLE' },
    });
    const buf = new ParquetRowGroup();
    {
        const rec = { name: 'apple', quantity: 10, price: 23.5 };
        shredRecord(schema, rec, buf);
    }
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(1);
    expect(colData.name.dlevels).toEqual([0]);
    expect(colData.name.rlevels).toEqual([0]);
    expect(decodeValues(colData.name.values)).toEqual(['apple']);
    expect(colData.quantity.dlevels).toEqual([0]);
    expect(colData.quantity.rlevels).toEqual([0]);
    expect(colData.quantity.values).toEqual([10]);
    expect(colData.price.dlevels).toEqual([0]);
    expect(colData.price.rlevels).toEqual([0]);
    expect(colData.price.values).toEqual([23.5]);
});
test('ParquetShredder#should shred a list of simple records', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        quantity: { type: 'INT64' },
        price: { type: 'DOUBLE' },
    });
    const buf = new ParquetRowGroup();
    {
        const rec = { name: 'apple', quantity: 10, price: 23.5 };
        shredRecord(schema, rec, buf);
    }
    {
        const rec = { name: 'orange', quantity: 20, price: 17.1 };
        shredRecord(schema, rec, buf);
    }
    {
        const rec = { name: 'banana', quantity: 15, price: 42 };
        shredRecord(schema, rec, buf);
    }
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(3);
    expect(colData.name.dlevels).toEqual([0, 0, 0]);
    expect(colData.name.rlevels).toEqual([0, 0, 0]);
    expect(decodeValues(colData.name.values)).toEqual(['apple', 'orange', 'banana']);
    expect(colData.quantity.dlevels).toEqual([0, 0, 0]);
    expect(colData.quantity.rlevels).toEqual([0, 0, 0]);
    expect(colData.quantity.values).toEqual([10, 20, 15]);
    expect(colData.price.dlevels).toEqual([0, 0, 0]);
    expect(colData.price.rlevels).toEqual([0, 0, 0]);
    expect(colData.price.values).toEqual([23.5, 17.1, 42]);
});
test('ParquetShredder#should shred a list of simple records with optional scalar fields', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        quantity: { type: 'INT64', optional: true },
        price: { type: 'DOUBLE' },
    });
    const buf = new ParquetRowGroup();
    const rec1 = { name: 'apple', quantity: 10, price: 23.5 };
    shredRecord(schema, rec1, buf);
    const rec2 = { name: 'orange', price: 17.1 };
    shredRecord(schema, rec2, buf);
    const rec3 = { name: 'banana', quantity: 15, price: 42 };
    shredRecord(schema, rec3, buf);
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(3);
    expect(colData.name.dlevels).toEqual([0, 0, 0]);
    expect(colData.name.rlevels).toEqual([0, 0, 0]);
    expect(decodeValues(colData.name.values)).toEqual(['apple', 'orange', 'banana']);
    expect(colData.quantity.dlevels).toEqual([1, 0, 1]);
    expect(colData.quantity.rlevels).toEqual([0, 0, 0]);
    expect(colData.quantity.values).toEqual([10, 15]);
    expect(colData.price.dlevels).toEqual([0, 0, 0]);
    expect(colData.price.rlevels).toEqual([0, 0, 0]);
    expect(colData.price.values).toEqual([23.5, 17.1, 42]);
});
test('ParquetShredder#materializes flat required, optional, and logical columns', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        quantity: { type: 'INT64', optional: true },
        price: { type: 'DOUBLE' }
    });
    const buffer = new ParquetRowGroup();
    shredRecord(schema, { name: 'apple', quantity: 10, price: 23.5 }, buffer);
    shredRecord(schema, { name: 'orange', price: 17.1 }, buffer);
    shredRecord(schema, { name: 'banana', quantity: 15, price: 42 }, buffer);
    expect(materializeRows(schema, buffer)).toEqual([
        { name: 'apple', quantity: 10, price: 23.5 },
        { name: 'orange', price: 17.1 },
        { name: 'banana', quantity: 15, price: 42 }
    ]);
    expect(materializeColumns(schema, buffer)).toEqual({
        name: ['apple', 'orange', 'banana'],
        quantity: [10, null, 15],
        price: [23.5, 17.1, 42]
    });
});
// eslint-disable-next-line max-statements
test('ParquetShredder#should shred a list of simple records with repeated scalar fields', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        colours: { type: 'UTF8', repeated: true },
        price: { type: 'DOUBLE' },
    });
    const rec1 = { name: 'apple', price: 23.5, colours: ['red', 'green'] };
    const buf = new ParquetRowGroup();
    shredRecord(schema, rec1, buf);
    const rec2 = { name: 'orange', price: 17.1, colours: ['orange'] };
    shredRecord(schema, rec2, buf);
    const rec3 = { name: 'banana', price: 42, colours: ['yellow'] };
    shredRecord(schema, rec3, buf);
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(3);
    expect(colData.name.dlevels).toEqual([0, 0, 0]);
    expect(colData.name.rlevels).toEqual([0, 0, 0]);
    expect(decodeValues(colData.name.values)).toEqual(['apple', 'orange', 'banana']);
    expect(colData.name.count).toEqual(3);
    expect(colData.colours.dlevels).toEqual([1, 1, 1, 1]);
    expect(colData.colours.rlevels).toEqual([0, 1, 0, 0]);
    expect(decodeValues(colData.colours.values)).toEqual(['red', 'green', 'orange', 'yellow']);
    expect(colData.colours.count).toEqual(4);
    expect(colData.price.dlevels).toEqual([0, 0, 0]);
    expect(colData.price.rlevels).toEqual([0, 0, 0]);
    expect(colData.price.values).toEqual([23.5, 17.1, 42]);
    expect(colData.price.count).toEqual(3);
});
test('ParquetShredder#should shred a nested record without repetition modifiers', () => {
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
    const buf = new ParquetRowGroup();
    const rec1 = { name: 'apple', stock: { quantity: 10, warehouse: 'A' }, price: 23.5 };
    shredRecord(schema, rec1, buf);
    const rec2 = { name: 'banana', stock: { quantity: 20, warehouse: 'B' }, price: 42.0 };
    shredRecord(schema, rec2, buf);
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(2);
    expect(colData[['name']].dlevels).toEqual([0, 0]);
    expect(colData[['name']].rlevels).toEqual([0, 0]);
    expect(decodeValues(colData[['name']].values)).toEqual(['apple', 'banana']);
    expect(colData[['stock', 'quantity']].dlevels).toEqual([0, 0]);
    expect(colData[['stock', 'quantity']].rlevels).toEqual([0, 0]);
    expect(colData[['stock', 'quantity']].values).toEqual([10, 20]);
    expect(colData[['stock', 'warehouse']].dlevels).toEqual([0, 0]);
    expect(colData[['stock', 'warehouse']].rlevels).toEqual([0, 0]);
    expect(decodeValues(colData[['stock', 'warehouse']].values)).toEqual(['A', 'B']);
    expect(colData[['price']].dlevels).toEqual([0, 0]);
    expect(colData[['price']].rlevels).toEqual([0, 0]);
    expect(colData[['price']].values).toEqual([23.5, 42.0]);
});
test('ParquetShredder#should shred a nested record with optional fields', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        stock: {
            fields: {
                quantity: { type: 'INT64', optional: true },
                warehouse: { type: 'UTF8' },
            }
        },
        price: { type: 'DOUBLE' },
    });
    const buf = new ParquetRowGroup();
    const rec1 = { name: 'apple', stock: { quantity: 10, warehouse: 'A' }, price: 23.5 };
    shredRecord(schema, rec1, buf);
    const rec2 = { name: 'banana', stock: { warehouse: 'B' }, price: 42.0 };
    shredRecord(schema, rec2, buf);
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(2);
    expect(colData[['name']].dlevels).toEqual([0, 0]);
    expect(colData[['stock', 'quantity']].rlevels).toEqual([0, 0]);
    expect(colData[['stock', 'quantity']].values).toEqual([10]);
    expect(colData[['stock', 'warehouse']].rlevels).toEqual([0, 0]);
    expect(decodeValues(colData[['stock', 'warehouse']].values)).toEqual(['A', 'B']);
    expect(colData[['price']].dlevels).toEqual([0, 0]);
    expect(colData[['price']].rlevels).toEqual([0, 0]);
    expect(colData[['price']].values).toEqual([23.5, 42.0]);
});
test('ParquetShredder#should shred a nested record with nested optional fields', () => {
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
    const buf = new ParquetRowGroup();
    const rec1 = { name: 'apple', stock: { quantity: 10, warehouse: 'A' }, price: 23.5 };
    shredRecord(schema, rec1, buf);
    const rec2 = { name: 'orange', price: 17.0 };
    shredRecord(schema, rec2, buf);
    const rec3 = { name: 'banana', stock: { warehouse: 'B' }, price: 42.0 };
    shredRecord(schema, rec3, buf);
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(3);
    expect(colData[['name']].dlevels).toEqual([0, 0, 0]);
    expect(decodeValues(colData[['name']].values)).toEqual(['apple', 'orange', 'banana']);
    expect(colData[['stock', 'quantity']].dlevels).toEqual([2, 0, 1]);
    expect(colData[['stock', 'quantity']].rlevels).toEqual([0, 0, 0]);
    expect(colData[['stock', 'quantity']].values).toEqual([10]);
    expect(colData[['stock', 'warehouse']].dlevels).toEqual([1, 0, 1]);
    expect(colData[['stock', 'warehouse']].rlevels).toEqual([0, 0, 0]);
    expect(decodeValues(colData[['stock', 'warehouse']].values)).toEqual(['A', 'B']);
    expect(colData[['price']].dlevels).toEqual([0, 0, 0]);
    expect(colData[['price']].rlevels).toEqual([0, 0, 0]);
    expect(colData[['price']].values).toEqual([23.5, 17.0, 42.0]);
});
test('ParquetShredder#should shred a nested record with repeated fields', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        stock: {
            fields: {
                quantity: { type: 'INT64', repeated: true },
                warehouse: { type: 'UTF8' },
            }
        },
        price: { type: 'DOUBLE' },
    });
    const buf = new ParquetRowGroup();
    const rec1 = { name: 'apple', stock: { quantity: 10, warehouse: 'A' }, price: 23.5 };
    shredRecord(schema, rec1, buf);
    const rec2 = { name: 'orange', stock: { quantity: [50, 75], warehouse: 'B' }, price: 17.0 };
    shredRecord(schema, rec2, buf);
    const rec3 = { name: 'banana', stock: { warehouse: 'C' }, price: 42.0 };
    shredRecord(schema, rec3, buf);
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(3);
    expect(colData[['name']].dlevels).toEqual([0, 0, 0]);
    expect(decodeValues(colData[['name']].values)).toEqual(['apple', 'orange', 'banana']);
    expect(colData[['stock', 'quantity']].dlevels).toEqual([1, 1, 1, 0]);
    expect(colData[['stock', 'quantity']].rlevels).toEqual([0, 0, 1, 0]);
    expect(colData[['stock', 'quantity']].values).toEqual([10, 50, 75]);
    expect(colData[['stock', 'warehouse']].dlevels).toEqual([0, 0, 0]);
    expect(colData[['stock', 'warehouse']].rlevels).toEqual([0, 0, 0]);
    expect(decodeValues(colData[['stock', 'warehouse']].values)).toEqual(['A', 'B', 'C']);
    expect(colData[['price']].dlevels).toEqual([0, 0, 0]);
    expect(colData[['price']].rlevels).toEqual([0, 0, 0]);
    expect(colData[['price']].values).toEqual([23.5, 17.0, 42.0]);
});
test('ParquetShredder#should shred a nested record with nested repeated fields', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        stock: {
            repeated: true,
            fields: {
                quantity: { type: 'INT64', repeated: true },
                warehouse: { type: 'UTF8' },
            }
        },
        price: { type: 'DOUBLE' },
    });
    const buf = new ParquetRowGroup();
    const rec1 = { name: 'apple', stock: [{ quantity: 10, warehouse: 'A' }, { quantity: 20, warehouse: 'B' }], price: 23.5 };
    shredRecord(schema, rec1, buf);
    const rec2 = { name: 'orange', stock: { quantity: [50, 75], warehouse: 'X' }, price: 17.0 };
    shredRecord(schema, rec2, buf);
    const rec3 = { name: 'kiwi', price: 99.0 };
    shredRecord(schema, rec3, buf);
    const rec4 = { name: 'banana', stock: { warehouse: 'C' }, price: 42.0 };
    shredRecord(schema, rec4, buf);
    const colData = buf.columnData;
    expect(buf.rowCount).toBe(4);
    expect(colData[['name']].dlevels).toEqual([0, 0, 0, 0]);
    expect(colData[['name']].rlevels).toEqual([0, 0, 0, 0]);
    expect(decodeValues(colData[['name']].values)).toEqual(['apple', 'orange', 'kiwi', 'banana']);
    expect(colData[['stock', 'quantity']].dlevels).toEqual([2, 2, 2, 2, 0, 1]);
    expect(colData[['stock', 'quantity']].rlevels).toEqual([0, 1, 0, 2, 0, 0]);
    expect(colData[['stock', 'quantity']].values).toEqual([10, 20, 50, 75]);
    expect(colData[['stock', 'warehouse']].dlevels).toEqual([1, 1, 1, 0, 1]);
    expect(colData[['stock', 'warehouse']].rlevels).toEqual([0, 1, 0, 0, 0]);
    expect(decodeValues(colData[['stock', 'warehouse']].values)).toEqual(['A', 'B', 'X', 'C']);
    expect(colData[['price']].dlevels).toEqual([0, 0, 0, 0]);
    expect(colData[['price']].rlevels).toEqual([0, 0, 0, 0]);
    expect(colData[['price']].values).toEqual([23.5, 17.0, 99.0, 42.0]);
});
test('ParquetShredder#should materialize a nested record with scalar repeated fields', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        price: { type: 'DOUBLE', repeated: true },
    });
    const buffer = {
        rowCount: 4,
        columnData: {}
    };
    buffer.columnData.name = {
        dlevels: [0, 0, 0, 0],
        rlevels: [0, 0, 0, 0],
        values: [
            bytes([97, 112, 112, 108, 101]),
            bytes([111, 114, 97, 110, 103, 101]),
            bytes([107, 105, 119, 105]),
            bytes([98, 97, 110, 97, 110, 97])
        ],
        count: 4
    };
    buffer.columnData.price = {
        dlevels: [1, 1, 1, 1, 1, 1],
        rlevels: [0, 0, 1, 0, 1, 0],
        values: [23.5, 17, 23, 99, 100, 42],
        count: 6
    };
    const records = materializeRows(schema, buffer);
    expect(records.length).toBe(4);
    expect(records[0]).toEqual({ name: 'apple', price: [23.5] });
    expect(records[1]).toEqual({ name: 'orange', price: [17, 23] });
    expect(records[2]).toEqual({ name: 'kiwi', price: [99, 100] });
    expect(records[3]).toEqual({ name: 'banana', price: [42] });
});
test('ParquetShredder#should materialize a nested record with nested repeated fields', () => {
    const schema = new ParquetSchema({
        name: { type: 'UTF8' },
        stock: {
            repeated: true,
            fields: {
                quantity: { type: 'INT64', repeated: true },
                warehouse: { type: 'UTF8' },
            }
        },
        price: { type: 'DOUBLE' },
    });
    const buffer = {
        rowCount: 4,
        columnData: {}
    };
    buffer.columnData.name = {
        dlevels: [0, 0, 0, 0],
        rlevels: [0, 0, 0, 0],
        values: [
            bytes([97, 112, 112, 108, 101]),
            bytes([111, 114, 97, 110, 103, 101]),
            bytes([107, 105, 119, 105]),
            bytes([98, 97, 110, 97, 110, 97])
        ],
        count: 4
    };
    buffer.columnData[['stock', 'quantity']] = {
        dlevels: [2, 2, 2, 2, 0, 1],
        rlevels: [0, 1, 0, 2, 0, 0],
        values: [10, 20, 50, 75],
        count: 6
    };
    buffer.columnData[['stock', 'warehouse']] = {
        dlevels: [1, 1, 1, 0, 1],
        rlevels: [0, 1, 0, 0, 0],
        values: [
            bytes([65]),
            bytes([66]),
            bytes([88]),
            bytes([67])
        ],
        count: 5
    };
    buffer.columnData.price = {
        dlevels: [0, 0, 0, 0],
        rlevels: [0, 0, 0, 0],
        values: [23.5, 17, 99, 42],
        count: 4
    };
    const records = materializeRows(schema, buffer);
    expect(records.length).toBe(4);
    expect(records[0]).toEqual({ name: 'apple', stock: [{ quantity: [10], warehouse: 'A' }, { quantity: [20], warehouse: 'B' }], price: 23.5 });
    expect(records[1]).toEqual({ name: 'orange', stock: [{ quantity: [50, 75], warehouse: 'X' }], price: 17.0 });
    expect(records[2]).toEqual({ name: 'kiwi', price: 99.0 });
    expect(records[3]).toEqual({ name: 'banana', stock: [{ warehouse: 'C' }], price: 42.0 });
});
test('ParquetShredder#should materialize a static nested record with blank optional value', () => {
    const schema = new ParquetSchema({
        fruit: {
            fields: {
                name: { type: 'UTF8' },
                colour: { type: 'UTF8', optional: true }
            }
        }
    });
    const buffer = {
        rowCount: 1,
        columnData: {}
    };
    buffer.columnData.fruit = {
        dlevels: [],
        rlevels: [],
        values: [],
        count: 0
    };
    buffer.columnData['fruit,name'] = {
        dlevels: [0],
        rlevels: [0],
        values: [
            bytes([97, 112, 112, 108, 101])
        ],
        count: 1
    };
    buffer.columnData['fruit,colour'] = {
        dlevels: [0],
        rlevels: [0],
        values: [],
        count: 1
    };
    const records = materializeRows(schema, buffer);
    expect(records.length).toBe(1);
    expect(records[0]).toEqual({ fruit: { name: 'apple' } });
});
