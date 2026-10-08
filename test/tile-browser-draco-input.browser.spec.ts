import {afterAll, beforeAll, expect, test} from 'vitest';
import {fetchFile, getLoaderOptions, parse, setLoaderOptions} from '@loaders.gl/core';
import {GLBLoader, GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {BlobFile} from '@loaders.gl/loader-utils';
import {
  CONVERSION_LIMITS,
  convertSelectedContents,
  inspectConversionInput
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput} from './utils/tile-browser-conversion';
import {createCompressedMesh} from './utils/tile-converter-draco';
import {TEXTURE_SAMPLER} from './utils/tile-converter-texture';

let triangle: ArrayBuffer;
let texturedTriangle: ArrayBuffer;
let grid: ArrayBuffer;
let gridBytes: number;
let image: Uint8Array;
let originalLoaderOptions: ReturnType<typeof getLoaderOptions>;
const textureTransform = {offset: [0.25, -0.5], rotation: Math.PI / 2, scale: [0.5, -1]} as const;

/** Encodes immutable tiny triangle data and one small budget fixture once. */
beforeAll(async () => {
  originalLoaderOptions = getLoaderOptions();
  // Exercise bundled production assets instead of the test setup's dist-library fallback.
  setLoaderOptions({core: {useLocalLibraries: false}});
  image = new Uint8Array(
    await (
      await fetchFile(new URL('./data/tile-converter-texture.png', import.meta.url).href)
    ).arrayBuffer()
  );
  triangle = await createCompressedMesh();
  texturedTriangle = await createCompressedMesh(
    {
      topology: 'triangle-list',
      mode: 4,
      attributes: {
        POSITION: {size: 3, value: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])},
        NORMAL: {size: 3, value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])},
        COLOR_0: {
          size: 4,
          normalized: true,
          value: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255])
        },
        TEXCOORD_0: {size: 2, normalized: true, value: new Uint16Array([0, 0, 65535, 0, 0, 65535])}
      },
      indices: {size: 1, value: new Uint16Array([0, 1, 2])}
    },
    {
      baseColorTexture: {
        data: image,
        mimeType: 'image/png',
        sampler: TEXTURE_SAMPLER,
        transform: textureTransform
      }
    }
  );
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row < 16; row++) {
    for (let column = 0; column < 16; column++) {
      positions.push(column, row, 0);
      if (row < 15 && column < 15) {
        const vertex = row * 16 + column;
        indices.push(vertex, vertex + 1, vertex + 16, vertex + 1, vertex + 17, vertex + 16);
      }
    }
  }
  grid = await createCompressedMesh({
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {size: 3, value: new Float32Array(positions)}},
    indices: {size: 1, value: new Uint16Array(indices)}
  });
  const decoded = postProcessGLTF(
    await parse(grid, GLTFLoader, {
      worker: false,
      core: {useLocalLibraries: true},
      gltf: {loadImages: false}
    })
  ).meshes[0].primitives[0];
  gridBytes = decoded.attributes.POSITION.value.length * 8 + decoded.indices!.value.byteLength;
});

afterAll(() => setLoaderOptions(originalLoaderOptions));

/** Supplies only the selected compressed content while preserving the bounded source declarations. */
async function inspectInput(data: ArrayBuffer) {
  const {fetcher, controller} = createInput(false, false, 'Y', true);
  const inspection = await inspectConversionInput(
    'https://example.invalid/tileset.json',
    controller.signal,
    fetcher
  );
  fetcher.mockImplementation(async input => {
    if (
      !['https://example.invalid/selected.glb', 'https://example.invalid/sibling.glb'].includes(
        String(input)
      )
    )
      throw new Error(`Unselected resource fetched: ${input}`);
    return new Response(data);
  });
  return {inspection, fetcher, controller};
}

/** Wraps the compressed GLB in the aligned modern B3DM layout without feature metadata. */
function wrapBatchedMesh(binary: ArrayBuffer): ArrayBuffer {
  const featureTable = new TextEncoder().encode('{"BATCH_LENGTH":0}');
  const featureTableLength = Math.ceil((28 + featureTable.length) / 8) * 8 - 28;
  const tile = new ArrayBuffer(28 + featureTableLength + binary.byteLength);
  const bytes = new Uint8Array(tile);
  bytes.set(new TextEncoder().encode('b3dm'));
  const header = new DataView(tile);
  header.setUint32(4, 1, true);
  header.setUint32(8, tile.byteLength, true);
  header.setUint32(12, featureTableLength, true);
  bytes.fill(32, 28, 28 + featureTableLength);
  bytes.set(featureTable, 28);
  bytes.set(new Uint8Array(binary), 28 + featureTableLength);
  return tile;
}

