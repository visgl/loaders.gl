import { expect, test } from "vitest";
import { AvroSchemaLoaderWithParser } from '@loaders.gl/parquet/avro-schema-loader';
test('AvroSchemaLoader#parse validates standalone schemas', async () => {
    const schema = await AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify({
        type: 'record',
        name: 'Example',
        fields: [
            { name: 'id', type: 'long' },
            { name: 'label', type: ['null', 'string'] }
        ]
    })).buffer);
    expect((schema as {
        name: string;
    }).name).toBe('Example');
    await await expect(AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify({ type: 'record', name: 'Broken' })).buffer)).rejects.toThrow(/Invalid Avro schema/);
});
test('AvroSchemaLoader#parse validates defaults against field schemas', async () => {
    const valid = await AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify({
        type: 'record',
        name: 'Defaults',
        fields: [
            { name: 'value', type: ['null', 'string'], default: null },
            { name: 'items', type: { type: 'array', items: 'int' }, default: [] },
            { name: 'kind', type: { type: 'enum', name: 'Kind', symbols: ['A', 'B'] }, default: 'A' }
        ]
    })).buffer);
    expect((valid as {
        name: string;
    }).name).toBe('Defaults');
    await await expect(AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify({
        type: 'record',
        name: 'InvalidDefaults',
        fields: [{ name: 'value', type: ['null', 'string'], default: 'not-null' }]
    })).buffer)).rejects.toThrow(/default.*expected null/);
});
