// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {
  convertTileset,
  createMeshConversionCodec,
  createTiles3DConversionSpatialContext,
  type MeshConversionInput,
  type EncodedMeshConversionResource,
  type TileConversionSource,
  type TileConversionSink,
  type Tiles3DConversionSpatialContext
} from '@loaders.gl/tile-converter/v5';
import {
  createMeshConversionCodec as createBrowserMeshCodec,
  createTiles3DConversionSpatialContext as createBrowserSpatialContext
} from '@loaders.gl/tile-converter/v5/browser';

/** Creates a selected absolute-coordinate mesh with an exact local origin. */
function createInput(): MeshConversionInput {
  return {
    id: 'triangle.glb',
    origin: [6_378_137, 0, 0],
    mesh: {
      topology: 'triangle-list',
      mode: 4,
      attributes: {
        POSITION: {
          value: new Float64Array([6_378_137.25, 0, 0, 6_378_138.25, 0, 0, 6_378_137.25, 1, 0]),
          size: 3
        }
      },
      indices: {value: new Uint16Array([0, 1, 2]), size: 1}
    }
  };
}

/** Creates a context that preserves geocentric source coordinates in double precision. */
function createSpatialContext(): Tiles3DConversionSpatialContext {
  return createTiles3DConversionSpatialContext({
    sourceCrs: 'EPSG:4978',
    coordinateFrame: 'geocentric',
    heightReference: 'ellipsoidal'
  });
}

/** Runs one selected mesh through the concrete codec without a destination. */
async function encodeInput(
  input: MeshConversionInput,
  spatialContext = createSpatialContext(),
  maxPositionError = 0
) {
  const codec = createMeshConversionCodec({spatialContext, maxPositionError});
  const outputs: EncodedMeshConversionResource[] = [];
  for await (const output of await codec.convert(input, undefined)) outputs.push(output);
  return outputs[0];
}

/** Supplies a destination whose lifecycle can be observed in focused integration tests. */
function createSink(): TileConversionSink<EncodedMeshConversionResource> {
  return {
    write: vi.fn(async () => {}),
    finalize: vi.fn(async () => {}),
    abort: vi.fn(async () => {})
  };
}

test('mesh codec rebases Float64 positions and returns bounds of reconstructed output without mutating inputs', async () => {
  const input = createInput();
  const before = input.mesh.attributes.POSITION.value.slice();
  const output = await encodeInput(input);
  const scenegraph = new GLTFScenegraph(
    await parse(output.glb, GLTFLoader, {gltf: {postProcess: false}})
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(0))).toEqual([
    0.25, 0, 0, 1.25, 0, 0, 0.25, 1, 0
  ]);
  expect(output.origin).toEqual(input.origin);
  expect(output.localBoundingBox).toEqual([
    [0.25, 0, 0],
    [1.25, 1, 0]
  ]);
  expect(output.maximumPositionError).toBe(0);
  expect(output.origin).not.toBe(input.origin);
  expect(output.boundingBox).toEqual([
    [6_378_137.25, 0, 0],
    [6_378_138.25, 1, 0]
  ]);
  expect(output.spatialReference.sourceCrs).toBe('EPSG:4978');
  expect(input.mesh.attributes.POSITION.value).toEqual(before);
});

test('mesh codec applies a real CRS context to absolute positions and normals exactly once', async () => {
  const input = createInput();
  input.mesh.attributes.POSITION.value = new Float64Array([
    1, 1, 100, 1.000001, 1, 100, 1, 1.000001, 100
  ]);
  input.mesh.attributes.NORMAL = {value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3};
  const spatial = createTiles3DConversionSpatialContext(
    {sourceCrs: 'EPSG:4326', heightReference: 'ellipsoidal'},
    {targetCrs: 'EPSG:3857'}
  );
  const expected = spatial.transformPositions(input.mesh.attributes.POSITION.value);
  const tracked = {
    ...spatial,
    transformPositions: vi.fn(spatial.transformPositions),
    transformNormals: vi.fn(spatial.transformNormals)
  };
  const output = await encodeInput(
    {...input, origin: [expected[0], expected[1], expected[2]]},
    tracked,
    0.001
  );
  const scenegraph = new GLTFScenegraph(
    await parse(output.glb, GLTFLoader, {gltf: {postProcess: false}})
  );
  const local = scenegraph.getTypedArrayForAccessor(0) as Float32Array;
  for (let index = 0; index < local.length; index++) {
    expect(Math.abs(local[index] + output.origin[index % 3] - expected[index])).toBeLessThanOrEqual(
      0.001
    );
    expect(local[index] + output.origin[index % 3]).toBeGreaterThanOrEqual(
      output.boundingBox[0][index % 3]
    );
    expect(local[index] + output.origin[index % 3]).toBeLessThanOrEqual(
      output.boundingBox[1][index % 3]
    );
  }
  expect(Array.from(scenegraph.getTypedArrayForAccessor(1))).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  expect(tracked.transformPositions).toHaveBeenCalledTimes(1);
  expect(tracked.transformNormals).toHaveBeenCalledWith(
    input.mesh.attributes.NORMAL.value,
    input.mesh.attributes.POSITION.value
  );
  expect(output.spatialReference).toBe(spatial.spatialReference);
  expect(output.spatialReference.status).toBe('transformed');
  expect(output.spatialReference.targetCrs).toBe('EPSG:3857');
});

