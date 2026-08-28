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
      return true;
    },
    GetTrianglesUInt32Array: (_geometry: unknown, _length: number, pointer: number) => {
      new Uint32Array(heap, pointer, 3).set([0, 1, 2]);
      return true;
    },
    GetTrianglesUInt16Array: (_geometry: unknown, _length: number, pointer: number) => {
      new Uint16Array(heap, pointer, 3).set([0, 1, 2]);
      return true;
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
    POINT_CLOUD: 0,
    TRIANGULAR_MESH: 1,
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
    Mesh: class {},
    PointCloud: class {
      ptr = 1;
    },
    DracoInt32Array: FakeIntArray,
    HEAPU8: {buffer: heap},
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
    AttributeOctahedronTransform: class {
      /** Initializes the fake transform. */
      InitFromAttribute(): boolean {
        return true;
      }
      /** Returns quantization bits. */
      quantization_bits(): number {
        return 12;
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
  expect(parser._deduceAttributeName({...attribute, metadata: {name: {string: 'COLOR'}}}, {})).toBe(
    'COLOR_0'
  );
  expect(
    parser._deduceAttributeName({...attribute, metadata: {name: {string: 'TEX_COORD'}}}, {})
  ).toBe('TEXCOORD_0');
  expect(parser._deduceAttributeName({...attribute, unique_id: 8, metadata: {}}, {})).toBe(
    'CUSTOM_ATTRIBUTE_8'
  );
  expect(parser._getAttributeValues({num_points: () => 2} as any, attribute).value).toBeInstanceOf(
    Float32Array
  );
  const pointAttribute = {
    attribute_type: () => 4,
    num_components: () => 3
  } as any;
  expect(
    parser._getQuantizationTransform(pointAttribute, {quantizedAttributes: ['GENERIC']})
  ).toEqual({
    quantization_bits: 12,
    range: 2,
    min_values: new Float32Array([0, 1, 2])
  });
  expect(
    parser._getOctahedronTransform(pointAttribute, {octahedronAttributes: ['GENERIC']})
  ).toEqual({
    quantization_bits: 12
  });
});

test('DracoParser copies mesh indices and handles metadata absence', () => {
  const parser = createParser();
  const geometry = {num_faces: () => 1, num_points: () => 3} as any;
  expect(Array.from(parser._getTriangleListIndices(geometry))).toEqual([0, 1, 2]);
  expect(parser._getTriangleListIndices(geometry)).toBeInstanceOf(Uint16Array);
  expect(
    parser._getTriangleListIndices({num_faces: () => 1, num_points: () => 65536} as any)
  ).toBeInstanceOf(Uint16Array);
  expect(
    parser._getTriangleListIndices({num_faces: () => 1, num_points: () => 65537} as any)
  ).toBeInstanceOf(Uint32Array);
  expect(Array.from(parser._getTriangleStripIndices(geometry))).toEqual([0, 1, 2, 2, 1, 3]);
  expect(parser._getDracoMetadata({ptr: 0} as any)).toEqual({});
  parser.destroy();
});

test('DracoParser preserves attributes with colliding inferred names', () => {
  const parser = createParser();
  const loaderAttributes = [
    {unique_id: 11, attribute_type: 2, attribute_index: 1},
    {unique_id: 10, attribute_type: 2, attribute_index: 0},
    {unique_id: 13, attribute_type: 3, attribute_index: 3},
    {unique_id: 12, attribute_type: 3, attribute_index: 2}
  ].map(attribute => ({
    ...attribute,
    data_type: 9,
    num_components: 1,
    byte_offset: 0,
    byte_stride: 4,
    normalized: false,
    metadata: {}
  }));
  const loaderData = {
    attributes: Object.fromEntries(
      loaderAttributes.map(attribute => [attribute.unique_id, attribute])
    )
  } as any;
  (parser as any)._getAttributeValues = (_geometry: unknown, attribute: {unique_id: number}) => ({
    value: new Float32Array([attribute.unique_id]),
    size: 1
  });

  const attributes = parser._getMeshAttributes(loaderData, {} as any, {});

  expect(Object.keys(attributes)).toEqual(['COLOR_0', 'COLOR_1', 'TEXCOORD_0', 'TEXCOORD_1']);
  expect(attributes.COLOR_0.value[0]).toBe(10);
  expect(attributes.COLOR_1.value[0]).toBe(11);
  expect(attributes.TEXCOORD_0.value[0]).toBe(12);
  expect(attributes.TEXCOORD_1.value[0]).toBe(13);
});

test('DracoParser safely preserves adversarial metadata names', () => {
  const parser = createParser();
  const unsafeSuffixName = 'CUSTOM_9007199254740992';
  const loaderAttributes = [
    {unique_id: 1, attribute_index: 0, metadata: {name: {string: unsafeSuffixName}}},
    {unique_id: 2, attribute_index: 1, metadata: {name: {string: unsafeSuffixName}}},
    {unique_id: 3, attribute_index: 2, metadata: {name: {string: 'constructor'}}}
  ].map(attribute => ({
    ...attribute,
    attribute_type: 4,
    data_type: 9,
    num_components: 1,
    byte_offset: 0,
    byte_stride: 4,
    normalized: false
  }));
  const loaderData = {
    attributes: Object.fromEntries(
      loaderAttributes.map(attribute => [attribute.unique_id, attribute])
    )
  } as any;
  (parser as any)._getAttributeValues = () => ({value: new Float32Array([1]), size: 1});

  const attributes = parser._getMeshAttributes(loaderData, {} as any, {});

  expect(Object.keys(attributes)).toEqual([
    unsafeSuffixName,
    'CUSTOM_9007199254740993',
    'constructor'
  ]);
});

test('DracoParser reports native extraction failures', () => {
  const parser = createParser();
  const geometry = {num_faces: () => 1, num_points: () => 3} as any;
  const attribute = {
    unique_id: 7,
    attribute_type: 4,
    data_type: 9,
    num_components: 3,
    byte_offset: 0,
    byte_stride: 12,
    normalized: false,
    attribute_index: 0,
    metadata: {}
  } as any;

  parser.decoder.GetTrianglesUInt16Array = () => false;
  expect(() => parser._getTriangleListIndices(geometry)).toThrow(
    'DRACO: Failed to decode triangle indices.'
  );
  parser.decoder.GetAttributeDataArrayForAllPoints = () => false;
  expect(() => parser._getAttributeValues(geometry, attribute)).toThrow(
    'DRACO: Failed to decode attribute 7.'
  );
});

test('DracoParser releases the native decode status after failure', () => {
  const parser = createParser();
  const status = {
    ok: () => false,
    error_msg: () => 'invalid fixture'
  } as any;
  const destroyedObjects: unknown[] = [];
  parser.decoder.GetEncodedGeometryType = () => parser.draco.POINT_CLOUD;
  parser.decoder.DecodeArrayToPointCloud = () => status;
  parser.draco.destroy = object => destroyedObjects.push(object);

  expect(() => parser.parseSync(new ArrayBuffer(8))).toThrow(
    'DRACO decompression failed: invalid fixture'
  );
  expect(destroyedObjects).toContain(status);
});

test('DracoParser reports matching topology and glTF primitive modes', () => {
  const parser = createParser();
  const attributes = {
    POSITION: {value: new Float32Array([0, 0, 0]), size: 3}
  };
  (parser as any)._getMeshAttributes = () => attributes;
  (parser as any)._getTriangleListIndices = () => new Uint16Array([0, 1, 2]);
  (parser as any)._getTriangleStripIndices = () => new Uint32Array([0, 1, 2]);
  const geometry = new (parser.draco.Mesh as any)();

  expect(parser._getMeshData(geometry, {} as any, {topology: 'triangle-list'}).mode).toBe(4);
  expect(parser._getMeshData(geometry, {} as any, {topology: 'triangle-strip'}).mode).toBe(5);
});

test('DracoParser maps supported scalar data types and rejects unknown types', () => {
  const parser = createParser();
  const attribute = {
    unique_id: 1,
    attribute_type: 4,
    num_components: 1,
    byte_offset: 0,
    byte_stride: 4,
    normalized: false,
    attribute_index: 0,
    metadata: {}
  } as any;
  const constructors = [
    Int8Array,
    Uint8Array,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array
  ];
  const dataTypes = [1, 2, 3, 4, 5, 6, 9];

  for (const [index, constructor] of constructors.entries()) {
    expect(
      parser._getAttributeValues({num_points: () => 2} as any, {
        ...attribute,
        data_type: dataTypes[index]
      }).value
    ).toBeInstanceOf(constructor);
  }

  expect(
    parser._getAttributeValues({num_points: () => 2} as any, {...attribute, data_type: 99})
  ).toBeNull();
});
