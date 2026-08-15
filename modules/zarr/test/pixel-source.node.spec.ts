// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {access, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import test from 'test/utils/vitest-tape';
import {loadZarr} from '@loaders.gl/zarr';
import {resolvePath} from '@loaders.gl/core';
import {KeyError} from 'zarr';
import type {AsyncStore, ValidStoreType} from 'zarr/types/storage/types';

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
    } catch (error) {
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
    } catch {
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

test('Creates correct ZarrPixelSource.', async t => {
  const {data} = await loadZarr(new LocalFileStore(FIXTURE), {labels: LABELS});
  t.equal(data.length, 2, 'Image should have two levels.');
  const [base] = data;
  t.deepEqual(base.labels, ['foo', 'bar', 'baz', 'y', 'x']);
  t.deepEqual(base.shape, [1, 3, 1, 167, 439], 'shape should match dimensions.');
  t.end();
});

test('Creates correct OME ZarrPixelSource.', async t => {
  const {data} = await loadZarr(new LocalFileStore(OME_FIXTURE));
  t.equal(data.length, 2, 'Image should have two levels.');
  const [base] = data;
  t.deepEqual(base.labels, ['t', 'c', 'z', 'y', 'x'], 'should have DimensionOrder "XYZCT".');
  t.deepEqual(base.shape, [1, 3, 1, 167, 439], 'shape should match dimensions.');
  t.end();
});

test('Get raster data.', async t => {
  const {data} = await loadZarr(new LocalFileStore(FIXTURE), {labels: LABELS});
  const [base] = data;

  for (let channelIndex = 0; channelIndex < 3; channelIndex++) {
    const selection = {bar: channelIndex, foo: 0, baz: 0};
    const pixelData = await base.getRaster({selection});
    t.equal(pixelData.width, 439);
    t.equal(pixelData.height, 167);
    t.equal(pixelData.data.length, 439 * 167);
    t.equal(pixelData.data.constructor.name, 'Int8Array');
  }

  await t.rejects(
    base.getRaster({selection: {bar: 3, foo: 0, baz: 0}}),
    /bounds/i,
    'index should be out of bounds.'
  );
  t.end();
});

test('Invalid labels.', async t => {
  const store = new LocalFileStore(FIXTURE);
  await t.rejects(
    loadZarr(store, {labels: ['a', 'b', 'y', 'x']}),
    /Labels do not match/,
    'labels should correspond to array shape.'
  );
  await t.rejects(
    loadZarr(store, {labels: ['a', 'b', 'c', 'y', 'w']}),
    /Invalid labels/,
    'labels should end with y and x.'
  );
  await t.rejects(
    loadZarr(store, {labels: ['a', 'b', 'c', 'x', '_c']}),
    /Invalid labels/,
    'interleaved labels should end with y, x, and _c.'
  );
  t.end();
});