test('mesh codec uses rounded geometry for bounds and enforces an inclusive Euclidean precision budget', async () => {
  const input = createInput();
  input.mesh.attributes.POSITION.value = new Float64Array([1.1, 1.1, 0, 2, 0, 0, 0, 2, 0]);
  const error = Math.hypot(Math.fround(1.1) - 1.1, Math.fround(1.1) - 1.1);
  const resource = {...input, origin: [0, 0, 0] as const};
  await expect(encodeInput(resource, createSpatialContext(), error)).resolves.toMatchObject({
    boundingBox: [
      [0, 0, 0],
      [2, 2, 0]
    ]
  });
  await expect(encodeInput(resource, createSpatialContext(), error / 2)).rejects.toMatchObject({
    code: 'MESH_POSITION_PRECISION_EXCEEDED'
  });
  input.mesh.attributes.POSITION.value = new Float64Array([1.1, 0, 0, 1.1, 1, 0, 1.1, 0, 1]);
  const output = await encodeInput(resource, createSpatialContext(), 1e-6);
  expect(output.boundingBox[0][0]).toBe(Math.fround(1.1));
  expect(output.boundingBox[1][0]).toBe(Math.fround(1.1));
});

test('mesh codec supports native local frames and Float32 source positions through browser exports', async () => {
  expect(createBrowserMeshCodec).toBe(createMeshConversionCodec);
  expect(createBrowserSpatialContext).toBe(createTiles3DConversionSpatialContext);
  const input = createInput();
  input.mesh.attributes.POSITION.value = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  const local = createTiles3DConversionSpatialContext({coordinateFrame: 'local'});
  await expect(encodeInput({...input, origin: [0, 0, 0]}, local)).resolves.toMatchObject({
    spatialReference: {coordinateFrame: 'local'}
  });
});

test.each([
  -1,
  NaN,
  Infinity
])('mesh codec rejects invalid precision policy %s', maxPositionError => {
  expect(() =>
    createMeshConversionCodec({spatialContext: createSpatialContext(), maxPositionError})
  ).toThrow(expect.objectContaining({code: 'MESH_PRECISION_LIMIT_INVALID'}));
});

test.each([
  {
    ...createSpatialContext(),
    spatialReference: {
      ...createSpatialContext().spatialReference,
      status: 'transformed' as const,
      sourceCrs: undefined,
      targetCrs: undefined
    }
  },
  createTiles3DConversionSpatialContext({sourceCrs: 'EPSG:4326'}),
  createTiles3DConversionSpatialContext({}),
  {
    ...createSpatialContext(),
    spatialReference: {...createSpatialContext().spatialReference, status: 'unresolved' as const}
  },
  {
    ...createSpatialContext(),
    spatialReference: {...createSpatialContext().spatialReference, status: 'transformable' as const}
  }
])('mesh codec rejects unresolved or non-Cartesian output frames', spatialContext => {
  expect(() => createMeshConversionCodec({spatialContext, maxPositionError: 0})).toThrow(
    expect.objectContaining({code: 'MESH_OUTPUT_FRAME_UNSUPPORTED'})
  );
});

test.each([
  {origin: [0, 0]},
  {origin: [NaN, 0, 0]},
  {origin: [0, Infinity, 0]}
])('mesh codec rejects invalid target origin %j', ({origin}) => {
  return expect(
    encodeInput({...createInput(), origin: origin as [number, number, number]})
  ).rejects.toMatchObject({code: 'MESH_ORIGIN_INVALID'});
});

test.each([
  new Float64Array(6),
  new Float64Array([NaN, 0, 0, 0, 0, 0, 0, 0, 0])
])('mesh codec rejects invalid spatial results', positions => {
  return expect(
    encodeInput(createInput(), {...createSpatialContext(), transformPositions: () => positions})
  ).rejects.toMatchObject({code: 'MESH_TRANSFORM_INVALID'});
});

