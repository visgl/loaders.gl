// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {coreApi, parse} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {Tiles3DTilesetSchema} from '@loaders.gl/3d-tiles/tileset-zod-schema';
import {Matrix4} from '@math.gl/core';
import {validateBytes} from 'gltf-validator';
import {
  convertTileset,
  createMeshConversionCodec,
  createTiles3DConversionSpatialContext,
  createSingleMeshTilesetSink,
  createSingleMeshTilesetArchive,
  type EncodedMeshConversionResource,
  type MeshConversionInput,
  type TileConversionReport,
  type TileConversionSource
} from '@loaders.gl/tile-converter/v5/browser';
import {
  createSingleMeshTilesetArchive as createRootArchive,
  createSingleMeshTilesetSink as createRootSink
} from '@loaders.gl/tile-converter/v5';

/** A minimal completed report for direct sink lifecycle checks. */
const REPORT: TileConversionReport = {
  state: 'completed',
  inputResources: 1,
  outputResources: 1,
  inputBytes: 36,
  outputBytes: 0,
  largestOutputResourceBytes: 0,
  diagnostics: []
};
/** Source geometry with distinct extents and normals in every axis. */
const INPUT: MeshConversionInput = {
  id: '../caller-id-is-not-a-path.glb',
  origin: [6378137.1, 20, -30],
  mesh: {
    topology: 'triangle-list',
    mode: 4,
    attributes: {
      POSITION: {
        value: new Float64Array([6378137.1001, 22, -27, 6378138.2, 22, -27, 6378137.2, 24, -25]),
        size: 3
      },
      NORMAL: {
        value: new Float32Array([
          0,
          -Math.SQRT1_2,
          Math.SQRT1_2,
          0,
          -Math.SQRT1_2,
          Math.SQRT1_2,
          0,
          -Math.SQRT1_2,
          Math.SQRT1_2
        ]),
        size: 3
      }
    }
  }
};
/** Immutable codec output parsed once for packaging assertions. */
let resource: EncodedMeshConversionResource;
/** Local positions read from the encoded GLB. */
let encodedPositions: number[];

beforeAll(async () => {
  const codec = createMeshConversionCodec({
    spatialContext: createTiles3DConversionSpatialContext({
      sourceCrs: 'EPSG:4978',
      heightReference: 'ellipsoidal',
      coordinateFrame: 'geocentric',
      axisOrder: 'xyz'
    }),
    maxPositionError: 0.001
  });
  for await (const output of codec.convert(INPUT, undefined)) resource = output;
  const scene = new GLTFScenegraph(
    await parse(resource.glb, GLTFLoader, {gltf: {postProcess: false}})
  );
  encodedPositions = Array.from(scene.getTypedArrayForAccessor(0));
});

/** Makes an independent one- or two-resource source for core lifecycle checks. */
function createSource(count = 1): TileConversionSource<undefined, MeshConversionInput> {
  return {
    inspect: async () => undefined,
    async *read() {
      for (let index = 0; index < count; index++) yield INPUT;
    }
  };
}

/** Runs the actual spatial codec and selected sink through the public conversion core. */
async function convertSource(
  sink: ReturnType<typeof createSingleMeshTilesetSink>,
  count = 1,
  signal?: AbortSignal
) {
  return convertTileset({
    source: createSource(count),
    codec: createMeshConversionCodec({
      spatialContext: createTiles3DConversionSpatialContext({
        sourceCrs: 'EPSG:4978',
        heightReference: 'ellipsoidal',
        coordinateFrame: 'geocentric',
        axisOrder: 'xyz'
      }),
      maxPositionError: 0.001
    }),
    sink,
    measureInputBytes: () => INPUT.mesh.attributes.POSITION.value.byteLength,
    measureOutputBytes: output => output.glb.byteLength,
    maxInputResourceBytes: 1024,
    maxOutputResourceBytes: 8192,
    signal
  });
}

