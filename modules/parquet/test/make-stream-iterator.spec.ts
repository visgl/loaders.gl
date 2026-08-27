// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import { expect, test } from "vitest";
import { isBrowser } from '@loaders.gl/loader-utils';
import { makeStreamIterator } from '../src/lib/utils/make-stream-iterator';
test('Parquet makeStreamIterator#rethrows read errors and releases the lock', async () => {
    if (!isBrowser) {
        console.log('Browser-only stream lock behavior');
        return;
    }
    const readError = new Error('Stream read failed');
    const stream = new ReadableStream<number>({
        start(controller) {
            controller.error(readError);
        }
    });
    await expect(collectValues(makeStreamIterator(stream)), 'preserves the read error').rejects.toThrow(readError);
    expect(stream.locked, 'releases the reader lock').toBeFalsy();
});
test('Parquet makeStreamIterator#cancels and unlocks on early return', async () => {
    if (!isBrowser) {
        console.log('Browser-only stream lock behavior');
        return;
    }
    let cancellationCount = 0;
    const stream = new ReadableStream<number>({
        start(controller) {
            controller.enqueue(1);
        },
        cancel() {
            cancellationCount++;
        }
    });
    for await (const value of makeStreamIterator(stream, { _streamReadAhead: true })) {
        expect(value, 'reads the first value').toBe(1);
        break;
    }
    expect(cancellationCount, 'cancels the unfinished stream').toBe(1);
    expect(stream.locked, 'releases the reader lock').toBeFalsy();
});
test('Parquet makeStreamIterator#unlocks after natural completion', async () => {
    if (!isBrowser) {
        console.log('Browser-only stream lock behavior');
        return;
    }
    const stream = new ReadableStream<number>({
        start(controller) {
            controller.enqueue(1);
            controller.close();
        }
    });
    expect(await collectValues(makeStreamIterator(stream)), 'reads every value').toEqual([1]);
    expect(stream.locked, 'releases the reader lock').toBeFalsy();
});
test('Parquet makeStreamIterator#aborts a pending read and releases the stream', async () => {
    const abortController = new AbortController();
    const abortReason = new Error('Stop reading Parquet data');
    let cancellationCount = 0;
    const stream = new ReadableStream<number>({
        cancel() {
            cancellationCount++;
        }
    });
    const valuesPromise = collectValues(makeStreamIterator(stream, { signal: abortController.signal }));
    await Promise.resolve();
    abortController.abort(abortReason);
    await expect(valuesPromise, 'rejects with the AbortSignal reason').rejects.toThrow(abortReason);
    expect(cancellationCount, 'cancels the pending stream').toBe(1);
    expect(stream.locked, 'releases the reader or async-iterator lock').toBeFalsy();
});
async function collectValues<T>(values: AsyncIterable<T>): Promise<T[]> {
    const collectedValues: T[] = [];
    for await (const value of values) {
        collectedValues.push(value);
    }
    return collectedValues;
}