test('mesh codec rejects float32 overflow and invalid shared geometry before transformation', async () => {
  const input = createInput();
  input.mesh.attributes.POSITION.value = new Float64Array([1e100, 0, 0, 0, 0, 0, 0, 1, 0]);
  await expect(
    encodeInput({...input, origin: [0, 0, 0]}, createSpatialContext(), 1e200)
  ).rejects.toMatchObject({code: 'MESH_POSITION_PRECISION_EXCEEDED'});
  const spatial = {...createSpatialContext(), transformPositions: vi.fn()};
  input.mesh.attributes.POSITION.value = new Uint32Array(9);
  await expect(encodeInput(input, spatial)).rejects.toMatchObject({code: 'MESH_ATTRIBUTE_INVALID'});
  expect(spatial.transformPositions).not.toHaveBeenCalled();
});

test('concrete mesh codec uses awaited writes, byte gates, progress and finalization in convertTileset', async () => {
  const input = createInput();
  const sink = createSink();
  const written: EncodedMeshConversionResource[] = [];
  let reads = 0;
  let closed = false;
  const source: TileConversionSource<undefined, MeshConversionInput> = {
    inspect: async () => undefined,
    read: async function* () {
      try {
        reads++;
        yield input;
        reads++;
        yield {...input, id: 'second.glb'};
      } finally {
        closed = true;
      }
    }
  };
  let releaseWrite!: () => void;
  let notifyWrite!: () => void;
  const writeGate = new Promise<void>(resolve => {
    releaseWrite = resolve;
  });
  const writeStarted = new Promise<void>(resolve => {
    notifyWrite = resolve;
  });
  sink.write = vi.fn(async resource => {
    written.push(resource);
    if (written.length === 1) {
      notifyWrite();
      await writeGate;
    }
  });
  const onProgress = vi.fn();
  const conversion = convertTileset({
    source,
    codec: createMeshConversionCodec({spatialContext: createSpatialContext(), maxPositionError: 0}),
    sink,
    measureInputBytes: resource =>
      resource.mesh.attributes.POSITION.value.byteLength + resource.mesh.indices!.value.byteLength,
    measureOutputBytes: resource => resource.glb.byteLength,
    maxInputResourceBytes: 78,
    onProgress
  });
  await writeStarted;
  try {
    expect(reads).toBe(1);
    expect(sink.finalize).not.toHaveBeenCalled();
  } finally {
    releaseWrite();
  }
  const report = await conversion;
  expect(closed).toBe(true);
  expect(written.map(resource => resource.id)).toEqual(['triangle.glb', 'second.glb']);
  expect(report).toMatchObject({
    inputResources: 2,
    outputResources: 2,
    inputBytes: 156,
    outputBytes: written.reduce((total, resource) => total + resource.glb.byteLength, 0)
  });
  expect(sink.finalize).toHaveBeenCalledWith(report);
  expect(sink.abort).not.toHaveBeenCalled();
  expect(onProgress).toHaveBeenLastCalledWith(
    expect.objectContaining({phase: 'finalize', outputResources: 2})
  );
});

test.each([
  'input limit',
  'output limit',
  'codec',
  'read',
  'write',
  'cancel'
])('mesh conversion aborts and closes its source on %s failure', failure => {
  return (async () => {
    let closed = false;
    const controller = new AbortController();
    const sink = createSink();
    const input = createInput();
    if (failure === 'codec') input.mesh.attributes.COLOR_0 = {value: new Uint8Array(9), size: 3};
    if (failure === 'write')
      sink.write = vi.fn(async () => {
        throw new Error('write failed');
      });
    if (failure === 'cancel')
      sink.write = vi.fn(async () => {
        controller.abort(new Error('cancelled'));
      });
    const source: TileConversionSource<undefined, MeshConversionInput> = {
      inspect: async () => undefined,
      read: async function* () {
        try {
          if (failure === 'read') throw new Error('read failed');
          yield input;
        } finally {
          closed = true;
        }
      }
    };
    await expect(
      convertTileset({
        source,
        codec: createMeshConversionCodec({
          spatialContext: createSpatialContext(),
          maxPositionError: 0
        }),
        sink,
        measureInputBytes: () => 72,
        measureOutputBytes: resource => resource.glb.byteLength,
        maxInputResourceBytes: failure === 'input limit' ? 71 : undefined,
        maxOutputResourceBytes: failure === 'output limit' ? 1 : undefined,
        signal: controller.signal
      })
    ).rejects.toBeInstanceOf(Error);
    expect(closed).toBe(true);
    expect(sink.finalize).not.toHaveBeenCalled();
    expect(sink.abort).toHaveBeenCalledTimes(1);
    if (['input limit', 'output limit', 'codec', 'read'].includes(failure))
      expect(sink.write).not.toHaveBeenCalled();
  })();
});

