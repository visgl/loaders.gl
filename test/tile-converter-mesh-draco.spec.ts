// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {validateBytes} from 'gltf-validator';
import {GLBLoader, GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {
  convertTileset,
  createMeshConversionCodec,
  createTiles3DConversionSpatialContext,
  createSingleMeshTilesetSink,
  createSingleMeshTilesetArchive,
  type MeshConversionInput,
  type EncodedMeshConversionResource
} from '@loaders.gl/tile-converter/v5/browser';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {BlobFile} from '@loaders.gl/loader-utils';

/** Creates two adjacent triangles with exact but irregular coordinates and unique appearance. */
function createInput(): MeshConversionInput {
  return {
    id: 'mesh.glb',
    origin: [6378137, 0, 0],
    mesh: {
      topology: 'triangle-list',
      mode: 4,
      attributes: {
        POSITION: {
          size: 3,
          value: new Float64Array([
            6378137.125, 0.25, 0.5, 6378138.125, 0.25, 0.5, 6378137.125, 1.25, 0.5, 6378138.125,
            1.25, 0.5
          ])
        },
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1])},
        COLOR_0: {
          size: 4,
          normalized: true,
          value: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 0, 255])
        },
        TEXCOORD_0: {
          size: 2,
          normalized: true,
          value: new Uint16Array([0, 0, 65535, 0, 0, 65535, 65535, 65535])
        }
      },
      indices: {size: 1, value: new Uint16Array([0, 1, 2, 1, 3, 2])}
    }
  };
}

/** Runs the default compressed v5 codec with local WASM assets. */
async function encodeInput(input: MeshConversionInput, draco = true) {
  const codec = createMeshConversionCodec({
    spatialContext: createTiles3DConversionSpatialContext({
      sourceCrs: 'EPSG:4978',
      coordinateFrame: 'geocentric',
      axisOrder: 'xyz',
      heightReference: 'ellipsoidal'
    }),
    maxPositionError: 0,
    dracoLibraryOptions: {useLocalLibraries: true},
    ...(draco ? {} : {draco: false})
  });
  const outputs: EncodedMeshConversionResource[] = [];
  for await (const output of codec.convert(input, undefined)) outputs.push(output);
  return outputs[0];
}

test('v5 defaults to lossless Edge Breaker with no uncompressed geometry fallback', async () => {
  const input = createInput();
  const original = input.mesh.attributes.POSITION.value.slice();
  const output = await encodeInput(input);
  const container = await parse(output.glb, GLBLoader, {glb: {strict: true}});
  expect(container.json.extensionsRequired).toContain('KHR_draco_mesh_compression');
  const primitive = container.json.meshes[0].primitives[0];
  expect(container.json.bufferViews).toHaveLength(1);
  expect(container.json.accessors.every(accessor => accessor.bufferView === undefined)).toBe(true);
  const view =
    container.json.bufferViews[primitive.extensions.KHR_draco_mesh_compression.bufferView];
  const data = new Uint8Array(
    container.binChunks[0].arrayBuffer,
    container.binChunks[0].byteOffset + view.byteOffset,
    view.byteLength
  );
  expect(new TextDecoder().decode(data.subarray(0, 5))).toBe('DRACO');
  expect(Array.from(data.subarray(7, 9))).toEqual([1, 1]);
  const scene = new GLTFScenegraph(
    await parse(output.glb, GLTFLoader, {
      core: {useLocalLibraries: true, worker: false},
      gltf: {postProcess: false, decompressMeshes: true}
    })
  );
  const decodedPrimitive = scene.json.meshes![0].primitives[0];
  const indices = (decodedPrimitive.indices as unknown as {value: Uint32Array}).value;
  const attributeNames = ['POSITION', 'NORMAL', 'COLOR_0', 'TEXCOORD_0'];
  const decodedCorners = Array.from(indices, vertexIndex =>
    attributeNames
      .flatMap(name => {
        const attribute = input.mesh.attributes[name];
        return Array.from(
          (decodedPrimitive.attributes[name] as unknown as {value: Float32Array}).value.slice(
            vertexIndex * attribute.size,
            (vertexIndex + 1) * attribute.size
          )
        );
      })
      .join(',')
  );
  const inputCorners = Array.from(input.mesh.indices!.value, vertexIndex =>
    attributeNames
      .flatMap(name => {
        const attribute = input.mesh.attributes[name];
        return Array.from(
          attribute.value.slice(vertexIndex * attribute.size, (vertexIndex + 1) * attribute.size),
          (value, axis) => (name === 'POSITION' ? value - input.origin[axis] : value)
        );
      })
      .join(',')
  );
  expect(getOrientedTriangles(decodedCorners)).toEqual(getOrientedTriangles(inputCorners));
  expect(container.json.accessors[primitive.attributes.POSITION]).toMatchObject({
    min: output.localBoundingBox[0],
    max: output.localBoundingBox[1],
    count: 4
  });
  const validation = await validateBytes(new Uint8Array(output.glb), {writeTimestamp: false});
  expect(validation.issues.numErrors).toBe(0);
  expect((decodedPrimitive.attributes.COLOR_0 as unknown as {normalized: boolean}).normalized).toBe(
    true
  );
  expect(
    (decodedPrimitive.attributes.TEXCOORD_0 as unknown as {normalized: boolean}).normalized
  ).toBe(true);
  expect(output.maximumPositionError).toBe(0);
  expect(output.localBoundingBox).toEqual([
    [0.125, 0.25, 0.5],
    [1.125, 1.25, 0.5]
  ]);
  expect(input.mesh.attributes.POSITION.value).toEqual(original);
});

