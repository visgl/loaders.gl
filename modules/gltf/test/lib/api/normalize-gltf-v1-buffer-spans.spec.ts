// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertGLTFV1ToGLTF2, normalizeGLTFV1} from '@loaders.gl/gltf';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

test('missing URI buffer lengths use the logical borrowed payload and log their inference', () => {
  const source = createAccessorAsset({buffers: {data: {uri: 'data.bin'}}}, 8, 5);
  const original = JSON.stringify(source.json);
  const warn = vi.fn(() => () => {});
  const converted = convertGLTFV1ToGLTF2(source, {
    normalize: 'strict',
    log: {log: () => () => {}, warn}
  });
  expect(converted.json.buffers![0].byteLength).toBe(8);
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Inferred buffer 0 byteLength'));
  expect(JSON.stringify(source.json)).toBe(original);
});

test.each([
  0, 1, 2, 3
])('declared logical lengths permit %s trailing payload bytes, including GLB padding', padding => {
  const source = createAccessorAsset({}, 8);
  source.buffers[0].byteLength += padding;
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
});

test.each([
  {label: 'missing BIN length', change: (source: any) => (source.json.buffers.data = {})},
  {
    label: 'missing unloaded URI length',
    change: (source: any) => {
      delete source.json.buffers.data.byteLength;
      source.buffers = [];
    }
  },
  {
    label: 'opaque missing length',
    change: (source: any) => {
      delete source.json.buffers.data.byteLength;
      source.json.buffers.data.extensions = {VENDOR_unknown: {}};
    }
  },
  {label: 'zero length', change: (source: any) => (source.json.buffers.data.byteLength = 0)},
  {
    label: 'fractional length',
    change: (source: any) => (source.json.buffers.data.byteLength = 1.5)
  },
  {label: 'short payload', change: (source: any) => (source.buffers[0].byteLength = 7)},
  {label: 'negative borrowed offset', change: (source: any) => (source.buffers[0].byteOffset = -1)},
  {label: 'negative borrowed length', change: (source: any) => (source.buffers[0].byteLength = -1)},
  {
    label: 'borrowed overflow',
    change: (source: any) => (source.buffers[0].byteOffset = Number.MAX_SAFE_INTEGER)
  },
  {
    label: 'borrowed backing overflow',
    change: (source: any) => (source.buffers[0].byteLength = 12)
  },
  {label: 'invalid backing buffer', change: (source: any) => (source.buffers[0].arrayBuffer = {})},
  ...[
    {byteLength: 1},
    {buffer: 'data'},
    {buffer: 'data', byteLength: 0},
    {buffer: 'data', byteOffset: null, byteLength: 1},
    {buffer: 'data', byteOffset: -1, byteLength: 1},
    {buffer: 'data', byteOffset: 8, byteLength: 1},
    {buffer: 'data', byteOffset: Number.MAX_SAFE_INTEGER, byteLength: 1}
  ].map(view => ({
    label: `unused view ${JSON.stringify(view)}`,
    change: (source: any) => (source.json.bufferViews.unused = view)
  }))
])('global span checks diagnose $label even without accessor consumers', ({change}) => {
  const source = createAccessorAsset({}, 8);
  change(source);
  expect(convertGLTFV1ToGLTF2(source).normalizationReport.unsupported.length).toBeGreaterThan(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});

test('span checks retain declared unused buffers when payloads are unavailable', () => {
  const source = createAccessorAsset({}, 8);
  source.buffers = [];
  expect(
    convertGLTFV1ToGLTF2(source, {normalize: 'strict'}).normalizationReport.unsupported
  ).toEqual([]);
});

test('strict failure leaves input lengths unchanged after another buffer could be inferred', () => {
  const source = createAccessorAsset(
    {buffers: {data: {uri: 'data.bin'}, bad: {byteLength: -1}}},
    8
  );
  expect(() => normalizeGLTFV1(source, {normalize: 'strict'})).toThrow();
  expect(source.json.buffers![0].byteLength).toBeUndefined();
});