test.each([
  'glb',
  'b3dm'
] as const)('browser conversion preserves Draco %s appearance without external fetches', async format => {
  const data = format === 'glb' ? texturedTriangle : wrapBatchedMesh(texturedTriangle);
  const before = data.slice(0);
  const {inspection, fetcher, controller} = await inspectInput(data);
  const output = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    '3tz',
    controller.signal,
    () => {},
    fetcher
  );
  expect(output.report.inputBytes).toBe(72 + 36 + 12 + 12 + 6 + image.byteLength);
  expect(data).toEqual(before);
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    'https://example.invalid/tileset.json',
    'https://example.invalid/selected.glb'
  ]);
  const archive = new Tiles3DArchive(new BlobFile(output.file));
  try {
    const gltf = postProcessGLTF(
      await parse(await archive.getFile('mesh.glb'), GLTFLoader, {
        worker: false,
        core: {useLocalLibraries: true},
        gltf: {loadImages: false, excludeExtensions: {KHR_texture_transform: false}}
      })
    );
    const primitive = gltf.meshes[0].primitives[0];
    expect(primitive.attributes.COLOR_0.normalized).toBe(true);
    expect(primitive.attributes.TEXCOORD_0.normalized).toBe(true);
    expect(Array.from(primitive.attributes.NORMAL.value)).toEqual([0, -1, 0, 0, -1, 0, 0, -1, 0]);
    const selected = primitive.material!.pbrMetallicRoughness!.baseColorTexture!;
    expect(selected.texture.source!.bufferView!.data).toEqual(image);
    expect(selected.texture.sampler).toMatchObject(TEXTURE_SAMPLER);
    expect(selected.extensions?.KHR_texture_transform).toEqual(textureTransform);
    const appearance = Array.from({length: primitive.attributes.COLOR_0.count}, (_, vertex) => [
      ...primitive.attributes.COLOR_0.value.slice(vertex * 4, vertex * 4 + 4),
      ...primitive.attributes.TEXCOORD_0.value.slice(vertex * 2, vertex * 2 + 2)
    ]);
    expect(appearance).toHaveLength(3);
    expect(appearance).toEqual(
      expect.arrayContaining([
        [255, 0, 0, 255, 0, 0],
        [0, 255, 0, 255, 65535, 0],
        [0, 0, 255, 255, 0, 65535]
      ])
    );
  } finally {
    await archive.file.close();
  }
});

test('an untextured Draco mesh converts to a readable SLPK', async () => {
  const {inspection, fetcher, controller} = await inspectInput(triangle);
  const output = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    'slpk',
    controller.signal,
    () => {},
    fetcher
  );
  const file = new BlobFile(output.file);
  try {
    const archive = await parseSLPKArchive(file);
    const layer = JSON.parse(new TextDecoder().decode(await archive.getFile('', 'http')));
    expect(layer.layerType).toBe('3DObject');
    const geometry = await archive.getFile('nodes/1/geometries/0', 'http');
    expect(layer.geometryDefinitions[0].geometryBuffers[0].compressedAttributes.encoding).toBe(
      'draco'
    );
    expect(new TextDecoder().decode(geometry.slice(0, 5))).toBe('DRACO');
    expect(new Uint8Array(geometry)[8]).toBe(1);
  } finally {
    await file.close();
  }
});

test.each([
  1, 2
])('decoded Draco geometry counts against the %s-placement byte gate', async count => {
  const {inspection, fetcher, controller} = await inspectInput(grid);
  const resourceIds = inspection.resources.slice(1, count + 1).map(resource => resource.resourceId);
  const originalLimit = CONVERSION_LIMITS.maxInputBytes;
  try {
    const budget = gridBytes * count;
    expect(inspection.tilesetBytes + grid.byteLength * count).toBeLessThan(budget);
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: budget - 1});
    const convert = () =>
      convertSelectedContents(inspection, resourceIds, '3tz', controller.signal, () => {}, fetcher);
    if (count === 1)
      await expect(convert()).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
    else await expect(convert()).rejects.toThrow(/aggregate input byte limit/);
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: budget});
    expect((await convert()).report.inputBytes).toBe(budget);
  } finally {
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: originalLimit});
  }
});

test('invalid Draco data fails before archive packaging', async () => {
  const data = triangle.slice(0);
  const container = await parse(data, GLBLoader);
  const view = container.json.bufferViews[0];
  new Uint8Array(data, container.binChunks[0].byteOffset + view.byteOffset, 5).fill(0);
  const {inspection, fetcher, controller} = await inspectInput(data);
  const phases: string[] = [];
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      '3tz',
      controller.signal,
      phase => phases.push(phase),
      fetcher
    )
  ).rejects.toThrow(/DRACO decompression failed/);
  expect(phases).not.toContain('Packaging archive');
});