test('v5 draco false emits the existing uncompressed profile', async () => {
  const output = await encodeInput(createInput(), false);
  const container = await parse(output.glb, GLBLoader, {glb: {strict: true}});
  expect(container.json.extensionsUsed ?? []).not.toContain('KHR_draco_mesh_compression');
  expect(container.json.accessors[0].bufferView).toBeDefined();
});

/** Compares triangles while allowing reordered faces and cyclic rotation, but not reversed winding. */
function getOrientedTriangles(corners: string[]): string[] {
  const triangles: string[] = [];
  for (let index = 0; index < corners.length; index += 3) {
    const triangle = corners.slice(index, index + 3);
    triangles.push(
      [0, 1, 2]
        .map(offset => [...triangle.slice(offset), ...triangle.slice(0, offset)].join(';'))
        .sort()[0]
    );
  }
  return triangles.sort();
}

test.each([
  true,
  false
])('compressed accessor counts and bounds match decoded indexed=%s geometry', async indexed => {
  const input = createInput();
  input.mesh.attributes = {
    POSITION: {
      size: 3,
      value: new Float64Array([
        6378137,
        0,
        0,
        6378138,
        0,
        0,
        6378137,
        1,
        0,
        ...(indexed ? [6379137, 1000, 1000] : [])
      ])
    }
  };
  input.mesh.indices = indexed ? {size: 1, value: new Uint16Array([0, 1, 2])} : undefined;
  const output = await encodeInput(input);
  const container = await parse(output.glb, GLBLoader);
  expect(container.json.accessors.map(accessor => accessor.count)).toEqual([3, 3]);
  expect(output.localBoundingBox).toEqual([
    [0, 0, 0],
    [1, 1, 0]
  ]);
  expect(container.json.accessors[0]).toMatchObject({min: [0, 0, 0], max: [1, 1, 0]});
});

test('compressed GLB retains encoded image bytes, sampler and texture transform', async () => {
  const input = createInput();
  const image = new Uint8Array(
    await (
      await fetchFile(new URL('./data/tile-converter-texture.png', import.meta.url).href)
    ).arrayBuffer()
  );
  const sampler = {wrapS: 33071, wrapT: 33648, minFilter: 9987, magFilter: 9729};
  const transform = {offset: [0.25, -0.5], rotation: Math.PI / 2, scale: [0.5, 2]};
  const textured = {
    ...input,
    material: {
      baseColorTexture: {data: image, mimeType: 'image/png' as const, sampler, transform},
      doubleSided: true
    }
  };
  const output = await encodeInput(textured);
  const container = await parse(output.glb, GLBLoader);
  const primitive = container.json.meshes[0].primitives[0];
  expect(container.json.extensionsRequired).toEqual(
    expect.arrayContaining(['KHR_draco_mesh_compression', 'KHR_texture_transform'])
  );
  expect(container.json.bufferViews).toHaveLength(2);
  expect(container.json.samplers).toEqual([sampler]);
  expect(container.json.materials[primitive.material]).toMatchObject({
    doubleSided: true,
    pbrMetallicRoughness: {
      baseColorTexture: {index: 0, extensions: {KHR_texture_transform: transform}}
    }
  });
  const view = container.json.bufferViews[container.json.images[0].bufferView];
  expect(
    new Uint8Array(
      container.binChunks[0].arrayBuffer,
      container.binChunks[0].byteOffset + view.byteOffset,
      view.byteLength
    )
  ).toEqual(image);
});

