// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {createManifestBackedTileConversionSink} from '@loaders.gl/tile-converter/v5/core';
import type {
  TileResourceManifest,
  TileResourceManifestEntry
} from '@loaders.gl/tile-converter/v5/core';

const entry: TileResourceManifestEntry = {
  resourceId: 'mesh.glb',
  byteLength: 2,
  fingerprint: 'digest'
};
const report = {
  state: 'completed' as const,
  inputResources: 1,
  outputResources: 1,
  inputBytes: 2,
  outputBytes: 2,
  largestOutputResourceBytes: 2,
  diagnostics: []
};

/** Builds a tiny persisted checkpoint and observable destination. */
function createOptions(resources: readonly TileResourceManifestEntry[] = [entry]) {
  let manifest: TileResourceManifest = {version: 1, complete: false, resources};
  const options = {
    sink: {
      write: vi.fn(async (_resource: TileResourceManifestEntry, _signal?: AbortSignal) => {}),
      finalize: vi.fn(async () => {}),
      abort: vi.fn(async () => {})
    },
    manifestStore: {
      load: vi.fn(async () => manifest),
      save: vi.fn(async (next: TileResourceManifest) => {
        manifest = next;
      })
    },
    getResourceId: (resource: TileResourceManifestEntry) => resource.resourceId,
    measureResourceBytes: (resource: TileResourceManifestEntry) => resource.byteLength,
    fingerprintResource: (resource: TileResourceManifestEntry) => resource.fingerprint
  };
  return {options, getManifest: () => manifest};
}

test.each([
  true,
  false
])('destination verification %s skips or repairs the checkpoint', async verified => {
  const {options, getManifest} = createOptions();
  const verifyResource = vi.fn(async () => verified);
  const sink = await createManifestBackedTileConversionSink({
    ...options,
    verifyResource,
    maxResources: 1
  });
  const controller = new AbortController();
  await sink.write(entry, controller.signal);
  expect(verifyResource).toHaveBeenCalledExactlyOnceWith(entry, controller.signal);
  expect(options.sink.write).toHaveBeenCalledTimes(verified ? 0 : 1);
  expect(options.manifestStore.save).toHaveBeenCalledTimes(verified ? 0 : 1);
  await sink.finalize(report);
  expect(getManifest()).toMatchObject({complete: true, resources: [entry], report});
});

test('failed verification poisons queued writes and prevents finalization', async () => {
  const {options} = createOptions();
  const failure = new Error('storage unavailable');
  const sink = await createManifestBackedTileConversionSink({
    ...options,
    verifyResource: async () => {
      throw failure;
    }
  });
  const first = sink.write(entry);
  const second = sink.write({...entry, resourceId: 'second.glb'});
  await expect(first).rejects.toBe(failure);
  await expect(second).rejects.toBe(failure);
  await expect(sink.finalize(report)).rejects.toBe(failure);
  expect(options.sink.write).not.toHaveBeenCalled();
  expect(options.sink.finalize).not.toHaveBeenCalled();
});

test.each([
  'before',
  'during'
] as const)('cancellation %s verification prevents skipping or repairing', async timing => {
  const {options} = createOptions();
  const controller = new AbortController();
  const verifyResource = vi.fn(async () => {
    controller.abort();
    return false;
  });
  const sink = await createManifestBackedTileConversionSink({...options, verifyResource});
  if (timing === 'before') controller.abort();
  await expect(sink.write(entry, controller.signal)).rejects.toMatchObject({name: 'AbortError'});
  expect(verifyResource).toHaveBeenCalledTimes(timing === 'before' ? 0 : 1);
  expect(options.sink.write).not.toHaveBeenCalled();
});

test('changed input fails before destination verification; new outputs need no verification', async () => {
  const {options} = createOptions();
  const verifyResource = vi.fn(async () => true);
  const sink = await createManifestBackedTileConversionSink({...options, verifyResource});
  await sink.write({...entry, resourceId: 'new.glb'});
  expect(options.sink.write).toHaveBeenCalledOnce();
  await expect(sink.write({...entry, fingerprint: 'changed'})).rejects.toMatchObject({
    code: 'RESOURCE_RESUME_MISMATCH'
  });
  expect(verifyResource).not.toHaveBeenCalled();
});

test.each([
  -1,
  NaN,
  0.5,
  Number.MAX_SAFE_INTEGER + 1
])('invalid checkpoint limit %s fails before loading', async maxResources => {
  const {options} = createOptions();
  await expect(
    createManifestBackedTileConversionSink({...options, maxResources})
  ).rejects.toMatchObject({code: 'INVALID_MANIFEST_RESOURCE_LIMIT'});
  expect(options.manifestStore.load).not.toHaveBeenCalled();
});

test('checkpoint cap applies to loaded and new unique entries but permits repairs', async () => {
  const {options} = createOptions();
  await expect(
    createManifestBackedTileConversionSink({...options, maxResources: 0})
  ).rejects.toMatchObject({code: 'MANIFEST_RESOURCE_LIMIT_EXCEEDED'});
  const sink = await createManifestBackedTileConversionSink({...options, maxResources: 1});
  await sink.write(entry);
  await expect(sink.write({...entry, resourceId: 'second.glb'})).rejects.toMatchObject({
    code: 'MANIFEST_RESOURCE_LIMIT_EXCEEDED'
  });
  expect(options.sink.write).not.toHaveBeenCalled();
  const empty = createOptions([]);
  const zero = await createManifestBackedTileConversionSink({...empty.options, maxResources: 0});
  await expect(zero.write(entry)).rejects.toMatchObject({code: 'MANIFEST_RESOURCE_LIMIT_EXCEEDED'});
});

test('a malformed loaded checkpoint produces a typed validation error', async () => {
  const {options} = createOptions();
  await expect(
    createManifestBackedTileConversionSink({
      ...options,
      manifestStore: {
        ...options.manifestStore,
        load: async () => 1 as unknown as TileResourceManifest
      }
    })
  ).rejects.toMatchObject({code: 'UNSUPPORTED_RESOURCE_MANIFEST'});
});
