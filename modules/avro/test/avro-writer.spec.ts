// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import { load } from '@loaders.gl/core';
import { expect, test } from "vitest";
import { AvroLoaderWithParser } from '../src/avro-loader';
import { AvroLoader } from '../src/avro-loader-types';
import { AvroWriter } from '../src/avro-writer';
import { encodeAvroInChunks } from '../src/avro-stream';
import { getAvroSchemaFingerprint } from '../src/lib/parsers/parse-avro';
import { parseAvroOCF } from '../src/avro-ocf';
test('AvroWriter#encode round-trips an Arrow table', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({ id: [1, 2], name: ['one', 'two'] })
    };
    const output = await AvroWriter.encode(input);
    const result = await AvroLoaderWithParser.parse(output);
    expect(result.shape).toBe('arrow-table');
    if (result.shape === 'arrow-table') {
        expect(result.data.numRows).toBe(2);
        expect(JSON.stringify(Array.from(result.data.getChild('id')?.toArray() || []))).toBe('[1,2]');
        expect(JSON.stringify(Array.from(result.data.getChild('name')?.toArray() || []))).toBe('["one","two"]');
    }
});
test('AvroWriter#encode supports an explicit nullable schema', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({ value: [1, null] })
    };
    const output = await AvroWriter.encode(input, {
        avro: {
            schema: {
                type: 'record',
                name: 'Values',
                fields: [{ name: 'value', type: ['null', 'int'] }]
            }
        }
    });
    const result = await AvroLoaderWithParser.parse(output);
    expect(result.shape).toBe('arrow-table');
    if (result.shape === 'arrow-table')
        expect(result.data.toArray().map(row => row.toJSON())).toEqual([{ value: 1 }, { value: null }]);
});
test('AvroWriter#encode writes a single-object datum', async () => {
    const schema = {
        type: 'record',
        name: 'SingleValue',
        fields: [{ name: 'id', type: 'int' }]
    } as const;
    const output = await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [42] }) }, { avro: { schema, encoding: 'single-object' } });
    const result = await AvroLoaderWithParser.parse(output, { avro: { schema } });
    if (result.shape === 'arrow-table')
        expect(result.data.toArray().map(row => row.toJSON())).toEqual([{ id: 42 }]);
    await await expect(AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [1, 2] }) }, { avro: { schema, encoding: 'single-object' } })).rejects.toThrow(/exactly one table row/);
});
test('AvroWriter#encode writes raw Avro records', async () => {
    const schema = {
        type: 'record',
        name: 'RawValue',
        fields: [{ name: 'id', type: 'int' }]
    } as const;
    const output = await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [7] }) }, { avro: { schema, encoding: 'raw' } });
    const result = await AvroLoaderWithParser.parse(output, { avro: { schema, encoding: 'raw' } });
    if (result.shape === 'arrow-table')
        expect(result.data.toArray().map(row => row.toJSON())).toEqual([{ id: 7 }]);
});
test('AvroWriter#encode supports named records and logical timestamps', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({
            user: [{ id: 7, name: 'Ada' }],
            created: [new Date(1700000000000)]
        })
    };
    const output = await AvroWriter.encode(input, {
        avro: {
            schema: {
                type: 'record',
                name: 'Event',
                fields: [
                    {
                        name: 'user',
                        type: {
                            type: 'record',
                            name: 'User',
                            fields: [
                                { name: 'id', type: 'int' },
                                { name: 'name', type: 'string' }
                            ]
                        }
                    },
                    { name: 'created', type: { type: 'long', logicalType: 'timestamp-millis' } }
                ]
            }
        }
    });
    const result = await AvroLoaderWithParser.parse(output);
    expect(result.shape).toBe('arrow-table');
    if (result.shape === 'arrow-table') {
        expect(result.data.getChild('user')?.get(0)?.id).toBe(7);
        expect(result.data.getChild('user')?.get(0)?.name).toBe('Ada');
        expect(result.data.getChild('created')?.get(0)).toBe(1700000000000);
    }
});
test('AvroWriter#encode supports Avro time and local timestamp logical types', async () => {
    const output = await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ time: [11045678000], local: [1234] }) }, {
        avro: {
            schema: {
                type: 'record',
                name: 'Times',
                fields: [
                    { name: 'time', type: { type: 'long', logicalType: 'time-micros' } },
                    { name: 'local', type: { type: 'long', logicalType: 'local-timestamp-micros' } }
                ]
            }
        }
    });
    const result = await AvroLoaderWithParser.parse(output);
    if (result.shape === 'arrow-table') {
        expect(result.data.getChild('time')?.get(0)).toBe(11045678000);
        expect(result.data.getChild('local')?.get(0)).toBe(1234);
    }
});
test('AvroWriter#encode round-trips decimal bytes logical types', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({ amount: [12.34, -5.67] })
    };
    const output = await AvroWriter.encode(input, {
        avro: {
            schema: {
                type: 'record',
                name: 'Amounts',
                fields: [
                    { name: 'amount', type: { type: 'bytes', logicalType: 'decimal', precision: 9, scale: 2 } }
                ]
            }
        }
    });
    const result = await AvroLoaderWithParser.parse(output);
    if (result.shape === 'arrow-table')
        expect(result.data.toArray().map(row => row.toJSON())).toEqual([{ amount: 12.34 }, { amount: -5.67 }]);
});
test('AvroWriter#encode round-trips scalable big-decimal values', async () => {
    const schema = {
        type: 'record',
        name: 'BigAmounts',
        fields: [{ name: 'amount', type: { type: 'bytes', logicalType: 'big-decimal' } }]
    } as const;
    const output = await AvroWriter.encode({
        shape: 'arrow-table',
        data: arrow.tableFromArrays({ amount: [{ value: '12345678901234567890.12', scale: 2 }] })
    }, { avro: { schema } });
    const result = await AvroLoaderWithParser.parse(output);
    if (result.shape === 'arrow-table') {
        const row = result.data.toArray()[0] as any;
        expect(row.amount.value).toBe(12345678901234567000);
        expect(row.amount.scale).toBe(2);
    }
});
test('AvroWriter#encode round-trips UUID and duration logical types', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({
            identifier: ['550e8400-e29b-41d4-a716-446655440000'],
            elapsed: [{ months: 2, days: 3, milliseconds: 4000 }]
        })
    };
    const output = await AvroWriter.encode(input, {
        avro: {
            schema: {
                type: 'record',
                name: 'LogicalValues',
                fields: [
                    { name: 'identifier', type: { type: 'string', logicalType: 'uuid' } },
                    { name: 'elapsed', type: { type: 'fixed', name: 'Duration', size: 12, logicalType: 'duration' } }
                ]
            }
        }
    });
    const result = await AvroLoaderWithParser.parse(output);
    if (result.shape === 'arrow-table') {
        const row = result.data.toArray()[0] as any;
        expect(row.identifier).toBe('550e8400-e29b-41d4-a716-446655440000');
        expect(row.elapsed.months).toBe(2);
        expect(row.elapsed.days).toBe(3);
        expect(row.elapsed.milliseconds).toBe(4000);
    }
});
test('AvroWriter#encode supports recursive named schemas', async () => {
    const nodeSchema = {
        type: 'record',
        name: 'Node',
        fields: [
            { name: 'value', type: 'int' },
            { name: 'next', type: ['null', 'Node'] }
        ]
    };
    const output = await AvroWriter.encode({
        shape: 'arrow-table',
        data: arrow.tableFromArrays({
            node: [{ value: 1, next: { value: 2, next: null } }]
        })
    }, { avro: { schema: { type: 'record', name: 'Envelope', fields: [{ name: 'node', type: nodeSchema }] } } });
    const result = await AvroLoaderWithParser.parse(output);
    if (result.shape === 'arrow-table') {
        const row = result.data.toArray()[0] as any;
        expect(row.node.value).toBe(1);
        expect(row.node.next.value).toBe(2);
        expect(row.node.next.next).toBeUndefined();
    }
});
test('AvroWriter#encode writes compressed multi-block files', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({ id: [1, 2, 3], name: ['alpha', 'beta', 'gamma'] })
    };
    const output = await AvroWriter.encode(input, { avro: { codec: 'deflate', blockSize: 1 } });
    const result = await AvroLoaderWithParser.parse(output);
    expect(result.shape).toBe('arrow-table');
    if (result.shape === 'arrow-table') {
        expect(result.data.numRows).toBe(3);
        expect(result.data.getChild('id')?.get(2)).toBe(3);
        expect(result.data.getChild('name')?.get(1)).toBe('beta');
    }
});
test('Avro OCF inspection exposes block offsets without decoding records', async () => {
    const output = await AvroWriter.encode({
        shape: 'arrow-table',
        data: arrow.tableFromArrays({ id: [1, 2, 3] })
    }, { avro: { blockSize: 1 } });
    const ocf = parseAvroOCF(output);
    expect(ocf.codec).toBe('null');
    expect(ocf.blocks.length).toBe(3);
    expect(ocf.blocks[0].count).toBe(1);
    expect(ocf.blocks[0].dataOffset < ocf.blocks[0].syncOffset).toBe(true);
    expect(ocf.blocks[1].offset > ocf.blocks[0].offset).toBe(true);
});
test('AvroWriter#encode writes custom OCF metadata', async () => {
    const output = await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [1] }) }, { avro: { metadata: { application: 'loaders.gl', binaryTag: new Uint8Array([1, 2, 3]) } } });
    const ocf = parseAvroOCF(output);
    expect(new TextDecoder().decode(ocf.metadata.get('application'))).toBe('loaders.gl');
    expect(ocf.metadata.get('binaryTag')).toEqual(new Uint8Array([1, 2, 3]));
    await await expect(AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [1] }) }, { avro: { metadata: { 'avro.codec': 'null' } } })).rejects.toThrow(/reserved/);
});
test('AvroLoader#parse selects indexed OCF blocks', async () => {
    const output = await AvroWriter.encode({
        shape: 'arrow-table',
        data: arrow.tableFromArrays({ id: new Int32Array([1, 2, 3]) })
    }, { avro: { blockSize: 1 } });
    const result = await AvroLoaderWithParser.parse(output, { avro: { blockIndices: [1] } });
    if (result.shape === 'arrow-table') {
        expect(result.data.numRows).toBe(1);
        expect(result.data.getChild('id')?.get(0)).toBe(2);
    }
});
test('AvroLoader#parseInBatchesFromUrl uses HTTP byte ranges', async () => {
    const output = new Uint8Array(await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [1, 2, 3] }) }, { avro: { blockSize: 1 } }));
    const originalFetch = globalThis.fetch;
    const ranges: string[] = [];
    globalThis.fetch = async (_input, init) => {
        const range = new Headers(init?.headers).get('Range') || '';
        ranges.push(range);
        const match = /^bytes=(\d+)-(\d+)$/.exec(range);
        if (!match)
            return new Response(output);
        const start = Number(match[1]);
        const end = Math.min(Number(match[2]), output.length - 1);
        if (start >= output.length)
            return new Response(null, { status: 416 });
        return new Response(output.slice(start, end + 1), {
            status: 206,
            headers: { 'Content-Range': `bytes ${start}-${end}/${output.length}` }
        });
    };
    try {
        const batches = [];
        for await (const batch of AvroLoaderWithParser.parseInBatchesFromUrl('https://example.test/data.avro', {
            avro: { batchSize: 2 }
        }))
            batches.push(batch);
        expect(batches.map(batch => batch.length)).toEqual([2, 1]);
        expect(ranges.length > 2).toBe(true);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('core load routes URL-backed Avro files through random-access parsing', async () => {
    const output = new Uint8Array(await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [9] }) }));
    const originalFetch = globalThis.fetch;
    const ranges: string[] = [];
    const fetchFunction = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const range = new Headers(init?.headers).get('Range') || '';
        ranges.push(range);
        const match = /^bytes=(\d+)-(\d+)$/.exec(range);
        if (!match)
            return new Response(output);
        const start = Number(match[1]);
        const end = Math.min(Number(match[2]), output.length - 1);
        return new Response(output.slice(start, end + 1), {
            status: 206,
            headers: { 'Content-Range': `bytes ${start}-${end}/${output.length}` }
        });
    };
    globalThis.fetch = fetchFunction;
    try {
        const result = await load('https://example.test/data.avro', AvroLoader, {
            fetch: fetchFunction
        });
        if (result.shape === 'arrow-table')
            expect(result.data.getChild('id')?.get(0)).toBe(9);
        expect(ranges.length > 0).toBe(true);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('encodeAvroInChunks emits a parseable OCF incrementally', async () => {
    const chunks: Uint8Array[] = [];
    for await (const chunk of encodeAvroInChunks({ shape: 'arrow-table', data: arrow.tableFromArrays({ id: [1, 2, 3] }) }, { avro: { blockSize: 1 } }))
        chunks.push(chunk);
    const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    const result = await AvroLoaderWithParser.parse(bytes.buffer);
    if (result.shape === 'arrow-table')
        expect(result.data.toArray().map(row => row.toJSON())).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(chunks.length).toBe(4);
});
test('AvroLoader#parseInBatches yields Arrow batches', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({ id: [1, 2, 3], name: ['alpha', 'beta', 'gamma'] })
    };
    const output = await AvroWriter.encode(input);
    const batches = [];
    for await (const batch of AvroLoaderWithParser.parseInBatches([output], { avro: { batchSize: 2 } })) {
        batches.push(batch);
    }
    expect(batches.length).toBe(2);
    expect(batches[0].length).toBe(2);
    expect(batches[1].length).toBe(1);
    expect(batches[1].data.getChild('id')?.get(0)).toBe(3);
});
test('AvroLoader#parse applies reader-schema projection, aliases, and defaults', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({ id: new Int32Array([7]), name: ['Ada'], ignored: ['drop me'] })
    };
    const output = await AvroWriter.encode(input);
    const result = await AvroLoaderWithParser.parse(output, {
        avro: {
            readerSchema: {
                type: 'record',
                name: 'ReaderEvent',
                aliases: ['ArrowRecord'],
                fields: [
                    { name: 'id', type: 'long' },
                    { name: 'label', aliases: ['name'], type: 'string' },
                    { name: 'extra', type: ['string', 'null'], default: 'new' }
                ]
            }
        }
    });
    expect(result.shape).toBe('arrow-table');
    if (result.shape === 'arrow-table') {
        expect(result.data.getChild('id')?.get(0)).toBe(7);
        expect(result.data.getChild('label')?.get(0)).toBe('Ada');
        expect(result.data.getChild('extra')?.get(0)).toBe('new');
        expect(result.data.getChild('ignored')).toBe(null);
    }
});
test('AvroLoader#parse applies numeric promotions and rejects incompatible types', async () => {
    const output = await AvroWriter.encode({
        shape: 'arrow-table',
        data: arrow.tableFromArrays({ id: new Int32Array([7]) })
    });
    const promoted = await AvroLoaderWithParser.parse(output, {
        avro: { readerSchema: { type: 'record', name: 'Promoted', aliases: ['ArrowRecord'], fields: [{ name: 'id', type: 'double' }] } }
    });
    if (promoted.shape === 'arrow-table')
        expect(promoted.data.getChild('id')?.get(0)).toBe(7);
    const union = await AvroLoaderWithParser.parse(output, {
        avro: {
            readerSchema: {
                type: 'record',
                name: 'UnionReader',
                aliases: ['ArrowRecord'],
                fields: [{ name: 'id', type: ['null', 'double', 'string'] }]
            }
        }
    });
    if (union.shape === 'arrow-table')
        expect(union.data.getChild('id')?.get(0)).toBe(7);
    await await expect(AvroLoaderWithParser.parse(output, {
        avro: { readerSchema: { type: 'record', name: 'Invalid', aliases: ['ArrowRecord'], fields: [{ name: 'id', type: 'string' }] } }
    })).rejects.toThrow(/cannot promote int to string/);
});
test('AvroLoader#parse validates record, enum, and fixed compatibility', async () => {
    const recordOutput = await AvroWriter.encode({
        shape: 'arrow-table',
        data: arrow.tableFromArrays({ id: new Int32Array([1]) })
    });
    await await expect(AvroLoaderWithParser.parse(recordOutput, {
        avro: { readerSchema: { type: 'record', name: 'OtherRecord', fields: [{ name: 'id', type: 'int' }] } }
    })).rejects.toThrow(/record names/);
    const enumSchema = {
        type: 'record',
        name: 'EnumRecord',
        fields: [{ name: 'kind', type: { type: 'enum', name: 'Kind', symbols: ['A'] } }]
    };
    const enumOutput = await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ kind: ['A'] }) }, { avro: { schema: enumSchema } });
    await await expect(AvroLoaderWithParser.parse(enumOutput, {
        avro: {
            readerSchema: {
                type: 'record',
                name: 'EnumRecord',
                fields: [{ name: 'kind', type: { type: 'enum', name: 'Kind', symbols: ['B'] } }]
            }
        }
    })).rejects.toThrow(/enum symbol/);
    const fixedSchema = {
        type: 'record',
        name: 'FixedRecord',
        fields: [
            {
                name: 'value',
                type: { type: 'fixed', name: 'Value', size: 2, logicalType: 'decimal', precision: 4, scale: 2 }
            }
        ]
    };
    const fixedOutput = await AvroWriter.encode({ shape: 'arrow-table', data: arrow.tableFromArrays({ value: [1.23] }) }, { avro: { schema: fixedSchema } });
    await await expect(AvroLoaderWithParser.parse(fixedOutput, {
        avro: {
            readerSchema: {
                type: 'record',
                name: 'FixedRecord',
                fields: [
                    {
                        name: 'value',
                        type: { type: 'fixed', name: 'Value', size: 3, logicalType: 'decimal', precision: 6, scale: 2 }
                    }
                ]
            }
        }
    })).rejects.toThrow(/fixed schemas/);
});
test('Avro long values support exact bigint round trips', async () => {
    const input = {
        shape: 'arrow-table' as const,
        data: arrow.tableFromArrays({ id: [9007199254740993n] })
    };
    const output = await AvroWriter.encode(input);
    const result = await AvroLoaderWithParser.parse(output, { avro: { longType: 'bigint' } });
    expect(result.shape).toBe('arrow-table');
    if (result.shape === 'arrow-table')
        expect(result.data.getChild('id')?.get(0)).toBe(9007199254740993n);
});
test('AvroLoader#parse supports raw and single-object encodings', async () => {
    const schema = {
        type: 'record',
        name: 'Person',
        fields: [
            { name: 'id', type: 'int' },
            { name: 'name', type: 'string' }
        ]
    };
    const raw = Uint8Array.from([14, 6, 65, 100, 97]);
    const fingerprint = new Uint8Array(8);
    new DataView(fingerprint.buffer).setBigUint64(0, getAvroSchemaFingerprint(schema), true);
    const singleObject = Uint8Array.from([0xc3, 0x01, ...fingerprint, ...raw]);
    for (const bytes of [raw, singleObject]) {
        const result = await AvroLoaderWithParser.parse(bytes.buffer, {
            avro: { schema }
        });
        expect(result.shape).toBe('arrow-table');
        if (result.shape === 'arrow-table') {
            expect(result.data.getChild('id')?.get(0)).toBe(7);
            expect(result.data.getChild('name')?.get(0)).toBe('Ada');
        }
    }
});
