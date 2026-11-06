// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {beforeAll, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {USDLoaderWithParser} from '@loaders.gl/scene/usd-loader';
import type {USDAssetPath, USDEmbeddedAsset, USDStage} from '@loaders.gl/scene';

// Original MIT fixtures: one-pixel PNG and its JPEG conversion (macOS sips), plus USDA sources.
// Regenerate from data/embedded-assets using usdzip ../embedded-assets.usdz scene/root.usda
// parts/model.usda textures/albedo.PNG alternate/albedo.jpg parts/albedo.PNG alternate/albedo.PNG textures/palette.bin.
// Native tools are fixture-generation tools only; tests have no runtime dependency on them.

let source: ArrayBuffer;
let stage: USDStage;
const archiveBase = 'https://usd.archive/';

beforeAll(async () => {
  source = await (
    await fetch(new URL('./data/embedded-assets.usdz', import.meta.url))
  ).arrayBuffer();
  const fetchResource = vi.fn(() => {
    throw new Error('Embedded resources must not fetch external URLs');
  });
  stage = await parse(source, USDLoaderWithParser, {
    core: {baseUrl: 'https://example.com/model.usdz', fetch: fetchResource}
  });
  expect(fetchResource).not.toHaveBeenCalled();
});

test('USDZ exposes encoded assets and layers by package URL with original paths', () => {
  const assets = stage.assets!;
  expect(stage.url).toBe('https://example.com/model.usdz');
  expect(Object.keys(assets)).toHaveLength(7);
  const png: USDEmbeddedAsset = assets[archiveBase + 'textures/albedo.PNG'];
  expect(png.path).toBe('textures/albedo.PNG');
  expect(png.mimeType).toBe('image/png');
  expect(Array.from(new Uint8Array(png.data, 0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const jpeg = assets[archiveBase + 'alternate/albedo.jpg'];
  expect(jpeg.mimeType).toBe('image/jpeg');
  expect(Array.from(new Uint8Array(jpeg.data, 0, 2))).toEqual([255, 216]);
  expect(assets[archiveBase + 'alternate/albedo.PNG'].path).toBe('alternate/albedo.PNG');
  expect(assets[archiveBase + 'textures/palette.bin'].mimeType).toBeUndefined();
  expect(Array.from(new Uint8Array(assets[archiveBase + 'textures/palette.bin'].data))).toEqual([
    0, 127, 255
  ]);
  expect(new TextDecoder().decode(assets[archiveBase + 'scene/root.usda'].data)).toContain(
    '#usda 1.0'
  );
});

test('USDZ asset URLs resolve from root and packaged reference source layers', () => {
  const root = stage.rootPrims[0];
  const preview = root.attributes.preview.value as USDAssetPath;
  expect(preview.assetPath).toBe('../textures/albedo.PNG');
  expect(stage.assets![new URL(preview.assetPath, root.sourceUrl).href].path).toBe(
    'textures/albedo.PNG'
  );
  const inherited = root.attributes.inherited;
  expect(inherited.sourceUrl).toBe(archiveBase + 'parts/model.usda');
  expect(
    stage.assets![new URL((inherited.value as USDAssetPath).assetPath, inherited.sourceUrl).href]
      .path
  ).toBe('parts/albedo.PNG');
  const texture = root.children[0];
  const file = texture.attributes['inputs:file'].value as USDAssetPath;
  expect(texture.sourceUrl).toBe(archiveBase + 'parts/model.usda');
  expect(stage.assets![new URL(file.assetPath, texture.sourceUrl).href].mimeType).toBe(
    'image/jpeg'
  );
  const missing = root.attributes.missing.value as USDAssetPath;
  expect(stage.assets![new URL(missing.assetPath, root.sourceUrl).href]).toBeUndefined();
});

test('USDZ extraction retains encoded bytes without sharing the caller input buffer', async () => {
  const independentSource = source.slice(0);
  const parsed = await USDLoaderWithParser.parse(independentSource, {usd: {compose: false}});
  const before = new Uint8Array(parsed.assets![archiveBase + 'textures/albedo.PNG'].data).slice();
  new Uint8Array(independentSource).fill(0);
  expect(new Uint8Array(parsed.assets![archiveBase + 'textures/albedo.PNG'].data)).toEqual(before);
  expect(parsed.rootPrims[0].children).toHaveLength(0);
  expect(Object.keys(parsed.assets!)).toHaveLength(7);
});

test('standalone USD layers do not expose an embedded asset collection', async () => {
  const parsed = await USDLoaderWithParser.parseText('#usda 1.0\ndef Xform "World" {}');
  expect(parsed.assets).toBeUndefined();
});

/** Locates ZIP records in the tiny immutable fixture for malformed-input regressions. */
function getRecordOffsets(bytes: ArrayBuffer, signature: number): number[] {
  const view = new DataView(bytes);
  const offsets: number[] = [];
  for (let offset = 0; offset + 4 <= bytes.byteLength; offset++) {
    if (view.getUint32(offset, true) === signature) offsets.push(offset);
  }
  return offsets;
}

/** Renames the last fixture entry in both ZIP headers without changing its encoded bytes. */
function renameLastEntry(bytes: ArrayBuffer, filename: string): string {
  const view = new DataView(bytes);
  const directories = getRecordOffsets(bytes, 0x02014b50);
  const entry = directories[directories.length - 1];
  const local = view.getUint32(entry + 42, true);
  const filenameLength = view.getUint16(entry + 28, true);
  const paddedFilename = filename.padEnd(filenameLength, 'x');
  const replacement = new TextEncoder().encode(paddedFilename);
  expect(replacement.length).toBe(filenameLength);
  new Uint8Array(bytes, entry + 46, filenameLength).set(replacement);
  new Uint8Array(bytes, local + 30, filenameLength).set(replacement);
  return paddedFilename;
}

test.each([
  '%2e/a.png',
  '%2E%2e/a.png',
  '.%2e/a.png',
  '%2e./a.png',
  '.\t./a.png',
  ' a.png'
])('USDZ rejects URL-normalized package identity %j', async filename => {
  const bytes = source.slice(0);
  renameLastEntry(bytes, filename);
  await expect(USDLoaderWithParser.parse(bytes, {usd: {compose: false}})).rejects.toThrow(
    /ambiguous package URL/
  );
});

test('USDZ preserves spaces and encoded dots within a filename', async () => {
  const bytes = source.slice(0);
  const filename = renameLastEntry(bytes, 'textures/ab c%2e.png');
  const parsed = await USDLoaderWithParser.parse(bytes, {usd: {compose: false}});
  const asset = parsed.assets![new URL(filename, archiveBase).href];
  expect(asset.path).toBe(filename);
  expect(Array.from(new Uint8Array(asset.data))).toEqual([0, 127, 255]);
});

test.each([
  'compressed',
  'encrypted',
  'truncated',
  'duplicate',
  'mismatched name',
  'mismatched length',
  'external URL',
  'ambiguous URL',
  'traversal path',
  'truncated directory',
  'truncated filename',
  'local header bounds',
  'local compression',
  'invalid local header',
  'overlapping allocation'
])('USDZ rejects %s assets instead of exposing misleading file data', async failure => {
  const bytes = source.slice(0);
  const view = new DataView(bytes);
  const directories = getRecordOffsets(bytes, 0x02014b50);
  const entry = directories[directories.length - 1];
  const local = view.getUint32(entry + 42, true);
  const filenameLength = view.getUint16(entry + 28, true);
  if (failure === 'overlapping allocation') {
    const dataLimit = directories[0];
    for (const directory of directories) {
      const localOffset = view.getUint32(directory + 42, true);
      const contentOffset =
        localOffset +
        30 +
        view.getUint16(localOffset + 26, true) +
        view.getUint16(localOffset + 28, true);
      const expandedLength = dataLimit - contentOffset;
      view.setUint32(directory + 20, expandedLength, true);
      view.setUint32(directory + 24, expandedLength, true);
    }
  }
  if (failure === 'truncated directory') {
    const end = getRecordOffsets(bytes, 0x06054b50)[0];
    view.setUint32(end + 16, end - 1, true);
  }
  if (failure === 'truncated filename') view.setUint16(entry + 28, 0xffff, true);
  if (failure === 'local header bounds') view.setUint32(entry + 42, 0xffffffff, true);
  if (failure === 'local compression') view.setUint16(local + 8, 8, true);
  if (failure === 'invalid local header') view.setUint32(local, 0, true);
  if (failure === 'compressed') view.setUint16(entry + 10, 8, true);
  if (failure === 'encrypted') view.setUint16(local + 6, 1, true);
  if (failure === 'truncated') {
    view.setUint32(entry + 20, bytes.byteLength, true);
    view.setUint32(entry + 24, bytes.byteLength, true);
  }
  if (failure === 'mismatched length') view.setUint32(entry + 24, 100, true);
  if (failure === 'mismatched name') view.setUint8(local + 30, 88);
  if (failure === 'duplicate') {
    const previous = directories[directories.length - 2];
    const previousLength = view.getUint16(previous + 28, true);
    new Uint8Array(bytes, entry + 46, filenameLength).set(
      new Uint8Array(bytes, previous + 46, previousLength)
    );
    view.setUint16(entry + 28, previousLength, true);
    view.setUint16(entry + 30, filenameLength - previousLength, true);
    view.setUint32(entry + 42, view.getUint32(previous + 42, true), true);
    view.setUint32(entry + 20, view.getUint32(previous + 20, true), true);
    view.setUint32(entry + 24, view.getUint32(previous + 24, true), true);
  }
  if (['external URL', 'ambiguous URL', 'traversal path'].includes(failure)) {
    const filename =
      failure === 'external URL'
        ? '//evil.co/a.png'
        : failure === 'ambiguous URL'
          ? 'data/file#x.png'
          : '../bad/file.png';
    const replacement = new TextEncoder().encode(filename.padEnd(filenameLength, 'x'));
    new Uint8Array(bytes, entry + 46, filenameLength).set(replacement);
    new Uint8Array(bytes, local + 30, filenameLength).set(replacement);
  }
  const expectedError = failure === 'overlapping allocation' ? /stored data budget/ : /USDZ/;
  await expect(USDLoaderWithParser.parse(bytes, {usd: {compose: false}})).rejects.toThrow(
    expectedError
  );
});