test('single mesh sink packages independently valid GLB and schema-valid 3D Tiles 1.1 with exact axis placement', async () => {
  expect(createRootSink).toBe(createSingleMeshTilesetSink);
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  const report = await convertSource(sink);
  expect(report.outputResources).toBe(1);
  const files = sink.getFiles();
  expect(files.map(file => [file.resourceId, file.blob.type])).toEqual([
    ['mesh.glb', 'model/gltf-binary'],
    ['tileset.json', 'application/json']
  ]);
  const glb = await files[0].blob.arrayBuffer();
  expect(glb).toEqual(resource.glb);
  const validation = await validateBytes(new Uint8Array(glb), {writeTimestamp: false});
  expect(validation.issues.numErrors).toBe(0);
  expect(validation.issues.numWarnings).toBe(0);
  const tileset = JSON.parse(await files[1].blob.text());
  expect(Tiles3DTilesetSchema.safeParse(tileset).success).toBe(true);
  expect(tileset).toMatchObject({
    asset: {version: '1.1'},
    geometricError: 0.001,
    root: {geometricError: 0.001, refine: 'REPLACE', content: {uri: 'mesh.glb'}}
  });
  // Follow the normative reader order: glTF y-up -> z-up, then tile transform.
  const rotation = new Matrix4([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]);
  const placement = new Matrix4(tileset.root.transform);
  const combined = placement.clone().multiplyRight(rotation);
  for (let index = 0; index < encodedPositions.length; index += 3) {
    const local = encodedPositions.slice(index, index + 3);
    expect(combined.transformAsPoint(local)).toEqual(
      local.map((value, axis) => value + INPUT.origin[axis])
    );
  }
  const scene = new GLTFScenegraph(await parse(glb, GLTFLoader, {gltf: {postProcess: false}}));
  const normal = Array.from(scene.getTypedArrayForAccessor(1)).slice(0, 3);
  expect(combined.transformAsVector(normal)).toEqual(normal);
  const box = tileset.root.boundingVolume.box;
  expect(placement.transformAsPoint(box.slice(0, 3))).toEqual(
    resource.localBoundingBox[0].map(
      (minimum, axis) => minimum / 2 + resource.localBoundingBox[1][axis] / 2 + INPUT.origin[axis]
    )
  );
  expect(placement.transformAsVector(box.slice(3, 6))).toEqual([
    (resource.localBoundingBox[1][0] - resource.localBoundingBox[0][0]) / 2,
    0,
    0
  ]);
  expect(placement.transformAsVector(box.slice(6, 9))).toEqual([0, 1, 0]);
  expect(placement.transformAsVector(box.slice(9, 12))).toEqual([0, 0, 1]);
  // Bounds retain the actual Float32 values, rather than rounded world-coordinate subtraction.
  expect(resource.localBoundingBox[0][0]).toBe(encodedPositions[0]);
  expect(resource.localBoundingBox[1][0]).toBe(encodedPositions[3]);
});

test('single mesh sink exposes deterministic files only after finalization, copies GLB, and clears on abort', async () => {
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  const copy = {...resource, glb: resource.glb.slice(0)};
  const original = copy.glb.slice(0);
  await sink.write(copy);
  expect(sink.getFiles()).toEqual([]);
  new Uint8Array(copy.glb).fill(0);
  await sink.finalize(REPORT);
  await expect(sink.getFiles()[0].blob.arrayBuffer()).resolves.toEqual(original);
  const again = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  await again.write(resource);
  await again.finalize(REPORT);
  await expect(sink.getFiles()[1].blob.text()).resolves.toBe(await again.getFiles()[1].blob.text());
  await sink.abort(new Error('discard'));
  expect(sink.getFiles()).toEqual([]);
});

test('single mesh sink includes JSON bytes in its inclusive retained output budget', async () => {
  const reference = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  await reference.write(resource);
  await reference.finalize(REPORT);
  const totalBytes = reference.getFiles().reduce((total, file) => total + file.blob.size, 0);
  const exact = createSingleMeshTilesetSink({maxTotalBytes: totalBytes, geometricError: 0.001});
  await exact.write(resource);
  await exact.finalize(REPORT);
  expect(exact.getFiles().reduce((total, file) => total + file.blob.size, 0)).toBe(totalBytes);
  const insufficient = createSingleMeshTilesetSink({
    maxTotalBytes: totalBytes - 1,
    geometricError: 0.001
  });
  await expect(convertSource(insufficient)).rejects.toMatchObject({
    code: 'OUTPUT_MEMORY_LIMIT_EXCEEDED'
  });
  expect(insufficient.getFiles()).toEqual([]);
});

test.each([
  0, 2
])('single mesh conversion rejects %s meshes and aborts partial output', async count => {
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  await expect(convertSource(sink, count)).rejects.toMatchObject({
    code: count === 0 ? 'SINGLE_MESH_SINK_INCOMPLETE' : 'SINGLE_MESH_SINK_UNAVAILABLE'
  });
  expect(sink.getFiles()).toEqual([]);
});

