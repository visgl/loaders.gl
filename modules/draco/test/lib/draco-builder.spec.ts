// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';

import DracoBuilder from '../../src/lib/draco-builder';

type FakeDracoState = {
  attributeCalls: string[];
  attributeTypes: number[];
  attributeValues: number[][];
  destroyed: unknown[];
  encoderCalls: string[];
  metadataCalls: string[];
  metadataEntries: Array<{key: string; value: unknown}>;
  normalizedCalls: Array<{attributeId: number; normalized: boolean}>;
  encodeLength: number;
};

/** Creates a deterministic in-memory substitute for the Draco encoder API. */
function createFakeDraco(): {draco: any; state: FakeDracoState} {
  const state: FakeDracoState = {
    attributeCalls: [],
    attributeTypes: [],
    attributeValues: [],
    destroyed: [],
    encoderCalls: [],
    metadataCalls: [],
    metadataEntries: [],
    normalizedCalls: [],
    encodeLength: 3
  };

  class FakeGeometry {
    /** Returns the point count used by log messages. */
    num_points(): number {
      return 2;
    }

    /** Returns the attribute count used by log messages. */
    num_attributes(): number {
      return state.attributeCalls.length;
    }
  }

  class FakeDracoInt8Array {
    readonly values = [11, 22, 33];

    /** Returns the encoded byte count. */
    size(): number {
      return this.values.length;
    }

    /** Returns one encoded byte. */
    GetValue(index: number): number {
      return this.values[index];
    }
  }

  class FakeEncoder {
    /** Records encoder speed configuration. */
    SetSpeedOptions(encodeSpeed: number, decodeSpeed: number): void {
      state.encoderCalls.push(`speed:${encodeSpeed}:${decodeSpeed}`);
    }

    /** Records the selected mesh encoding method. */
    SetEncodingMethod(method: number): void {
      state.encoderCalls.push(`method:${method}`);
    }

    /** Records attribute quantization configuration. */
    SetAttributeQuantization(attribute: number, bits: number): void {
      state.encoderCalls.push(`quantization:${attribute}:${bits}`);
    }

    /** Produces deterministic mesh output. */
    EncodeMeshToDracoBuffer(): number {
      state.encoderCalls.push('mesh');
      return state.encodeLength;
    }

    /** Produces deterministic point-cloud output. */
    EncodePointCloudToDracoBuffer(_pointCloud: unknown, deduplicateValues: boolean): number {
      state.encoderCalls.push(`pointcloud:${deduplicateValues}`);
      return state.encodeLength;
    }
  }

  class FakeExpertEncoder {
    /** Records construction against a completed Draco geometry. */
    constructor(_pointCloud: unknown) {
      state.encoderCalls.push('expert');
    }

    /** Records expert encoder speed configuration. */
    SetSpeedOptions(encodeSpeed: number, decodeSpeed: number): void {
      state.encoderCalls.push(`expert-speed:${encodeSpeed}:${decodeSpeed}`);
    }

    /** Records the selected expert mesh encoding method. */
    SetEncodingMethod(method: number): void {
      state.encoderCalls.push(`expert-method:${method}`);
    }

    /** Records per-attribute quantization configuration. */
    SetAttributeQuantization(attributeId: number, bits: number): void {
      state.encoderCalls.push(`expert-quantization:${attributeId}:${bits}`);
    }

    /** Records explicit per-attribute quantization configuration. */
    SetAttributeExplicitQuantization(
      attributeId: number,
      bits: number,
      componentCount: number,
      origin: number[],
      range: number
    ): void {
      state.encoderCalls.push(
        `expert-explicit:${attributeId}:${bits}:${componentCount}:${origin.join(',')}:${range}`
      );
    }

    /** Produces deterministic expert-encoder output. */
    EncodeToDracoBuffer(deduplicateValues: boolean): number {
      state.encoderCalls.push(`expert-encode:${deduplicateValues}`);
      return state.encodeLength;
    }
  }

  class FakeMeshBuilder {
    private nextAttributeId = 0;

    /** Records indexed faces. */
    AddFacesToMesh(_mesh: unknown, _faceCount: number, values: Uint16Array | Uint32Array): void {
      state.attributeCalls.push('indices');
      state.attributeValues.push(Array.from(values));
    }

    /** Records an Int8 attribute. */
    AddInt8Attribute(
      _mesh: unknown,
      type: number,
      _vertexCount: number,
      _size: number,
      values: Int8Array
    ): number {
      return this.addAttribute('int8', type, values);
    }

    /** Records an Int16 attribute. */
    AddInt16Attribute(
      _mesh: unknown,
      type: number,
      _vertexCount: number,
      _size: number,
      values: Int16Array
    ): number {
      return this.addAttribute('int16', type, values);
    }

    /** Records an Int32 attribute. */
    AddInt32Attribute(
      _mesh: unknown,
      type: number,
      _vertexCount: number,
      _size: number,
      values: Int32Array
    ): number {
      return this.addAttribute('int32', type, values);
    }

    /** Records a Uint8 attribute. */
    AddUInt8Attribute(
      _mesh: unknown,
      type: number,
      _vertexCount: number,
      _size: number,
      values: Uint8Array
    ): number {
      return this.addAttribute('uint8', type, values);
    }

    /** Records a Uint16 attribute. */
    AddUInt16Attribute(
      _mesh: unknown,
      type: number,
      _vertexCount: number,
      _size: number,
      values: Uint16Array
    ): number {
      return this.addAttribute('uint16', type, values);
    }

    /** Records a Uint32 attribute. */
    AddUInt32Attribute(
      _mesh: unknown,
      type: number,
      _vertexCount: number,
      _size: number,
      values: Uint32Array
    ): number {
      return this.addAttribute('uint32', type, values);
    }

    /** Records a Float32 attribute. */
    AddFloatAttribute(
      _mesh: unknown,
      type: number,
      _vertexCount: number,
      _size: number,
      values: Float32Array
    ): number {
      return this.addAttribute('float32', type, values);
    }

    /** Records geometry metadata attachment. */
    AddMetadata(): void {
      state.metadataCalls.push('geometry');
    }

    /** Records attribute metadata attachment. */
    SetMetadataForAttribute(): void {
      state.metadataCalls.push('attribute');
    }

    /** Records normalized attribute declarations. */
    SetNormalizedFlagForAttribute(
      _mesh: unknown,
      attributeId: number,
      normalized: boolean
    ): boolean {
      state.normalizedCalls.push({attributeId, normalized});
      return true;
    }

    /** Allocates a deterministic attribute identifier. */
    private addAttribute(name: string, type: number, values: ArrayLike<number>): number {
      state.attributeCalls.push(name);
      state.attributeTypes.push(type);
      state.attributeValues.push(Array.from(values));
      return this.nextAttributeId++;
    }
  }

  class FakeMetadataBuilder {
    /** Records integer metadata. */
    AddIntEntry(_metadata: unknown, key: string, value: number): void {
      state.metadataCalls.push('int');
      state.metadataEntries.push({key, value});
    }

    /** Records floating-point metadata. */
    AddDoubleEntry(_metadata: unknown, key: string, value: number): void {
      state.metadataCalls.push('double');
      state.metadataEntries.push({key, value});
    }

    /** Records integer-array metadata. */
    AddIntEntryArray(_metadata: unknown, key: string, value: Int32Array): void {
      state.metadataCalls.push('int-array');
      state.metadataEntries.push({key, value});
    }

    /** Records string metadata. */
    AddStringEntry(_metadata: unknown, key: string, value: string): void {
      state.metadataCalls.push('string');
      state.metadataEntries.push({key, value});
    }
  }

  const draco = {
    POSITION: 0,
    NORMAL: 1,
    COLOR: 2,
    TEX_COORD: 3,
    GENERIC: 4,
    MESH_EDGEBREAKER_ENCODING: 9,
    Encoder: FakeEncoder,
    ExpertEncoder: FakeExpertEncoder,
    MeshBuilder: FakeMeshBuilder,
    MetadataBuilder: FakeMetadataBuilder,
    Mesh: FakeGeometry,
    PointCloud: FakeGeometry,
    Metadata: class {},
    DracoInt8Array: FakeDracoInt8Array,
    destroy(object: unknown): void {
      state.destroyed.push(object);
    }
  };

  return {draco, state};
}

