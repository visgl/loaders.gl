// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import DracoParser from '../../src/lib/draco-parser';

/** Creates the smallest deterministic Draco decoder surface used by parser unit tests. */
function createParser(): DracoParser {
  const heap = new ArrayBuffer(256);
  class FakeAttribute {
    /** Returns a generic attribute type. */
    attribute_type(): number {
      return 4;
    }
    /** Returns the scalar data type. */
    data_type(): number {
      return 9;
    }
    /** Returns the component count. */
    num_components(): number {
      return 3;
    }
    /** Returns the unique attribute id. */
    unique_id(): number {
      return 7;
    }
    /** Returns the byte offset. */
    byte_offset(): number {
      return 0;
    }
    /** Returns the byte stride. */
    byte_stride(): number {
      return 12;
    }
    /** Returns whether the attribute is normalized. */
    normalized(): boolean {
      return false;
    }
  }
  class FakeIntArray {
    values = [0, 1, 2];
    /** Returns the number of values. */
    size(): number {
      return this.values.length;
    }
    /** Returns one value. */
    GetValue(index: number): number {
      return this.values[index];
    }
  }
  const decoder = {
    POSITION: 0,
    NORMAL: 1,
    COLOR: 2,
    TEX_COORD: 3,
    GENERIC: 4,
    SkipAttributeTransform: () => {},
    GetAttribute: () => new FakeAttribute(),
    GetAttributeDataArrayForAllPoints: () => {
      new Float32Array(heap).set([1, 2, 3, 4, 5, 6]);
    },
    GetTrianglesUInt32Array: (_geometry: unknown, _length: number, pointer: number) => {
      new Uint32Array(heap, pointer, 3).set([0, 1, 2]);
    },
    GetTriangleStripsFromMesh: (_geometry: unknown, array: FakeIntArray) => {
      array.values = [0, 1, 2, 2, 1, 3];
    },
    GetMetadata: () => ({ptr: 1}),
    GetAttributeMetadata: () => ({ptr: 0}),
    _malloc: () => 0,
    _free: () => {}
  };
  const draco: any = {
    ...decoder,
    Decoder: class {
      constructor() {
        return decoder;
      }
    },
    MetadataQuerier: class {
      /** Returns the fixture metadata entry count. */
      NumEntries(): number {
        return 0;
      }
    },
    DracoInt32Array: FakeIntArray,
    HEAPF32: {buffer: heap},
    DT_FLOAT32: 9,
    AttributeQuantizationTransform: class {
      /** Initializes the fake transform. */
      InitFromAttribute(): boolean {
        return true;
      }
      /** Returns quantization bits. */
      quantization_bits(): number {
        return 12;
      }
      /** Returns quantization range. */
      range(): number {
        return 2;
      }
      /** Returns one minimum value. */
      min_value(value: number): number {
        return value;
      }
    },
    destroy: () => {}
  };
  return new DracoParser(draco);
}

test('DracoParser handles attribute naming, values, indices, and transforms', () => {
  const parser = createParser();
  const attribute: any = {
    unique_id: 7,
    attribute_type: 4,
    data_type: 9,
    num_components: 3,
    byte_offset: 0,
    byte_stride: 12,
    normalized: false,
    attribute_index: 0,
    metadata: {name: {string: 'from-metadata'}}
  };
  expect(parser._deduceAttributeName(attribute, {extraAttributes: {custom: 7}})).toBe('custom');
  expect(parser._deduceAttributeName({...attribute, unique_id: 8, metadata: {}}, {})).toBe(
    'CUSTOM_ATTRIBUTE_8'
  );
  expect(parser._getAttributeValues({num_points: () => 2} as any, attribute).value).toBeInstanceOf(
    Float32Array
  );
  const pointAttribute = {
    attribute_type: () => 4
  } as any;
  expect(
    parser._getQuantizationTransform(pointAttribute, {quantizedAttributes: ['GENERIC']})
  ).toEqual({
    quantization_bits: 12,
    range: 2,
    min_values: new Float32Array([1, 2, 3])
  });
  expect(
    parser._getOctahedronTransform(pointAttribute, {octahedronAttributes: ['GENERIC']})
  ).toEqual({
    quantization_bits: 12
  });
});

test('DracoParser copies mesh indices and handles metadata absence', () => {
  const parser = createParser();
  const geometry = {num_faces: () => 1} as any;
  expect(Array.from(parser._getTriangleListIndices(geometry))).toEqual([0, 1, 2]);
  expect(Array.from(parser._getTriangleStripIndices(geometry))).toEqual([0, 1, 2, 2, 1, 3]);
  expect(parser._getDracoMetadata({ptr: 0} as any)).toEqual({});
  parser.destroy();
});
