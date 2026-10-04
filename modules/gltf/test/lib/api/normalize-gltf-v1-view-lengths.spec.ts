// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertGLTFV1ToGLTF2, normalizeGLTFV1} from '@loaders.gl/gltf';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

/** Two dense strided consumers, including an unused accessor that extends the known envelope. */
function createViewAsset() {
  return createAccessorAsset(
    {
      bufferViews: {view: {buffer: 'data', byteOffset: 4}},
      accessors: {
        first: {
          bufferView: 'view',
          byteOffset: 2,
          componentType: 5121,
          type: 'VEC2',
          count: 2,
          byteStride: 8
        },
        last: {
          bufferView: 'view',
          byteOffset: 16,
          componentType: 5123,
          type: 'VEC3',
          count: 2,
          byteStride: 10
        }
      }
    },
    40,
    5
  );
}

test('missing view length includes every dense consumer, excludes trailing stride padding, and preserves source bytes', () => {
  const source = createViewAsset();
  const originalJson = JSON.stringify(source.json);
  const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
  const warn = vi.fn(() => () => {});
  const converted = convertGLTFV1ToGLTF2(source, {
    normalize: 'strict',
    log: {log: () => () => {}, warn}
  });
  expect(converted.json.bufferViews![0].byteLength).toBe(32);
  expect(converted.json.buffers![0].byteLength).toBeGreaterThanOrEqual(40);
  expect(new Uint8Array(converted.buffers[0].arrayBuffer).subarray(0, 40)).toEqual(
    originalBytes.subarray(5, 45)
  );
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('Inferred bufferView 0 byteLength'));
  expect(JSON.stringify(source.json)).toBe(originalJson);
  expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
});

test('buffer and view lengths can both be inferred without guessing a GLB logical buffer length', () => {
  const source = createViewAsset();
  delete (source.json.buffers as any).data.byteLength;
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  expect(converted.json.bufferViews![0].byteLength).toBe(32);
  expect(converted.json.buffers![0].byteLength).toBeGreaterThanOrEqual(40);
  const binary = createViewAsset();
  delete (binary.json.buffers as any).data.uri;
  expect(convertGLTFV1ToGLTF2(binary, {normalize: 'strict'}).json.bufferViews![0].byteLength).toBe(
    32
  );
});

test.each([
  {label: 'unowned view', change: (source: any) => (source.json.accessors = {})},
  {
    label: 'image owner',
    change: (source: any) =>
      (source.json.images = {image: {bufferView: 'view', mimeType: 'image/png'}})
  },
  {
    label: 'sparse owner',
    change: (source: any) =>
      (source.json.accessors.first.sparse = {
        count: 1,
        indices: {bufferView: 'view', componentType: 5121},
        values: {bufferView: 'view'}
      })
  },
  {
    label: 'opaque owner',
    change: (source: any) => (source.json.extensions = {VENDOR_data: {bufferView: 'view'}})
  },
  {
    label: 'view extension',
    change: (source: any) => (source.json.bufferViews.view.extensions = {VENDOR_data: {}})
  },
  {label: 'unloaded bytes', change: (source: any) => (source.buffers = [])},
  {label: 'short bytes', change: (source: any) => (source.buffers[0].byteLength = 20)},
  {label: 'invalid count', change: (source: any) => (source.json.accessors.last.count = 0)},
  {label: 'invalid stride', change: (source: any) => (source.json.accessors.last.byteStride = 4)},
  {
    label: 'overflow',
    change: (source: any) => (source.json.accessors.last.count = Number.MAX_SAFE_INTEGER)
  },
  {label: 'explicit zero', change: (source: any) => (source.json.bufferViews.view.byteLength = 0)},
  {
    label: 'explicit null offset',
    change: (source: any) => (source.json.bufferViews.view.byteOffset = null)
  }
])('view length inference refuses $label', ({change}) => {
  const source = createViewAsset();
  change(source);
  const converted = convertGLTFV1ToGLTF2(source);
  expect(converted.normalizationReport.unsupported.length).toBeGreaterThan(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});

test('strict global span failure does not commit an earlier inferred view or buffer length', () => {
  const source = createViewAsset();
  delete (source.json.buffers as any).data.byteLength;
  (source.json.bufferViews as any).bad = {buffer: 'data', byteLength: -1};
  expect(() => normalizeGLTFV1(source, {normalize: 'strict'})).toThrow();
  expect(source.json.buffers![0].byteLength).toBeUndefined();
  expect(source.json.bufferViews![0].byteLength).toBeUndefined();
});
