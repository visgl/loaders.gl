import {beforeAll, expect, test} from 'vitest';
import {fetchFile, parse} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {DataViewReadableFile} from '@loaders.gl/zip';
import {
  CONVERSION_LIMITS,
  convertSelectedContents,
  inspectConversionInput
} from '../examples/website/i3s-slpk/src/convert-tileset';
import {createInput} from './utils/tile-browser-conversion';
import {
  createTexturedTriangle,
  createImageDataUri,
  TEXTURE_SAMPLER
} from './utils/tile-converter-texture';

let pngImage: Uint8Array;
let jpegImage: Uint8Array;

/** Loads the existing 77-byte PNG and 777-byte JPEG once, without external network access. */
beforeAll(async () => {
  [pngImage, jpegImage] = await Promise.all(
    ['png', 'jpg'].map(
      async extension =>
        new Uint8Array(
          await (
            await fetchFile(
              new URL(`./data/tile-converter-texture.${extension}`, import.meta.url).href
            )
          ).arrayBuffer()
        )
    )
  );
});

/** Reuses deterministic ECEF declarations and serves only the selected embedded GLB payload. */
async function inspectTexturedInput(data: ArrayBuffer) {
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
  return {fetcher, controller, inspection};
}

test.each([
  ['image/png', false, false],
  ['image/jpeg', true, false],
  ['image/png', false, true],
  ['image/jpeg', true, true]
] as const)('browser 3TZ conversion preserves %s image bytes, normalized UV=%s and inline URI=%s', async (mimeType, normalized, inline) => {
  const image = mimeType === 'image/png' ? pngImage : jpegImage;
  const data = createTexturedTriangle(
    image,
    mimeType,
    normalized,
    3,
    undefined,
    inline ? createImageDataUri(image, mimeType) : undefined
  );
  const before = data.slice(0);
  const {fetcher, controller, inspection} = await inspectTexturedInput(data);
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    '3tz',
    controller.signal,
    () => {},
    fetcher
  );
  expect(result.report.inputBytes).toBe(72 + (normalized ? 12 : 24) + image.byteLength);
  expect(data).toEqual(before);
  expect(fetcher.mock.calls.map(call => String(call[0]))).toEqual([
    'https://example.invalid/tileset.json',
    'https://example.invalid/selected.glb'
  ]);
  const archive = new Tiles3DArchive(
    new DataViewReadableFile(new DataView(await result.file.arrayBuffer()))
  );
  try {
    const gltf = postProcessGLTF(
      await parse(await archive.getFile('mesh.glb'), GLTFLoader, {
        worker: false,
        gltf: {loadImages: false}
      })
    );
    const primitive = gltf.meshes[0].primitives[0];
    const coordinates = primitive.attributes.TEXCOORD_0;
    expect(coordinates.normalized ?? false).toBe(normalized);
    expect(coordinates.value).toEqual(
      normalized
        ? new Uint16Array([0, 0, 65535, 0, 0, 65535])
        : new Float32Array([0, 0, 1, 0, 0, 1])
    );
    const material = primitive.material!.pbrMetallicRoughness!;
    expect(material.baseColorFactor).toEqual([0.5, 0.75, 1, 1]);
    const texture = material.baseColorTexture!.texture;
    expect(texture.sampler).toMatchObject(TEXTURE_SAMPLER);
    expect(texture.source!.mimeType).toBe(mimeType);
    const encoded = texture.source!.bufferView!.data;
    expect(encoded).toEqual(image);
    const bitmap = await createImageBitmap(new Blob([encoded.slice().buffer], {type: mimeType}));
    expect(bitmap.width).toBeGreaterThan(0);
    expect(bitmap.height).toBeGreaterThan(0);
    bitmap.close();
  } finally {
    await archive.file.close();
  }
  if (mimeType === 'image/png' && !inline)
    await expect(
      convertSelectedContents(
        inspection,
        [inspection.resources[1].resourceId],
        'slpk',
        controller.signal,
        () => {},
        fetcher
      )
    ).rejects.toMatchObject({code: 'I3S_MESH_PROFILE_UNSUPPORTED'});
});

test.each([
  false,
  true
])('mismatched image MIME aborts browser conversion with inline URI=%s', async inline => {
  const {fetcher, controller, inspection} = await inspectTexturedInput(
    createTexturedTriangle(
      pngImage,
      'image/jpeg',
      false,
      3,
      undefined,
      inline ? createImageDataUri(pngImage, 'image/jpeg') : undefined
    )
  );
  await expect(
    convertSelectedContents(
      inspection,
      [inspection.resources[1].resourceId],
      '3tz',
      controller.signal,
      () => {},
      fetcher
    )
  ).rejects.toMatchObject({code: 'MESH_TEXTURE_INVALID'});
});

