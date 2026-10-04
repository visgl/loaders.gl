// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

/** Two strided directions in a borrowed slice, also consumed as uninterpreted custom data. */
function createDirectionAsset(semantic: string, componentType: number, normalized?: boolean) {
  const rows = semantic === 'NORMAL' ? 3 : 4;
  const source = createAccessorAsset(
    {
      accessors: {
        direction: {
          bufferView: 'view',
          componentType,
          type: `VEC${rows}`,
          count: 2,
          byteOffset: 1,
          byteStride: 12,
          normalized
        }
      },
      meshes: {
        mesh: {primitives: [{mode: 0, attributes: {[semantic]: 'direction', _RAW: 'direction'}}]}
      }
    },
    32,
    3
  );
  return source;
}

/** Write signed or unsigned components without requiring source alignment. */
function writeDirectionValues(source: ReturnType<typeof createDirectionAsset>, values: number[]) {
  const accessor = (source.json.accessors as any).direction;
  const data = new DataView(source.buffers[0].arrayBuffer);
  const width = [5120, 5121].includes(accessor.componentType) ? 1 : 2;
  values.forEach((value, index) => {
    const offset = 4 + index * width;
    const nextOffset = offset + 12;
    for (const byteOffset of [offset, nextOffset]) {
      if (accessor.componentType === 5120) data.setInt8(byteOffset, value);
      else if (accessor.componentType === 5121) data.setUint8(byteOffset, value);
      else if (accessor.componentType === 5122) data.setInt16(byteOffset, value, true);
      else data.setUint16(byteOffset, value, true);
    }
  });
}

test.each([
  {componentType: 5120, maximum: 127},
  {componentType: 5121, maximum: 255},
  {componentType: 5122, maximum: 32767},
  {componentType: 5123, maximum: 65535}
])('integer directions of type $componentType preserve explicit and literal interpretation', ({
  componentType,
  maximum
}) => {
  for (const semantic of ['NORMAL', 'TANGENT']) {
    for (const normalized of [undefined, false, true]) {
      const source = createDirectionAsset(semantic, componentType, normalized);
      const signed = [5120, 5122].includes(componentType);
      const values = [0, 0, normalized ? maximum : 1];
      if (semantic === 'TANGENT')
        values.push(signed ? -(normalized ? maximum : 1) : normalized ? maximum : 1);
      writeDirectionValues(source, values);
      const originalJson = JSON.stringify(source.json);
      const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
      const warn = vi.fn(() => () => {});
      const converted = convertGLTFV1ToGLTF2(source, {
        normalize: 'strict',
        log: {log: () => () => {}, warn}
      });
      const attributes = converted.json.meshes![0].primitives[0].attributes;
      const accessor = converted.json.accessors![attributes[semantic]];
      expect(accessor.componentType).toBe(5126);
      expect(accessor.normalized).toBeUndefined();
      const expected = [0, 0, 1, ...(semantic === 'TANGENT' ? [signed ? -1 : 1] : [])];
      expect(
        Array.from(
          getTypedArrayForAccessor(converted.json, converted.buffers, attributes[semantic])
        )
      ).toEqual([...expected, ...expected]);
      expect(
        Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes._RAW))
      ).toEqual([...values, ...values]);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(normalized ? 'explicitly normalized' : 'literal')
      );
      expect(converted.normalizationReport.unsupported).toEqual([]);
      expect(JSON.stringify(source.json)).toBe(originalJson);
      expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
    }
  }
});

test('signed minimum decodes to -1 without modifying the raw consumer', () => {
  const source = createDirectionAsset('NORMAL', 5120, true);
  writeDirectionValues(source, [-128, 0, 0]);
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const accessorIndex = converted.json.meshes![0].primitives[0].attributes.NORMAL;
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, accessorIndex))
  ).toEqual([-1, 0, 0, -1, 0, 0]);
});

test.each([
  {label: 'nonunit literal', semantic: 'NORMAL', values: [0, 0, 2]},
  {label: 'zero vector', semantic: 'NORMAL', values: [0, 0, 0]},
  {label: 'quantized nonunit vector', semantic: 'NORMAL', normalized: true, values: [90, 90, 0]},
  {label: 'invalid handedness', semantic: 'TANGENT', values: [1, 0, 0, 0]},
  {
    label: 'wrong shape',
    semantic: 'TANGENT',
    values: [1, 0, 0, 1],
    change: (source: any) => (source.json.accessors.direction.type = 'VEC3')
  },
  {
    label: 'malformed normalization',
    semantic: 'NORMAL',
    values: [0, 0, 1],
    change: (source: any) => (source.json.accessors.direction.normalized = null)
  },
  {
    label: 'unloaded payload',
    semantic: 'NORMAL',
    values: [0, 0, 1],
    change: (source: any) => (source.buffers = [])
  },
  {
    label: 'opaque consumer',
    semantic: 'NORMAL',
    values: [0, 0, 1],
    change: (source: any) => (source.json.extensions = {VENDOR_direction: {accessor: 'direction'}})
  }
])('integer directions report $label without repair', ({semantic, values, normalized, change}) => {
  const source = createDirectionAsset(semantic, 5120, normalized);
  writeDirectionValues(source, values);
  change?.(source);
  const converted = convertGLTFV1ToGLTF2(source);
  const accessorIndex = converted.json.meshes![0].primitives[0].attributes[semantic];
  expect(converted.json.accessors![accessorIndex].componentType).toBe(5120);
  expect(converted.normalizationReport.unsupported.length).toBeGreaterThan(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});