test('mesh codec observes cancellation before and after synchronous spatial work', async () => {
  for (const cancelDuringTransform of [false, true]) {
    const controller = new AbortController();
    const spatial = createSpatialContext();
    const tracked = {
      ...spatial,
      transformPositions: vi.fn(positions => {
        controller.abort(new Error('cancelled'));
        return spatial.transformPositions(positions);
      })
    };
    if (!cancelDuringTransform) controller.abort(new Error('cancelled'));
    const codec = createMeshConversionCodec({spatialContext: tracked, maxPositionError: 0});
    await expect(
      (async () => {
        for await (const _output of await codec.convert(
          createInput(),
          undefined,
          controller.signal
        )) {
          throw new Error('unexpected output');
        }
      })()
    ).rejects.toThrow('cancelled');
    expect(tracked.transformPositions).toHaveBeenCalledTimes(cancelDuringTransform ? 1 : 0);
  }
});

test('mesh codec rejects invalid transformed normals without changing source normals', async () => {
  const input = createInput();
  const normals = new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  input.mesh.attributes.NORMAL = {value: normals, size: 3};
  const spatial = {
    ...createSpatialContext(),
    transformNormals: () => new Float32Array(9).fill(NaN)
  };
  await expect(encodeInput(input, spatial)).rejects.toMatchObject({
    code: 'MESH_ATTRIBUTE_NONFINITE'
  });
  expect(normals).toEqual(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]));
});

test('mesh codec records authorized rounding in the shared conversion report', async () => {
  const input = createInput();
  input.mesh.attributes.POSITION.value = new Float64Array([1.1, 0, 0, 1.1, 1, 0, 1.1, 0, 1]);
  const source: TileConversionSource<undefined, MeshConversionInput> = {
    inspect: async () => undefined,
    read: async function* () {
      yield {...input, origin: [0, 0, 0]};
    }
  };
  const sink = createSink();
  const report = await convertTileset({
    source,
    codec: createMeshConversionCodec({
      spatialContext: createSpatialContext(),
      maxPositionError: 1e-6
    }),
    sink,
    measureInputBytes: () => 78,
    measureOutputBytes: resource => resource.glb.byteLength
  });
  expect(report.diagnostics).toEqual([
    {
      code: 'MESH_POSITION_ROUNDING',
      severity: 'info',
      resourceId: input.id,
      message: expect.stringContaining('reconstruction error')
    }
  ]);
  expect(sink.write).toHaveBeenCalledWith(
    expect.objectContaining({maximumPositionError: Math.abs(Math.fround(1.1) - 1.1)}),
    undefined
  );
});

test('zero precision budget rejects loss of subnormal Float64 positions', async () => {
  const input = createInput();
  input.mesh.attributes.POSITION.value = new Float64Array([1e-200, 0, 0, 1, 0, 0, 0, 1, 0]);
  await expect(encodeInput({...input, origin: [0, 0, 0]})).rejects.toMatchObject({
    code: 'MESH_POSITION_PRECISION_EXCEEDED'
  });
});

test('mesh codec preserves selected colors and material through spatial conversion and awaited output', async () => {
  const input = createInput();
  input.mesh.attributes.COLOR_0 = {value: new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]), size: 3};
  const selectedInput = {
    ...input,
    material: {baseColorFactor: [0.5, 1, 1, 1] as const, metallicFactor: 0, roughnessFactor: 1}
  };
  const before = structuredClone(selectedInput);
  const outputs: EncodedMeshConversionResource[] = [];
  const report = await convertTileset({
    source: {
      inspect: async () => undefined,
      read: async function* () {
        yield selectedInput;
      }
    },
    codec: createMeshConversionCodec({spatialContext: createSpatialContext(), maxPositionError: 0}),
    measureInputBytes: () => 114,
    measureOutputBytes: resource => resource.glb.byteLength,
    sink: {
      ...createSink(),
      write: async output => {
        outputs.push(output);
      }
    }
  });
  const scenegraph = new GLTFScenegraph(
    await parse(outputs[0].glb, GLTFLoader, {gltf: {postProcess: false}})
  );
  const primitive = scenegraph.json.meshes![0].primitives[0];
  expect(Array.from(scenegraph.getTypedArrayForAccessor(primitive.attributes.COLOR_0))).toEqual([
    1, 0, 0, 0, 1, 0, 0, 0, 1
  ]);
  expect(scenegraph.json.materials![primitive.material!]).toMatchObject({
    pbrMetallicRoughness: selectedInput.material
  });
  expect(report.outputResources).toBe(1);
  expect(outputs[0].maximumPositionError).toBe(0);
  expect(selectedInput).toEqual(before);
});

