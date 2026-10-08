import {beforeAll, expect, test, vi} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph, GLTFWriter, postProcessGLTF} from '@loaders.gl/gltf';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {BlobFile} from '@loaders.gl/loader-utils';
import {
  inspectConversionInput,
  convertSelectedContents,
  CONVERSION_LIMITS
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput} from './utils/tile-browser-conversion';

const fixtures = new Map<string, ArrayBuffer>();

/** Authors tiny independent primitives or repeated node placements with distinct offsets. */
function createMeshes(
  count: number,
  sharedNodes = false,
  invalidLast = false,
  vertexCount = 3
): ArrayBuffer {
  const scene = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const nodes: number[] = [];
  for (let index = 0; index < count; index++) {
    const offset = sharedNodes ? 0 : index * 2;
    const mesh =
      sharedNodes && index
        ? 0
        : scene.addMesh({
            mode: invalidLast && index === count - 1 ? 1 : 4,
            attributes: {
              POSITION: {
                size: 3,
                value: Float32Array.from(
                  {length: vertexCount * 3},
                  (_, coordinate) => [offset, 0, 0, offset + 1, 0, 0, offset, 1, 0][coordinate % 9]
                )
              }
            },
            indices: Uint16Array.from({length: vertexCount}, (_, vertex) => vertex),
            material: scene.addMaterial({
              pbrMetallicRoughness: {baseColorFactor: index % 2 ? [0, 0, 1, 1] : [1, 0, 0, 1]}
            })
          });
    if (sharedNodes || index === 0) {
      const node = scene.addNode({meshIndex: mesh});
      scene.json.nodes![node].translation = [sharedNodes ? index * 2 : 0, 0, 0];
      nodes.push(node);
    } else {
      scene.json.meshes![0].primitives.push(scene.json.meshes![mesh].primitives[0]);
    }
  }
  scene.setDefaultScene(scene.addScene({nodeIndices: nodes}));
  scene.createBinaryChunk();
  return GLTFWriter.encodeSync!(scene.gltf);
}

beforeAll(() => {
  fixtures.set('primitives', createMeshes(2));
  fixtures.set('nodes', createMeshes(2, true));
  fixtures.set('invalid', createMeshes(2, false, true));
  fixtures.set('budget', createMeshes(2, false, false, 201));
  fixtures.set('limit', createMeshes(CONVERSION_LIMITS.maxMeshResources));
  fixtures.set('over-limit', createMeshes(CONVERSION_LIMITS.maxMeshResources + 1));
});

/** Reads the emitted collection hierarchy used for placement and resource assertions. */
async function readTileset(archive: Tiles3DArchive): Promise<{
  root: {
    content?: unknown;
    children: {content: {uri: string}; transform: number[]}[];
  };
}> {
  return JSON.parse(new TextDecoder().decode(await archive.getFile('tileset.json')));
}

/** Serves selected fixture bytes while retaining the standard deterministic tileset and sibling. */
async function inspectMeshes(data: ArrayBuffer, sibling = false) {
  const input = createInput(false, false, 'Y', sibling);
  const fetcher = vi.fn<typeof fetch>(async (url, options) =>
    String(url).includes('selected.glb') ? new Response(data) : input.fetcher(url, options)
  );
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    input.controller.signal,
    fetcher
  );
  return {inspection, fetcher, signal: input.controller.signal};
}

test.each([
  'primitives',
  'nodes'
])('one selected content retains both %s in the 3TZ archive', async profile => {
  const data = fixtures.get(profile)!;
  const original = data.slice(0);
  const {inspection, fetcher, signal} = await inspectMeshes(data);
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    '3tz',
    signal,
    () => {},
    fetcher
  );
  expect(data).toEqual(original);
  expect(result.file.name).toBe('selected-mesh.3tz');
  expect(result.report.inputResources).toBe(2);
  expect(result.report.outputResources).toBe(2);
  expect(fetcher).toHaveBeenCalledTimes(2);
  const reader = new BlobFile(result.file);
  const archive = new Tiles3DArchive(reader);
  try {
    const document = await readTileset(archive);
    expect(document.root.content).toBeUndefined();
    expect(document.root.children).toHaveLength(2);
    expect(document.root.children.map(tile => tile.content.uri)).toEqual([
      'meshes/0.glb',
      'meshes/1.glb'
    ]);
    expect(document.root.children.map(tile => tile.transform.slice(12, 15))).toEqual([
      [6378237.5, 5, 7.5],
      [6378239.5, 5, 7.5]
    ]);
    for (const [index, tile] of document.root.children.entries()) {
      const gltf = postProcessGLTF(
        await parse(await archive.getFile(tile.content.uri), GLTFLoader, {
          core: {worker: false, useLocalLibraries: true},
          gltf: {loadImages: false}
        })
      );
      expect(gltf.meshes[0].primitives[0].material!.pbrMetallicRoughness!.baseColorFactor).toEqual(
        profile === 'nodes' || index === 0 ? [1, 0, 0, 1] : [0, 0, 1, 1]
      );
    }
  } finally {
    await reader.close();
  }
});

test('multiple contents retain primitive declaration order and unique placements', async () => {
  const {inspection, fetcher, signal} = await inspectMeshes(fixtures.get('primitives')!, true);
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[2].resourceId, inspection.resources[1].resourceId],
    '3tz',
    signal,
    () => {},
    fetcher
  );
  expect(result.report.inputResources).toBe(3);
  expect(result.report.outputResources).toBe(3);
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    'https://example.invalid/tileset.json',
    'https://example.invalid/selected.glb',
    'https://example.invalid/sibling.glb'
  ]);
  const reader = new BlobFile(result.file);
  try {
    const archive = new Tiles3DArchive(reader);
    const document = await readTileset(archive);
    expect(document.root.children.map(tile => tile.transform.slice(12, 15))).toEqual([
      [6378237.5, 5, 7.5],
      [6378239.5, 5, 7.5],
      [6378237.5, 0, 0.5]
    ]);
    expect(new Set(document.root.children.map(tile => tile.content.uri)).size).toBe(3);
  } finally {
    await reader.close();
  }
});

test.each([
  'invalid',
  'over-limit'
])('a later %s primitive prevents archive publication', async profile => {
  const {inspection, fetcher, signal} = await inspectMeshes(fixtures.get(profile)!);
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      '3tz',
      signal,
      () => {},
      fetcher
    )
  ).rejects.toThrow(profile === 'invalid' ? /triangle-list/ : /primitive placement limit/);
});

test('the primitive placement cap accepts its exact boundary', async () => {
  const {inspection, fetcher, signal} = await inspectMeshes(fixtures.get('limit')!);
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    '3tz',
    signal,
    () => {},
    fetcher
  );
  expect(result.report.outputResources).toBe(CONVERSION_LIMITS.maxMeshResources);
});

test('primitives within one content share the decoded byte budget', async () => {
  const {inspection, fetcher, signal} = await inspectMeshes(fixtures.get('budget')!);
  const previousLimit = CONVERSION_LIMITS.maxInputBytes;
  const exactBytes = 2 * 201 * (24 + 2);
  try {
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: exactBytes - 1});
    await expect(
      convertSelectedContents(
        inspection,
        [inspection.resources[1].resourceId],
        '3tz',
        signal,
        () => {},
        fetcher
      )
    ).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: exactBytes});
    const result = await convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      '3tz',
      signal,
      () => {},
      fetcher
    );
    expect(result.report.inputBytes).toBe(exactBytes);
    expect(result.report.outputResources).toBe(2);
  } finally {
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: previousLimit});
  }
});