beforeEach(() => {
  vi.restoreAllMocks();
});

test('DracoBuilder encodes meshes with every supported attribute representation', () => {
  const {draco, state} = createFakeDraco();
  const builder = new DracoBuilder(draco);
  const output = builder.encodeSync(
    {
      attributes: {
        POSITION: new Float32Array([0, 0, 0, 1, 1, 1]),
        NORMAL: new Int8Array([0, 1, 2, 3, 4, 5]),
        COLOR_0: new Uint8ClampedArray([1, 2, 3, 4]),
        TEXCOORD_0: new Uint16Array([0, 1, 2, 3]),
        customInt16: new Int16Array([1, 2]),
        customInt32: new Int32Array([1, 2]),
        customUint8: new Uint8Array([1, 2]),
        customUint32: new Uint32Array([1, 2])
      },
      indices: new Uint32Array([0, 1, 0])
    } as any,
    {
      speed: [2, 4],
      method: 'MESH_EDGEBREAKER_ENCODING',
      quantization: {POSITION: 12},
      metadata: {
        author: 'loaders.gl',
        integer: 7,
        decimal: 1.5,
        values: new Int32Array([1, 2])
      } as any,
      attributesMetadata: {POSITION: {semantic: 'position'}}
    }
  );

  expect(Array.from(new Uint8Array(output))).toEqual([11, 22, 33]);
  expect(state.encoderCalls).toEqual(['speed:2:4', 'method:9', 'quantization:0:12', 'mesh']);
  expect(state.attributeCalls).toEqual([
    'indices',
    'float32',
    'int8',
    'uint8',
    'uint16',
    'int16',
    'int32',
    'uint8',
    'uint32'
  ]);
  expect(state.metadataCalls).toContain('geometry');
  expect(state.metadataCalls).toContain('int');
  expect(state.metadataCalls).toContain('double');
  expect(state.metadataCalls).toContain('int-array');
  expect(state.metadataCalls).toContain('string');
  builder.destroy();
  expect(state.destroyed.length).toBeGreaterThan(4);
});