test('single mesh sink rejects overlapping writes, premature/repeated finalization and writes after closure', async () => {
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  const pending = sink.write(resource);
  await Promise.all([
    expect(sink.write(resource)).rejects.toMatchObject({code: 'SINGLE_MESH_SINK_UNAVAILABLE'}),
    expect(sink.finalize(REPORT)).rejects.toMatchObject({code: 'SINGLE_MESH_SINK_INCOMPLETE'})
  ]);
  await pending;
  await sink.finalize(REPORT);
  await expect(sink.finalize(REPORT)).rejects.toMatchObject({code: 'SINGLE_MESH_SINK_INCOMPLETE'});
  await expect(sink.write(resource)).rejects.toMatchObject({code: 'SINGLE_MESH_SINK_UNAVAILABLE'});
});

test('single mesh sink honors cancellation before and during writes and conversion aborts cleanup', async () => {
  const controller = new AbortController();
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  const failure = new Error('cancelled');
  controller.abort(failure);
  await expect(sink.write(resource, controller.signal)).rejects.toBe(failure);
  await expect(convertSource(sink, 1, controller.signal)).rejects.toBe(failure);
  expect(sink.getFiles()).toEqual([]);
  const during = new AbortController();
  const pendingSink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  const pending = pendingSink.write(resource, during.signal);
  during.abort(failure);
  await expect(pending).rejects.toBe(failure);
  await pendingSink.abort(failure);
  expect(pendingSink.getFiles()).toEqual([]);
  const aborted = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  const write = aborted.write(resource);
  await aborted.abort(failure);
  await expect(write).rejects.toMatchObject({code: 'RESOURCE_SINK_CLOSED'});
});

test.each([
  -1,
  NaN,
  Infinity
])('single mesh sink rejects invalid geometric error %s', geometricError => {
  expect(() => createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError})).toThrow(
    expect.objectContaining({code: 'MESH_GEOMETRIC_ERROR_INVALID'})
  );
});

test.each([
  -1,
  NaN,
  Infinity,
  0.5
])('single mesh sink rejects invalid or unbudgeted reconstruction error %s', maximumPositionError => {
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  return expect(sink.write({...resource, maximumPositionError})).rejects.toMatchObject({
    code: 'MESH_GEOMETRIC_ERROR_INVALID'
  });
});

test.each([
  {status: 'unresolved'},
  {status: 'transformable'},
  {sourceCrs: 'EPSG:3857'},
  {targetCrs: 'EPSG:4326'},
  {heightReference: 'orthometric'},
  {targetHeightReference: 'orthometric'},
  {coordinateFrame: 'cartesian'},
  {axisOrder: 'yx'},
  {verticalUnitScale: 0.3048},
  {units: ['foot', 'foot', 'foot']}
])('single mesh sink rejects unresolved or unsupported placement %j', async spatial => {
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  await expect(
    sink.write({
      ...resource,
      spatialReference: {
        ...resource.spatialReference,
        ...spatial
      } as typeof resource.spatialReference
    })
  ).rejects.toMatchObject({code: 'MESH_TILESET_FRAME_UNSUPPORTED'});
});

test('single mesh sink packages a real geographic-to-ECEF conversion with retained source units', async () => {
  const input: MeshConversionInput = {
    ...INPUT,
    origin: [6378137, 0, 0],
    mesh: {
      topology: 'triangle-list',
      mode: 4,
      attributes: {
        POSITION: {value: new Float64Array([0, 0, 0, 0.00001, 0, 0, 0, 0.00001, 1]), size: 3}
      }
    }
  };
  const spatialContext = createTiles3DConversionSpatialContext(
    {
      sourceCrs: 'EPSG:4326',
      coordinateFrame: 'geographic',
      heightReference: 'ellipsoidal',
      units: ['degree', 'degree', 'meter']
    },
    {targetCrs: 'EPSG:4978', targetHeightReference: 'ellipsoidal'}
  );
  const codec = createMeshConversionCodec({spatialContext, maxPositionError: 0.001});
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  for await (const output of codec.convert(input, undefined)) await sink.write(output);
  await sink.finalize(REPORT);
  const files = sink.getFiles();
  const tileset = JSON.parse(await files[1].blob.text());
  const transform = new Matrix4(tileset.root.transform).multiplyRight(
    new Matrix4([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1])
  );
  const scene = new GLTFScenegraph(
    await parse(await files[0].blob.arrayBuffer(), GLTFLoader, {gltf: {postProcess: false}})
  );
  const positions = Array.from(scene.getTypedArrayForAccessor(0));
  const expected = spatialContext.transformPositions(input.mesh.attributes.POSITION.value);
  for (let index = 0; index < positions.length; index += 3) {
    const placed = transform.transformAsPoint(positions.slice(index, index + 3));
    expect(
      Math.hypot(...placed.map((value, axis) => value - expected[index + axis]))
    ).toBeLessThanOrEqual(0.001);
  }
  expect(spatialContext.spatialReference.status).toBe('transformed');
  expect(spatialContext.spatialReference.units).toEqual(['degree', 'degree', 'meter']);
});