test('mesh codec aborts the sink instead of dropping unsupported selected material properties', async () => {
  const input = {
    ...createInput(),
    material: {normalTexture: {index: 0}}
  } as unknown as MeshConversionInput;
  const sink = createSink();
  await expect(
    convertTileset({
      source: {
        inspect: async () => undefined,
        read: async function* () {
          yield input;
        }
      },
      codec: createMeshConversionCodec({
        spatialContext: createSpatialContext(),
        maxPositionError: 0
      }),
      sink,
      measureInputBytes: () => 78,
      measureOutputBytes: resource => resource.glb.byteLength
    })
  ).rejects.toMatchObject({code: 'MESH_MATERIAL_UNSUPPORTED'});
  expect(sink.write).not.toHaveBeenCalled();
  expect(sink.abort).toHaveBeenCalledOnce();
});

test('mesh codec retains selected UVs, image sampling and transform while rebasing positions', async () => {
  const data = new Uint8Array(
    await (
      await fetchFile(new URL('./data/tile-converter-texture.png', import.meta.url).href)
    ).arrayBuffer()
  );
  const input = createInput();
  input.mesh.attributes.TEXCOORD_0 = {value: new Float32Array([0, 0, 1, 0, 0, 1]), size: 2};
  const selectedInput = {
    ...input,
    material: {
      baseColorTexture: {
        data,
        mimeType: 'image/png' as const,
        transform: {offset: [0, 1] as const, rotation: Math.PI / 2, scale: [0.5, -0.5] as const},
        sampler: {
          wrapS: 33071 as const,
          wrapT: 33648 as const,
          minFilter: 9987 as const,
          magFilter: 9729 as const
        }
      }
    }
  };
  const before = structuredClone(selectedInput);
  const output = await encodeInput(selectedInput);
  const scenegraph = new GLTFScenegraph(
    await parse(output.glb, GLTFLoader, {
      gltf: {
        postProcess: false,
        loadImages: false,
        excludeExtensions: {KHR_texture_transform: false}
      }
    })
  );
  const primitive = scenegraph.json.meshes![0].primitives[0];
  expect(Array.from(scenegraph.getTypedArrayForAccessor(primitive.attributes.TEXCOORD_0))).toEqual([
    0, 0, 1, 0, 0, 1
  ]);
  expect(
    scenegraph.json.materials![primitive.material!].pbrMetallicRoughness!.baseColorTexture
  ).toEqual({
    index: 0,
    extensions: {KHR_texture_transform: selectedInput.material.baseColorTexture.transform}
  });
  expect(scenegraph.json.extensionsUsed).toContain('KHR_texture_transform');
  expect(scenegraph.json.extensionsRequired).toContain('KHR_texture_transform');
  expect(scenegraph.getTypedArrayForBufferView(scenegraph.json.images![0].bufferView!)).toEqual(
    data
  );
  expect(scenegraph.json.textures![0].sampler).toBe(0);
  expect(scenegraph.json.samplers).toEqual([selectedInput.material.baseColorTexture.sampler]);
  expect(output.origin).toEqual(input.origin);
  expect(output.maximumPositionError).toBe(0);
  expect(selectedInput).toEqual(before);
});

test('mesh codec retains integer appearance through spatial conversion', async () => {
  const input = createInput();
  input.mesh.attributes.COLOR_0 = {
    value: new Uint16Array([0, 65535, 32768, 65535, 0, 1, 1, 0, 65535]),
    size: 3,
    normalized: true
  };
  input.mesh.attributes.TEXCOORD_0 = {
    value: new Uint8Array([0, 0, 255, 0, 0, 255]),
    size: 2,
    normalized: true
  };
  const before = structuredClone(input);
  const output = await encodeInput(input);
  const scenegraph = new GLTFScenegraph(
    await parse(output.glb, GLTFLoader, {gltf: {postProcess: false}})
  );
  const attributes = scenegraph.json.meshes![0].primitives[0].attributes;
  for (const name of ['COLOR_0', 'TEXCOORD_0']) {
    expect(scenegraph.json.accessors![attributes[name]].normalized).toBe(true);
    expect(scenegraph.getTypedArrayForAccessor(attributes[name])).toEqual(
      input.mesh.attributes[name].value
    );
  }
  expect(output.origin).toEqual(input.origin);
  expect(output.maximumPositionError).toBe(0);
  expect(input).toEqual(before);
});
