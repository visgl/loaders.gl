// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeEach, expect, test, vi} from 'vitest';

import DracoBuilder from '../../src/lib/draco-builder';

type FakeDracoState = {
  attributeCalls: string[];
  destroyed: unknown[];
  encoderCalls: string[];
  metadataCalls: string[];
  encodeLength: number;
};

/** Creates a deterministic in-memory substitute for the Draco encoder API. */
function createFakeDraco(): {draco: any; state: FakeDracoState} {
  const state: FakeDracoState = {
    attributeCalls: [],
    destroyed: [],
    encoderCalls: [],
    metadataCalls: [],
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
    EncodePointCloudToDracoBuffer(): number {
      state.encoderCalls.push('pointcloud');
      return state.encodeLength;
    }
  }

  class FakeMeshBuilder {
    private nextAttributeId = 0;

    /** Records indexed faces. */
    AddFacesToMesh(): void {
      state.attributeCalls.push('indices');
    }

    /** Records an Int8 attribute. */
    AddInt8Attribute(): number {
      return this.addAttribute('int8');
    }

    /** Records an Int16 attribute. */
    AddInt16Attribute(): number {
      return this.addAttribute('int16');
    }

    /** Records an Int32 attribute. */
    AddInt32Attribute(): number {
      return this.addAttribute('int32');
    }

    /** Records a Uint8 attribute. */
    AddUInt8Attribute(): number {
      return this.addAttribute('uint8');
    }

    /** Records a Uint16 attribute. */
    AddUInt16Attribute(): number {
      return this.addAttribute('uint16');
    }

    /** Records a Uint32 attribute. */
    AddUInt32Attribute(): number {
      return this.addAttribute('uint32');
    }

    /** Records a Float32 attribute. */
    AddFloatAttribute(): number {
      return this.addAttribute('float32');
    }

    /** Records geometry metadata attachment. */
    AddMetadata(): void {
      state.metadataCalls.push('geometry');
    }

    /** Records attribute metadata attachment. */
    SetMetadataForAttribute(): void {
      state.metadataCalls.push('attribute');
    }

    /** Allocates a deterministic attribute identifier. */
    private addAttribute(type: string): number {
      state.attributeCalls.push(type);
      return this.nextAttributeId++;
    }
  }

  class FakeMetadataBuilder {
    /** Records integer metadata. */
    AddIntEntry(): void {
      state.metadataCalls.push('int');
    }

    /** Records floating-point metadata. */
    AddDoubleEntry(): void {
      state.metadataCalls.push('double');
    }

    /** Records integer-array metadata. */
    AddIntEntryArray(): void {
      state.metadataCalls.push('int-array');
    }

    /** Records string metadata. */
    AddStringEntry(): void {
      state.metadataCalls.push('string');
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
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
        customUint32: new Uint32Array([1, 2]),
        unsupported: new Float64Array([1, 2]),
        ignored: [1, 2]
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
  expect(warning).toHaveBeenCalledOnce();

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
      metadata: new Map<string, any>([
        ['name', 'points'],
        ['count', 2]
      ]) as any
    }
  );

  expect(Array.from(new Uint8Array(output))).toEqual([11, 22, 33]);
  expect(state.encoderCalls).toEqual(['pointcloud']);
  expect(state.attributeCalls).toEqual(['float32']);
});

test('DracoBuilder reports missing positions and encoder failures', () => {
  const meshDraco = createFakeDraco();
  const meshBuilder = new DracoBuilder(meshDraco.draco);
  expect(() =>
    meshBuilder.encodeSync({attributes: {COLOR_0: new Uint8Array([1, 2])}} as any)
  ).toThrow('positions');

  meshDraco.state.encodeLength = 0;
  expect(() =>
    meshBuilder.encodeSync({attributes: {POSITION: new Float32Array([0, 0, 0])}} as any)
  ).toThrow('Draco encoding failed');

  const pointDraco = createFakeDraco();
  pointDraco.state.encodeLength = 0;
  const pointBuilder = new DracoBuilder(pointDraco.draco);
  expect(() =>
    pointBuilder.encodeSync({attributes: {POSITION: new Float32Array([0, 0, 0])}} as any, {
      pointcloud: true
    })
  ).toThrow('Draco encoding failed');
});

test('DracoBuilder maps canonical attribute aliases', () => {
  const {draco} = createFakeDraco();
  const builder = new DracoBuilder(draco) as any;

  expect(builder._getDracoAttributeType('vertices')).toBe(draco.POSITION);
  expect(builder._getDracoAttributeType('normals')).toBe(draco.NORMAL);
  expect(builder._getDracoAttributeType('colors')).toBe(draco.COLOR);
  expect(builder._getDracoAttributeType('texcoords')).toBe(draco.TEX_COORD);
  expect(builder._getDracoAttributeType('featureId')).toBe(draco.GENERIC);
  expect(builder._getPositionAttribute({colors: new Uint8Array([1])})).toBeNull();
  expect(() => builder.destroyEncodedObject(null)).not.toThrow();
});
