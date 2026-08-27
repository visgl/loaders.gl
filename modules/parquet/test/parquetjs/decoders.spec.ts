import { expect, test } from "vitest";
import type Int64 from 'node-int64';
import { decodeDataPages } from '../../src/parquetjs/parser/decoders';
import type { ParquetReaderContext } from '../../src/parquetjs/schema/declare';
/** Minimal required-column context for page-assembly metadata tests. */
const TEST_CONTEXT: ParquetReaderContext = {
    type: 'INT32',
    rLevelMax: 0,
    dLevelMax: 0,
    compression: 'UNCOMPRESSED',
    column: {
        name: 'value',
        path: ['value'],
        key: 'value',
        primitiveType: 'INT32',
        repetitionType: 'REQUIRED',
        rLevelMax: 0,
        dLevelMax: 0
    }
};
test('decodeDataPages#returns preallocated empty column data', async () => {
    const data = await decodeDataPages(new Uint8Array(), {
        ...TEST_CONTEXT,
        numValues: 0 as unknown as Int64
    });
    expect(data.rlevels, 'returns no repetition levels').toEqual([]);
    expect(data.dlevels, 'returns no definition levels').toEqual([]);
    expect(data.values, 'returns no values').toEqual([]);
    expect(data.pageHeaders, 'returns no page headers').toEqual([]);
    expect(data.count, 'returns zero decoded values').toBe(0);
});
test('decodeDataPages#uses compact typed level buffers when requested', async () => {
    const [data, wideData, veryWideData] = await Promise.all([1, 256, 65536].map(dLevelMax => decodeDataPages(new Uint8Array(), {
        ...TEST_CONTEXT,
        dLevelMax,
        numValues: 4 as unknown as Int64,
        useTypedLevelBuffers: true
    })));
    expect(data.rlevels instanceof Uint8Array, 'uses a typed repetition-level buffer').toBeTruthy();
    expect(data.dlevels instanceof Uint8Array, 'uses a typed definition-level buffer').toBeTruthy();
    expect(wideData.dlevels instanceof Uint16Array, 'widens definition levels when required').toBeTruthy();
    expect(veryWideData.dlevels instanceof Uint32Array, 'supports deeply nested definition levels').toBeTruthy();
    expect(data.rlevels.length, 'trims repetition levels to the decoded length').toBe(0);
    expect(data.dlevels.length, 'trims definition levels to the decoded length').toBe(0);
});
test('decodeDataPages#rejects invalid metadata value counts', async () => {
    await await expect(decodeDataPages(new Uint8Array(), {
        ...TEST_CONTEXT,
        numValues: -1 as unknown as Int64
    }), 'rejects negative value counts before allocating page buffers').rejects.toThrow(/Invalid Parquet column value count -1/);
});
