import {expect, test} from 'vitest';
import {
  createMeshTilesetSink,
  encodeMeshTile,
  type EncodedMeshConversionResource
} from '@loaders.gl/tile-converter/v5/adapters';
import {
  convertTileset,
  createTiles3DConversionSpatialContext,
  type TileConversionReport
} from '@loaders.gl/tile-converter/v5/core';

/** Trusted encoded triangle used for sink lifecycle and placement checks. */
const RESOURCE: EncodedMeshConversionResource = {
  id: '../source-placement',
  glb: encodeMeshTile({
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {value: new Float32Array([0, 0, 0, 2, 0, 0, 0, 3, 0]), size: 3}}
  }),
  origin: [6378137, 10, 20],
  boundingBox: [
    [6378137, 10, 20],
    [6378139, 13, 20]
  ],
  localBoundingBox: [
    [0, 0, 0],
    [2, 3, 0]
  ],
  spatialReference: createTiles3DConversionSpatialContext({
    sourceCrs: 'EPSG:4978',
    heightReference: 'ellipsoidal',
    coordinateFrame: 'geocentric',
    axisOrder: 'xyz'
  }).spatialReference,
  maximumPositionError: 0
};
/** Minimal completed report for direct lifecycle checks. */
const REPORT: TileConversionReport = {
  state: 'completed',
  inputResources: 2,
  outputResources: 2,
  inputBytes: 0,
  outputBytes: 0,
  largestOutputResourceBytes: 0,
  diagnostics: []
};
/** Required finite collection limits used by the focused cases. */
const OPTIONS = {maxTotalBytes: 10000, maxMeshes: 2, geometricError: 1};

/** Runs trusted resources through the real orchestration lifecycle. */
async function convertResources(
  sink: ReturnType<typeof createMeshTilesetSink>,
  resources: readonly EncodedMeshConversionResource[],
  signal?: AbortSignal
) {
  return convertTileset({
    source: {
      inspect: async () => undefined,
      async *read() {
        yield* resources;
      }
    },
    codec: {
      async *convert(resource) {
        yield resource;
      }
    },
    sink,
    signal,
    measureInputBytes: resource => resource.glb.byteLength,
    measureOutputBytes: resource => resource.glb.byteLength
  });
}

test('mesh collection authors deterministic relative resources and enclosing absolute bounds', async () => {
  const options = {...OPTIONS};
  const sink = createMeshTilesetSink(options);
  options.maxMeshes = 0;
  options.geometricError = NaN;
  options.maxTotalBytes = 1;
  expect(sink.getFiles()).toEqual([]);
  await sink.write(RESOURCE);
  expect(sink.getFiles()).toEqual([]);
  await sink.write({...RESOURCE, id: 'second', origin: [6378237, -10, -20]});
  await sink.finalize!(REPORT);
  const files = sink.getFiles();
  expect(files.map(file => file.resourceId)).toEqual([
    'meshes/0.glb',
    'meshes/1.glb',
    'tileset.json'
  ]);
  const document = JSON.parse(await files[2].blob.text());
  expect(document.asset.version).toBe('1.1');
  expect(document.root.content).toBeUndefined();
  expect(document.root.refine).toBe('ADD');
  expect(document.root.boundingVolume.box).toEqual([
    6378188, 1.5, 0, 51, 0, 0, 0, 11.5, 0, 0, 0, 20
  ]);
  expect(document.root.children.map((tile: any) => tile.content.uri)).toEqual([
    'meshes/0.glb',
    'meshes/1.glb'
  ]);
  expect(document.root.children.map((tile: any) => tile.transform.slice(12, 15))).toEqual([
    RESOURCE.origin,
    [6378237, -10, -20]
  ]);
  expect(document.root.children[0].boundingVolume.box).toEqual([
    1, 0, 1.5, 1, 0, 0, 0, 0, 1.5, 0, 0, 0
  ]);
  await expect(sink.write({...RESOURCE, id: 'late'})).rejects.toThrow(/busy or closed/);
  await expect(sink.finalize!(REPORT)).rejects.toThrow(/Finalization/);
  await sink.abort!(new Error('discard'));
  expect(sink.getFiles()).toEqual([]);
});