test('DracoBuilder encodes point clouds and accepts Map metadata', () => {
  const {draco, state} = createFakeDraco();
  const builder = new DracoBuilder(draco);
  const output = builder.encodeSync(
    {attributes: {positions: new Float32Array([0, 0, 0, 1, 1, 1])}} as any,
    {
      pointcloud: true,
      deduplicateValues: true,
      metadata: new Map<string, any>([
        ['name', 'points'],
        ['count', 2]
      ]) as any
    }
  );

  expect(Array.from(new Uint8Array(output))).toEqual([11, 22, 33]);
  expect(state.encoderCalls).toEqual(['pointcloud:true']);
  expect(state.attributeCalls).toEqual(['float32']);
});

test('DracoBuilder applies exact attribute quantization with ExpertEncoder', () => {
  const {draco, state} = createFakeDraco();
  const builder = new DracoBuilder(draco);

  builder.encodeSync(
    {
      attributes: {
        POSITION: new Float32Array([0, 0, 0, 1, 1, 1]),
        TEXCOORD_0: new Float32Array([0, 0, 1, 1]),
        TEXCOORD_1: new Float32Array([-1, -1, 1, 1])
      },
      indices: new Uint16Array([0, 1, 0])
    },
    {
      speed: [1, 3],
      method: 'MESH_EDGEBREAKER_ENCODING',
      quantization: {POSITION: 12, TEX_COORD: 8},
      attributeQuantization: {
        TEXCOORD_1: {bits: 14, origin: [-1, -1], range: 2}
      }
    }
  );

  expect(state.encoderCalls).toEqual([
    'expert',
    'expert-speed:1:3',
    'expert-method:9',
    'expert-quantization:0:12',
    'expert-quantization:1:8',
    'expert-explicit:2:14:2:-1,-1:2',
    'expert-encode:false'
  ]);
  expect(state.destroyed).toHaveLength(3);
});

test('DracoBuilder uses ExpertEncoder for exact point-cloud quantization', () => {
  const {draco, state} = createFakeDraco();
  const builder = new DracoBuilder(draco);

  builder.encodeSync(
    {attributes: {POSITION: new Float32Array([0, 0, 0, 1, 1, 1])}},
    {
      pointcloud: true,
      deduplicateValues: true,
      attributeQuantization: {POSITION: 10}
    }
  );

  expect(state.encoderCalls).toEqual(['expert', 'expert-quantization:0:10', 'expert-encode:true']);
});

test.each([
  [{attributeQuantization: {missing: 8}}, 'quantized attribute "missing" does not exist'],
  [{attributeQuantization: {POSITION: 0}}, 'must be an integer from 1 to 30'],
  [
    {attributeQuantization: {POSITION: {bits: 8, origin: [0, 0], range: 1}}},
    'must contain 3 values'
  ],
  [
    {attributeQuantization: {POSITION: {bits: 8, origin: [0, 0, Infinity], range: 1}}},
    'origin for "POSITION" must be finite'
  ],
  [
    {attributeQuantization: {POSITION: {bits: 8, origin: [0, 0, 0], range: 0}}},
    'range for "POSITION" must be positive'
  ],
  [{quantization: {POSITION: 31}}, 'must be an integer from 1 to 30']
])('DracoBuilder validates quantization options', (options, message) => {
  const {draco} = createFakeDraco();
  const builder = new DracoBuilder(draco);
  const mesh = {attributes: {POSITION: new Float32Array([0, 0, 0])}};

  expect(() => builder.encodeSync(mesh, options as any)).toThrow(message);
});

