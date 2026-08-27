// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from "vitest";
import { loadZarr } from '@loaders.gl/zarr';
import { resolvePath } from '@loaders.gl/core';
import { KeyError } from 'zarr';
import type { AsyncStore, ValidStoreType } from 'zarr/types/storage/types';
const CONTENT_BASE = resolvePath('@loaders.gl/zarr/test/data');
const OME_FIXTURE = `${CONTENT_BASE}/ome.zarr`;
const FIXTURE = `${CONTENT_BASE}/multiscale.zarr`;
const LABELS = ['foo', 'bar', 'baz', 'y', 'x'];
/** Read-only Zarr store backed by a local test-fixture directory. */
class LocalFileStore implements AsyncStore<ValidStoreType> {
    /** Root fixture directory. */
    private readonly rootDirectory: string;
    /** Creates a local read-only store for one fixture directory. */
    constructor(rootDirectory: string) {
        this.rootDirectory = rootDirectory;
    }
    /** Reads one Zarr metadata or chunk key. */
    async getItem(item: string): Promise<Buffer> {
        try {
            return await readFile(join(this.rootDirectory, item));
        }
        catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new KeyError(item);
            }
            throw error;
        }
    }
    /** Returns whether a Zarr metadata or chunk key exists. */
    async containsItem(item: string): Promise<boolean> {
        try {
            await access(join(this.rootDirectory, item));
            return true;
        }
        catch {
            return false;
        }
    }
    /** Local test fixtures are read-only. */
    async setItem(): Promise<boolean> {
        throw new Error('LocalFileStore is read-only.');
    }
    /** Local test fixtures are read-only. */
    async deleteItem(): Promise<boolean> {
        throw new Error('LocalFileStore is read-only.');
    }
    /** Key enumeration is not needed by the Zarr reader. */
    async keys(): Promise<string[]> {
        throw new Error('LocalFileStore does not enumerate keys.');
    }
}
test('Creates correct ZarrPixelSource.', async () => {
    const { data } = await loadZarr(new LocalFileStore(FIXTURE), { labels: LABELS });
    expect(data.length, 'Image should have two levels.').toBe(2);
    const [base] = data;
    expect(base.labels).toEqual(['foo', 'bar', 'baz', 'y', 'x']);
    expect(base.shape, 'shape should match dimensions.').toEqual([1, 3, 1, 167, 439]);
});
test('Creates correct OME ZarrPixelSource.', async () => {
    const { data } = await loadZarr(new LocalFileStore(OME_FIXTURE));
    expect(data.length, 'Image should have two levels.').toBe(2);
    const [base] = data;
    expect(base.labels, 'should have DimensionOrder "XYZCT".').toEqual(['t', 'c', 'z', 'y', 'x']);
    expect(base.shape, 'shape should match dimensions.').toEqual([1, 3, 1, 167, 439]);
});
test('Get raster data.', async () => {
    const { data } = await loadZarr(new LocalFileStore(FIXTURE), { labels: LABELS });
    const [base] = data;
    for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
        const selection = { bar: channelIndex, foo: 0, baz: 0 };
        const pixelData = await base.getRaster({ selection });
        expect(pixelData.width).toBe(439);
        expect(pixelData.height).toBe(167);
        expect(pixelData.data.length).toBe(439 * 167);
        expect(pixelData.data.constructor.name).toBe('Int8Array');
    }
    await expect(base.getRaster({ selection: { bar: 3, foo: 0, baz: 0 } }), 'index should be out of bounds.').rejects.toThrow(/bounds/i);
});
test('Invalid labels.', async () => {
    const store = new LocalFileStore(FIXTURE);
    await expect(loadZarr(store, { labels: ['a', 'b', 'y', 'x'] }), 'labels should correspond to array shape.').rejects.toThrow(/Labels do not match/);
    await expect(loadZarr(store, { labels: ['a', 'b', 'c', 'y', 'w'] }), 'labels should end with y and x.').rejects.toThrow(/Invalid labels/);
    await expect(loadZarr(store, { labels: ['a', 'b', 'c', 'x', '_c'] }), 'interleaved labels should end with y, x, and _c.').rejects.toThrow(/Invalid labels/);
});