test.each([
  {geometricError: NaN},
  {geometricError: -1},
  {maxMeshes: Infinity},
  {maxMeshes: 0},
  {maxMeshes: 1.5}
])('mesh collection rejects invalid limits %j', patch => {
  expect(() => createMeshTilesetSink({...OPTIONS, ...patch})).toThrow(/geometricError/);
});

test('mesh collection rejects duplicate placements and excess meshes atomically', async () => {
  for (const resources of [
    [RESOURCE, RESOURCE],
    [RESOURCE, {...RESOURCE, id: 'two'}, {...RESOURCE, id: 'three'}]
  ]) {
    const sink = createMeshTilesetSink(OPTIONS);
    await expect(convertResources(sink, resources)).rejects.toThrow(/placement identifier/);
    expect(sink.getFiles()).toEqual([]);
  }
});

test('mesh collection rejects empty output, canceled writes, overflowing bounds and invalid frames', async () => {
  const sink = createMeshTilesetSink(OPTIONS);
  await expect(convertResources(sink, [])).rejects.toThrow(/Finalization/);
  const canceled = new AbortController();
  canceled.abort(new Error('canceled'));
  await expect(createMeshTilesetSink(OPTIONS).write(RESOURCE, canceled.signal)).rejects.toThrow(
    'canceled'
  );
  await expect(
    createMeshTilesetSink(OPTIONS).write({
      ...RESOURCE,
      origin: [Number.MAX_VALUE, 0, 0],
      localBoundingBox: [
        [Number.MAX_VALUE, 0, 0],
        [Number.MAX_VALUE, 1, 1]
      ]
    })
  ).rejects.toThrow(/Absolute bounds/);
  await expect(
    createMeshTilesetSink(OPTIONS).write({
      ...RESOURCE,
      spatialReference: {...RESOURCE.spatialReference, sourceCrs: 'EPSG:3857'}
    })
  ).rejects.toThrow(/EPSG:4978/);
});

test('mesh collection prevents concurrent writes and finalization', async () => {
  const sink = createMeshTilesetSink(OPTIONS);
  const writing = sink.write(RESOURCE);
  const rejectedWrite = sink.write({...RESOURCE, id: 'two'});
  const rejectedFinalize = sink.finalize!(REPORT);
  await expect(rejectedWrite).rejects.toThrow(/busy/);
  await expect(rejectedFinalize).rejects.toThrow(/Finalization/);
  await writing;
  await sink.finalize!(REPORT);
  expect(sink.getFiles()).toHaveLength(2);
});

test('mesh collection includes final JSON in its byte budget and clears failed writes', async () => {
  for (const maxTotalBytes of [RESOURCE.glb.byteLength - 1, RESOURCE.glb.byteLength]) {
    const sink = createMeshTilesetSink({...OPTIONS, maxTotalBytes});
    await expect(convertResources(sink, [RESOURCE])).rejects.toThrow(/limit/);
    expect(sink.getFiles()).toEqual([]);
  }
});

test('contentless root has nonzero enclosing error while exact leaves retain zero error', async () => {
  const sink = createMeshTilesetSink({...OPTIONS, geometricError: 0});
  await convertResources(sink, [RESOURCE]);
  const document = JSON.parse(
    await sink
      .getFiles()
      .find(file => file.resourceId === 'tileset.json')!
      .blob.text()
  );
  expect(document.geometricError).toBe(Math.hypot(2, 3));
  expect(document.root.geometricError).toBe(document.geometricError);
  expect(document.root.children[0].geometricError).toBe(0);
});

test('mesh collection rejects an overflowing root diagonal instead of serializing null', async () => {
  const sink = createMeshTilesetSink(OPTIONS);
  const localBoundingBox = [
    [0, 0, 0],
    [0, 3, 0]
  ] as const;
  await expect(
    convertResources(sink, [
      {...RESOURCE, origin: [Number.MAX_VALUE, 0, 0], localBoundingBox},
      {...RESOURCE, id: 'opposite', origin: [-Number.MAX_VALUE, 0, 0], localBoundingBox}
    ])
  ).rejects.toThrow(/finite diagonal/);
  expect(sink.getFiles()).toEqual([]);
});
