// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import {AvroSchemaLoaderWithParser} from '../src/avro-schema-loader';
import { getAvroSchemaFingerprint } from '../src/lib/parsers/parse-avro';
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
    await expect(AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify({ type: 'record', name: 'Broken', fields: [{ name: 'missing-type' }] })).buffer)).rejects.toThrow(/Invalid Avro schema/);
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
    await expect(AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify({
        type: 'record',
        name: 'InvalidDefaults',
        fields: [{ name: 'value', type: ['null', 'string'], default: 'not-null' }]
    })).buffer)).rejects.toThrow(/default.*expected null/);
});

test('AvroSchemaLoader#parse accepts recursive named schemas and rejects invalid unions', async () => {
    const recursiveSchema = {
        type: 'record',
        name: 'Node',
        fields: [
            { name: 'value', type: 'long' },
            { name: 'next', type: ['null', 'Node'], default: null }
        ]
    };
    await expect(AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify(recursiveSchema)).buffer)).resolves.toMatchObject({ name: 'Node' });
    await expect(AvroSchemaLoaderWithParser.parse(new TextEncoder().encode(JSON.stringify({
        type: 'record',
        name: 'InvalidUnion',
        fields: [{ name: 'value', type: [] }]
    })).buffer)).rejects.toThrow(/Invalid Avro schema/);
});

test('Avro schema fingerprints use canonical field order and named references', () => {
    const first = {
        type: 'record',
        name: 'Fingerprint',
        namespace: 'example',
        fields: [{ name: 'id', type: 'long' }, { name: 'name', type: 'string' }]
    };
    const reorderedProperties = {
        fields: [{ type: 'long', name: 'id' }, { type: 'string', name: 'name' }],
        namespace: 'example',
        name: 'Fingerprint',
        type: 'record'
    };
    expect(getAvroSchemaFingerprint(first)).toBe(getAvroSchemaFingerprint(reorderedProperties));
    expect(getAvroSchemaFingerprint({...first, name: 'Other'})).not.toBe(getAvroSchemaFingerprint(first));
});