test('DracoBuilder reports missing positions and encoder failures', () => {
  const meshDraco = createFakeDraco();
  const meshBuilder = new DracoBuilder(meshDraco.draco);
  expect(() =>
    meshBuilder.encodeSync({attributes: {COLOR_0: new Uint8Array([1, 2])}} as any)
  ).toThrow('POSITION attribute is required');

  meshDraco.state.encodeLength = 0;
  expect(() =>
    meshBuilder.encodeSync({attributes: {POSITION: new Float32Array([0, 0, 0])}} as any)
  ).toThrow('Draco encoding failed');
  expect(meshDraco.state.destroyed).toHaveLength(4);

  const pointDraco = createFakeDraco();
  pointDraco.state.encodeLength = 0;
  const pointBuilder = new DracoBuilder(pointDraco.draco);
  expect(() =>
    pointBuilder.encodeSync({attributes: {POSITION: new Float32Array([0, 0, 0])}} as any, {
      pointcloud: true
    })
  ).toThrow('Draco encoding failed');
});

test('DracoBuilder validates attribute arrays and triangle indices', () => {
  const {draco} = createFakeDraco();
  const builder = new DracoBuilder(draco);
  const position = new Float32Array([0, 0, 0, 1, 1, 1]);

  expect(() =>
    builder.encodeSync({
      attributes: {POSITION: position, NORMAL: {value: new Int8Array([1, 2, 3]), size: 3}}
    })
  ).toThrow('attribute "NORMAL" has 3 values, expected 6');
  expect(() =>
    builder.encodeSync({attributes: {POSITION: position}, indices: new Uint16Array([0, 1])})
  ).toThrow('indices length must be divisible by 3');
  expect(() =>
    builder.encodeSync({attributes: {POSITION: position}, indices: new Uint16Array([0, 1, 2])})
  ).toThrow('triangle index 2 is outside vertex range 0-1');
  expect(() =>
    builder.encodeSync({attributes: {POSITION: position, invalid: new Float64Array([1, 2])}})
  ).toThrow('attribute "invalid" uses unsupported Float64Array');
});

test('DracoBuilder maps canonical attribute aliases', () => {
  const {draco} = createFakeDraco();
  const builder = new DracoBuilder(draco) as any;

  expect(builder._getDracoAttributeType('vertices')).toBe(draco.POSITION);
  expect(builder._getDracoAttributeType('normals')).toBe(draco.NORMAL);
  expect(builder._getDracoAttributeType('colors')).toBe(draco.COLOR);
  expect(builder._getDracoAttributeType('texcoords')).toBe(draco.TEX_COORD);
  expect(builder._getDracoAttributeType('TEXCOORD_1')).toBe(draco.TEX_COORD);
  expect(builder._getDracoAttributeType('COLOR_2')).toBe(draco.COLOR);
  expect(builder._getDracoAttributeType('featureId', {featureId: 'COLOR'})).toBe(draco.COLOR);
  expect(builder._getDracoAttributeType('featureId')).toBe(draco.GENERIC);
  expect(builder._getPositionAttribute({colors: new Uint8Array([1])})).toBeNull();
  expect(() => builder.destroyEncodedObject(null)).not.toThrow();
});

test('DracoBuilder preserves application names with a configurable metadata key', () => {
  const {draco, state} = createFakeDraco();
  const builder = new DracoBuilder(draco);

  builder.encodeSync(
    {
      attributes: {
        coordinates: new Float32Array([0, 0, 0, 1, 1, 1]),
        TEXCOORD_1: new Uint16Array([0, 1, 2, 3])
      },
      indices: new Uint16Array([0, 1, 0])
    },
    {
      attributeNameEntry: 'semantic',
      attributeTypes: {coordinates: 'POSITION'},
      attributesMetadata: {TEXCOORD_1: {set: 1}}
    }
  );

  expect(state.attributeTypes).toEqual([draco.POSITION, draco.TEX_COORD]);
  expect(state.metadataEntries).toEqual(
    expect.arrayContaining([
      {key: 'semantic', value: 'coordinates'},
      {key: 'semantic', value: 'TEXCOORD_1'},
      {key: 'set', value: 1}
    ])
  );
});

test('DracoBuilder preserves typed-array view bounds and normalized MeshAttribute metadata', () => {
  const {draco, state} = createFakeDraco();
  const builder = new DracoBuilder(draco);
  const positionBacking = new Float32Array([99, 99, 99, 0, 0, 0, 1, 1, 1, 88, 88, 88]);
  const normalBacking = new Int8Array([99, 0, 1, 2, 3, 4, 5, 88]);

  builder.encodeSync({
    attributes: {
      POSITION: {value: positionBacking.subarray(3, 9), size: 3},
      NORMAL: {value: normalBacking.subarray(1, 7), size: 3, normalized: true}
    },
    indices: new Uint16Array([0, 1, 0])
  });

  expect(state.attributeValues).toEqual([
    [0, 1, 0],
    [0, 0, 0, 1, 1, 1],
    [0, 1, 2, 3, 4, 5]
  ]);
  expect(state.normalizedCalls).toEqual([{attributeId: 1, normalized: true}]);
});
