// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {convertGLTFV1ToGLTF2} from '@loaders.gl/gltf';
import {getTypedArrayForAccessor} from '../../../src/lib/gltf-utils/get-typed-array';
import {createAccessorAsset} from '../../test-utils/create-gltf-v1-accessor';

/** Borrowed, strided signed data shared between a core attribute and a raw consumer. */
function createSignedAsset(semantic: string, componentType: number, normalized?: boolean) {
  const rows = semantic === 'TEXCOORD' ? 2 : semantic === 'COLOR' ? 3 : 2;
  const source = createAccessorAsset(
    {
      accessors: {
        attribute: {
          bufferView: 'view',
          componentType,
          type: `VEC${rows}`,
          count: 2,
          byteStride: 8,
          normalized
        }
      },
      meshes: {
        mesh: {primitives: [{mode: 0, attributes: {[semantic]: 'attribute', _RAW: 'attribute'}}]}
      }
    },
    32,
    3
  );
  return source;
}

test.each([
  5120, 5122
])('signed %s UV conversion preserves literal or explicitly normalized values and shared bytes', componentType => {
  for (const normalized of [false, true]) {
    const source = createSignedAsset('TEXCOORD', componentType, normalized);
    const maximum = componentType === 5120 ? 127 : 32767;
    const values = [-maximum - 1, maximum, -1, 0];
    const data = new DataView(source.buffers[0].arrayBuffer);
    values.forEach((value, index) => {
      const offset = 3 + Math.floor(index / 2) * 8 + (index % 2) * (componentType === 5120 ? 1 : 2);
      if (componentType === 5120) data.setInt8(offset, value);
      else data.setInt16(offset, value, true);
    });
    const originalJson = JSON.stringify(source.json);
    const originalBytes = new Uint8Array(source.buffers[0].arrayBuffer).slice();
    const warn = vi.fn(() => () => {});
    const converted = convertGLTFV1ToGLTF2(source, {
      normalize: 'strict',
      log: {log: () => () => {}, warn}
    });
    const attributes = converted.json.meshes![0].primitives[0].attributes;
    expect(converted.normalizationReport.unsupported).toEqual([]);
    expect(converted.json.accessors![attributes.TEXCOORD_0]).toMatchObject({
      componentType: 5126,
      type: 'VEC2'
    });
    expect(converted.json.accessors![attributes.TEXCOORD_0].normalized).toBeUndefined();
    const expected = normalized ? [-1, 1, Math.fround(-1 / maximum), 0] : values;
    expect(
      Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes.TEXCOORD_0))
    ).toEqual(expected);
    expect(
      Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, attributes._RAW))
    ).toEqual(values);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining(normalized ? 'explicitly normalized' : 'literal')
    );
    expect(JSON.stringify(source.json)).toBe(originalJson);
    expect(new Uint8Array(source.buffers[0].arrayBuffer)).toEqual(originalBytes);
  }
});

test.each([
  {
    semantic: 'COLOR',
    componentType: 5120,
    normalized: undefined,
    values: [0, 1, 1],
    expected: [0, 1, 1]
  },
  {
    semantic: 'COLOR',
    componentType: 5122,
    normalized: true,
    values: [0, 16384, 32767],
    expected: [0, Math.fround(16384 / 32767), 1]
  },
  {
    semantic: 'WEIGHT',
    componentType: 5120,
    normalized: true,
    values: [127, 0],
    expected: [1, 0, 0, 0]
  },
  {
    semantic: 'WEIGHT',
    componentType: 5122,
    normalized: false,
    values: [1, 0],
    expected: [1, 0, 0, 0]
  }
])('signed $semantic converts valid $componentType values without guessing normalization', ({
  semantic,
  componentType,
  normalized,
  values,
  expected
}) => {
  const source = createSignedAsset(semantic, componentType, normalized);
  const data = new DataView(source.buffers[0].arrayBuffer);
  for (let elementIndex = 0; elementIndex < 2; elementIndex++)
    values.forEach((value, componentIndex) => {
      const offset = 3 + elementIndex * 8 + componentIndex * (componentType === 5120 ? 1 : 2);
      if (componentType === 5120) data.setInt8(offset, value);
      else data.setInt16(offset, value, true);
    });
  const converted = convertGLTFV1ToGLTF2(source, {normalize: 'strict'});
  const attributes = converted.json.meshes![0].primitives[0].attributes;
  const accessorIndex = attributes[semantic === 'COLOR' ? 'COLOR_0' : 'WEIGHTS_0'];
  expect(
    Array.from(getTypedArrayForAccessor(converted.json, converted.buffers, accessorIndex))
  ).toEqual([...expected, ...expected]);
});

test.each([
  {
    label: 'negative color',
    change: (source: any) => new DataView(source.buffers[0].arrayBuffer).setInt8(3, -1),
    semantic: 'COLOR'
  },
  {
    label: 'literal weight outside range',
    change: (source: any) => new DataView(source.buffers[0].arrayBuffer).setInt8(3, 2),
    semantic: 'WEIGHT'
  },
  {
    label: 'wrong shape',
    change: (source: any) => (source.json.accessors.attribute.type = 'VEC3'),
    semantic: 'TEXCOORD'
  },
  {
    label: 'malformed normalization',
    change: (source: any) => (source.json.accessors.attribute.normalized = 1),
    semantic: 'TEXCOORD'
  },
  {
    label: 'unavailable bytes',
    change: (source: any) => (source.buffers = []),
    semantic: 'TEXCOORD'
  },
  ...['root', 'primitive', 'accessor', 'view', 'buffer'].map(location => ({
    label: `opaque ${location}`,
    semantic: 'TEXCOORD',
    change: (source: any) => {
      const target =
        location === 'root'
          ? source.json
          : location === 'primitive'
            ? source.json.meshes.mesh.primitives[0]
            : location === 'accessor'
              ? source.json.accessors.attribute
              : location === 'view'
                ? source.json.bufferViews.view
                : source.json.buffers.data;
      target.extensions = {VENDOR_unknown: {accessor: 'attribute'}};
    }
  }))
])('signed conversion reports $label without replacing source data', ({semantic, change}) => {
  const source = createSignedAsset(semantic, 5120);
  new Uint8Array(source.buffers[0].arrayBuffer).fill(0);
  change(source);
  const converted = convertGLTFV1ToGLTF2(source);
  const attributes = converted.json.meshes![0].primitives[0].attributes;
  expect(
    converted.json.accessors![
      attributes[
        semantic === 'COLOR' ? 'COLOR_0' : semantic === 'WEIGHT' ? 'WEIGHTS_0' : 'TEXCOORD_0'
      ]
    ].componentType
  ).toBe(5120);
  expect(converted.normalizationReport.unsupported.length).toBeGreaterThan(0);
  expect(() => convertGLTFV1ToGLTF2(source, {normalize: 'strict'})).toThrow();
});