test.each([
  [1, false],
  [2, false],
  [1, true],
  [2, true]
] as const)('image bytes count against the %s-placement decoded budget with inline URI=%s', async (count, inline) => {
  const vertexCount = 201;
  const geometryBytes = vertexCount * (24 + 8);
  const {fetcher, controller, inspection} = await inspectTexturedInput(
    createTexturedTriangle(
      pngImage,
      'image/png',
      false,
      vertexCount,
      undefined,
      inline ? createImageDataUri(pngImage, 'image/png') : undefined
    )
  );
  const identifiers = inspection.resources.slice(1, count + 1).map(resource => resource.resourceId);
  const originalLimit = CONVERSION_LIMITS.maxInputBytes;
  try {
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: geometryBytes * count});
    const conversion = () =>
      convertSelectedContents(inspection, identifiers, '3tz', controller.signal, () => {}, fetcher);
    if (count === 1)
      await expect(conversion()).rejects.toMatchObject({code: 'INPUT_RESOURCE_TOO_LARGE'});
    else await expect(conversion()).rejects.toThrow(/aggregate input byte limit/);
    const totalBytes = (geometryBytes + pngImage.byteLength) * count;
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: totalBytes});
    expect((await conversion()).report.inputBytes).toBe(totalBytes);
  } finally {
    Object.assign(CONVERSION_LIMITS, {maxInputBytes: originalLimit});
  }
});

test.each([
  [false, false],
  [true, false],
  [true, true]
])('browser 3TZ preserves UV transforms without baking normalized UV=%s and inline URI=%s', async (normalized, inline) => {
  const transform = {offset: [0.25, -0.5], rotation: Math.PI / 2, scale: [0.5, -1], texCoord: 0};
  const data = createTexturedTriangle(
    pngImage,
    'image/png',
    normalized,
    3,
    transform,
    inline ? createImageDataUri(pngImage, 'image/png') : undefined
  );
  const before = data.slice(0);
  const {fetcher, controller, inspection} = await inspectTexturedInput(data);
  const result = await convertSelectedContents(
    inspection,
    [inspection.resources[1].resourceId],
    '3tz',
    controller.signal,
    () => {},
    fetcher
  );
  expect(data).toEqual(before);
  expect(result.report.inputBytes).toBe(72 + (normalized ? 12 : 24) + pngImage.byteLength);
  const archive = new Tiles3DArchive(
    new DataViewReadableFile(new DataView(await result.file.arrayBuffer()))
  );
  try {
    const output = await archive.getFile('mesh.glb');
    const preserved = await parse(output, GLTFLoader, {
      worker: false,
      gltf: {loadImages: false, excludeExtensions: {KHR_texture_transform: false}}
    });
    expect(preserved.json.extensionsUsed).toContain('KHR_texture_transform');
    expect(preserved.json.extensionsRequired).toContain('KHR_texture_transform');
    const primitive = postProcessGLTF(preserved).meshes[0].primitives[0];
    expect(Object.keys(primitive.attributes)).toEqual(['POSITION', 'TEXCOORD_0']);
    expect(primitive.attributes.TEXCOORD_0.value).toEqual(
      normalized
        ? new Uint16Array([0, 0, 65535, 0, 0, 65535])
        : new Float32Array([0, 0, 1, 0, 0, 1])
    );
    expect(primitive.attributes.TEXCOORD_0.normalized ?? false).toBe(normalized);
    const textureInfo = primitive.material!.pbrMetallicRoughness!.baseColorTexture!;
    expect(textureInfo.extensions).toEqual({
      KHR_texture_transform: {
        offset: transform.offset,
        rotation: transform.rotation,
        scale: transform.scale
      }
    });
    expect(textureInfo.texture.source!.bufferView!.data).toEqual(pngImage);
    expect(textureInfo.texture.sampler).toMatchObject(TEXTURE_SAMPLER);
    // A normal consumer applies the preserved transform exactly once, including integer normalization.
    const rendered = postProcessGLTF(
      await parse(output, GLTFLoader, {
        worker: false,
        gltf: {loadImages: false}
      })
    ).meshes[0].primitives[0];
    const selected = rendered.material!.pbrMetallicRoughness!.baseColorTexture!;
    const coordinates = rendered.attributes[`TEXCOORD_${selected.texCoord}`].value;
    const expected = [0.25, -0.5, 0.25, 0, 1.25, -0.5];
    for (let index = 0; index < expected.length; index++)
      expect(coordinates[index]).toBeCloseTo(expected[index], 6);
    expect(selected.extensions?.KHR_texture_transform).toBeUndefined();
  } finally {
    await archive.file.close();
  }
});

test('browser conversion rejects UV-set overrides and malformed transform controls', async () => {
  for (const [transform, code] of [
    [{texCoord: 1}, 'MESH_SOURCE_TEXTURE_UNSUPPORTED'],
    [{offset: [0]}, 'MESH_TEXTURE_TRANSFORM_INVALID']
  ] as const) {
    const {fetcher, controller, inspection} = await inspectTexturedInput(
      createTexturedTriangle(pngImage, 'image/png', false, 3, transform)
    );
    await expect(
      convertSelectedContents(
        inspection,
        [inspection.resources[1].resourceId],
        '3tz',
        controller.signal,
        () => {},
        fetcher
      )
    ).rejects.toMatchObject({code});
  }
});