test('default compressed conversion packages an indexed 3TZ and honors the output byte gate', async () => {
  const input = createInput();
  const output = await encodeInput(input);
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0});
  const options = {
    source: {
      inspect: async () => undefined,
      async *read() {
        yield input;
      }
    },
    codec: createMeshConversionCodec({
      spatialContext: createTiles3DConversionSpatialContext({
        sourceCrs: 'EPSG:4978',
        coordinateFrame: 'geocentric',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal'
      }),
      maxPositionError: 0,
      dracoLibraryOptions: {useLocalLibraries: true}
    }),
    sink,
    measureInputBytes: () => input.mesh.attributes.POSITION.value.byteLength,
    measureOutputBytes: (resource: EncodedMeshConversionResource) => resource.glb.byteLength,
    maxOutputResourceBytes: output.glb.byteLength
  };
  const report = await convertTileset(options);
  expect(report.outputBytes).toBe(output.glb.byteLength);
  const archive = await createSingleMeshTilesetArchive(sink.getFiles(), {maxArchiveBytes: 8192});
  const reader = new Tiles3DArchive(new BlobFile(archive));
  expect(await reader.getFile('mesh.glb')).toEqual(output.glb);
  const tileset = JSON.parse(new TextDecoder().decode(await reader.getFile('tileset.json')));
  expect(tileset.root.content.uri).toBe('mesh.glb');
  const rejectedSink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0});
  await expect(
    convertTileset({
      ...options,
      sink: rejectedSink,
      maxOutputResourceBytes: output.glb.byteLength - 1
    })
  ).rejects.toMatchObject({code: 'OUTPUT_RESOURCE_TOO_LARGE'});
  expect(rejectedSink.getFiles()).toEqual([]);
});

test('lossless Edge Breaker reduces a small connected mesh GLB', async () => {
  const input = createInput();
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row < 16; row++) {
    for (let column = 0; column < 16; column++) {
      positions.push(6378137 + column, row, (row + column) % 3);
      if (row < 15 && column < 15) {
        const vertex = row * 16 + column;
        indices.push(vertex, vertex + 1, vertex + 16, vertex + 1, vertex + 17, vertex + 16);
      }
    }
  }
  input.mesh.attributes = {POSITION: {size: 3, value: new Float64Array(positions)}};
  input.mesh.indices = {size: 1, value: new Uint16Array(indices)};
  const compressed = await encodeInput(input);
  const uncompressed = await encodeInput(input, false);
  expect(compressed.glb.byteLength).toBeLessThan(uncompressed.glb.byteLength);
  expect(compressed.localBoundingBox).toEqual(uncompressed.localBoundingBox);
  expect(compressed.maximumPositionError).toBe(0);
});

test('codec rejects cancellation while awaiting Draco before publishing geometry', async () => {
  const controller = new AbortController();
  const reason = new Error('cancel Draco');
  const codec = createMeshConversionCodec({
    spatialContext: createTiles3DConversionSpatialContext({
      sourceCrs: 'EPSG:4978',
      coordinateFrame: 'geocentric',
      heightReference: 'ellipsoidal'
    }),
    maxPositionError: 0,
    dracoLibraryOptions: {useLocalLibraries: true}
  });
  const pending = codec.convert(createInput(), undefined, controller.signal).next();
  controller.abort(reason);
  await expect(pending).rejects.toBe(reason);
});

test('codec rejects an invalid compression policy', () => {
  expect(() =>
    createMeshConversionCodec({
      spatialContext: createTiles3DConversionSpatialContext({
        sourceCrs: 'EPSG:4978',
        coordinateFrame: 'geocentric',
        heightReference: 'ellipsoidal'
      }),
      maxPositionError: 0,
      draco: 'sequential' as unknown as boolean
    })
  ).toThrow(expect.objectContaining({code: 'MESH_DRACO_OPTIONS_INVALID'}));
});