test.each([
  {origin: [1, 2]},
  {origin: [Infinity, 0, 0]},
  {
    localBoundingBox: [
      [0, 0],
      [1, 1, 1]
    ]
  },
  {
    localBoundingBox: [
      [0, 0, 0],
      [1, 1]
    ]
  },
  {
    localBoundingBox: [
      [0, NaN, 0],
      [1, 1, 1]
    ]
  },
  {
    localBoundingBox: [
      [2, 0, 0],
      [1, 1, 1]
    ]
  }
])('single mesh sink rejects invalid origin/bounds %j', async invalid => {
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0.001});
  await expect(
    sink.write({...resource, ...invalid} as EncodedMeshConversionResource)
  ).rejects.toMatchObject({code: 'MESH_TILESET_BOUNDS_INVALID'});
});

test('single mesh sink accepts explicit native meter units and zero geometric error for exact output', async () => {
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 8192, geometricError: 0});
  await sink.write({
    ...resource,
    maximumPositionError: 0,
    spatialReference: {...resource.spatialReference, units: ['meter', 'meter', 'meter']}
  });
  await sink.finalize(REPORT);
  expect(JSON.parse(await sink.getFiles()[1].blob.text()).geometricError).toBe(0);
});

test('single mesh package becomes a bounded indexed 3TZ Blob through both v5 entrypoints', async () => {
  expect(createRootArchive).toBe(createSingleMeshTilesetArchive);
  const sink = createSingleMeshTilesetSink({maxTotalBytes: 1024 * 1024, geometricError: 0.001});
  await convertSource(sink);
  const files = sink.getFiles();
  const archiveBytes = files.reduce((total, file) => total + file.blob.size, 368);
  const archive = await createSingleMeshTilesetArchive(files, {maxArchiveBytes: archiveBytes});
  expect(archive.size).toBe(archiveBytes);
  expect(archive.type).toBe('application/vnd.maxar.archive.3tz+zip');
  const {Tiles3DArchiveSource, Tiles3DLoader} = await import('@loaders.gl/3d-tiles');
  const source = new Tiles3DArchiveSource({url: archive, loader: Tiles3DLoader, coreApi});
  await source.initialize();
  const tileset = await source.getRootTileset();
  expect(tileset.root.content.uri).toBe('mesh.glb');
  await expect(
    createSingleMeshTilesetArchive(files, {maxArchiveBytes: archiveBytes - 1})
  ).rejects.toThrow('byte limit');
});

test.each([
  -1,
  Infinity,
  NaN,
  0.5
])('single mesh archive rejects invalid budget %s', async maxArchiveBytes => {
  await expect(createSingleMeshTilesetArchive([], {maxArchiveBytes})).rejects.toMatchObject({
    code: 'INVALID_ARCHIVE_BYTE_LIMIT'
  });
});

test.each(
  [
    [],
    ['mesh.glb'],
    ['mesh.glb', 'mesh.glb'],
    ['tileset.json', 'tileset.json'],
    ['mesh.glb', 'other.json'],
    ['tileset.json', 'mesh.glb', 'extra.glb']
  ].map(paths => ({paths}))
)('single mesh archive rejects incomplete or unexpected sink files %#', async ({paths}) => {
  await expect(
    createSingleMeshTilesetArchive(
      paths.map(resourceId => ({resourceId, blob: new Blob()})),
      {maxArchiveBytes: 1024}
    )
  ).rejects.toMatchObject({code: 'INVALID_SINGLE_MESH_ARCHIVE'});
});
