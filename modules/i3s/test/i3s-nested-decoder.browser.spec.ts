// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {ImageBitmapLoader} from '@loaders.gl/images';
import {BasisLoader, CompressedTextureLoader} from '@loaders.gl/textures';
import {parseI3STileContent} from '../src/lib/parsers/parse-i3s-tile-content';

const GEOMETRY_SCHEMA = {
  store: {
    defaultGeometrySchema: {
      header: [
        {property: 'vertexCount', type: 'UInt32'},
        {property: 'featureCount', type: 'UInt32'}
      ],
      ordering: ['position', 'color'],
      vertexAttributes: {
        position: {valueType: 'Float32', valuesPerElement: 3},
        color: {valueType: 'UInt8', valuesPerElement: 4}
      },
      featureAttributes: {},
      featureAttributeOrder: []
    }
  }
} as any;

/** Creates a three-vertex buffer with explicit byte colors and no feature payload. */
function createGeometry(): ArrayBuffer {
  const bytes = new ArrayBuffer(56);
  new DataView(bytes).setUint32(0, 3, true);
  new Float32Array(bytes, 8, 9).set([0, 0, 0, 1, 0, 0, 0, 1, 0]);
  new Uint8Array(bytes, 44).set([255, 0, 128, 255, 0, 255, 0, 128, 64, 64, 64, 0]);
  return bytes;
}

describe('I3S nested decoders and color storage', () => {
  test.each([
    {alphaCutoff: 0, expected: 0},
    {alphaCutoff: 0.5, expected: 0.5},
    {alphaCutoff: undefined, expected: 0.25}
  ])('preserves an explicit alpha cutoff $alphaCutoff', async ({alphaCutoff, expected}) => {
    const content = await parseI3STileContent(
      createGeometry(),
      {mbs: [0, 0, 0], materialDefinition: {alphaCutoff}} as any,
      GEOMETRY_SCHEMA,
      {i3s: {coordinateSystem: 'lnglat-offsets', decodeTextures: false}} as any
    );
    expect(content.material.alphaCutoff).toBe(expected);
  });
  test.each([
    'float16',
    'float32'
  ] as const)('normalizes uncompressed byte colors into %s while preserving alpha', async colorFormat => {
    const content = await parseI3STileContent(
      createGeometry(),
      {mbs: [0, 0, 0]} as any,
      GEOMETRY_SCHEMA,
      {i3s: {coordinateSystem: 'lnglat-offsets', colorFormat}} as any
    );
    const colors = content.attributes.colors;
    expect(colors.normalized).toBe(false);
    expect(colors.size).toBe(4);
    if (colorFormat === 'float16') {
      expect(colors.componentType).toBe('float16');
      // Chromium can return native Float16Array or the portable IEEE-754 half storage.
      if (colors.value instanceof Uint16Array) {
        expect(Array.from(colors.value.slice(0, 4))).toEqual([0x3c00, 0, 0x3804, 0x3c00]);
      } else {
        expect(Number(colors.value[0])).toBe(1);
        expect(Number(colors.value[2])).toBeCloseTo(128 / 255, 3);
      }
    } else {
      expect(colors.value).toBeInstanceOf(Float32Array);
      expect(colors.value[0]).toBe(1);
      expect(colors.value[2]).toBeCloseTo(128 / 255, 6);
      expect(colors.value[7]).toBeCloseTo(128 / 255, 6);
      expect(colors.value[11]).toBe(0);
    }
  });

  test('retries image parsing through the same injected context and preserves image decoder options', async () => {
    const image = new ImageData(Uint8ClampedArray.of(255, 0, 0, 255), 1, 1);
    const parse = vi
      .fn()
      .mockRejectedValueOnce(new Error('retry image decode'))
      .mockResolvedValueOnce(image);
    const fetch = vi.fn(async () => new Response(Uint8Array.of(1)));
    const context = {fetch, _parse: parse} as any;
    const imageOptions = {image: {type: 'imagebitmap'}};
    const content = await parseI3STileContent(
      createGeometry(),
      {
        mbs: [0, 0, 0],
        textureUrl: '/image',
        textureFormat: 'png',
        textureLoaderOptions: imageOptions
      } as any,
      GEOMETRY_SCHEMA,
      {i3s: {decodeTextures: true, token: 'secret'}, searchParams: {revision: 2}} as any,
      context
    );
    expect(fetch).toHaveBeenCalledWith('/image?token=secret&revision=2');
    expect(parse).toHaveBeenCalledTimes(2);
    expect(parse).toHaveBeenNthCalledWith(
      2,
      expect.any(ArrayBuffer),
      ImageBitmapLoader,
      imageOptions,
      context
    );
    expect(content.textures?.['0']).toBe(image);
    expect(content.material.pbrMetallicRoughness.baseColorTexture.texture.source.image).toBe(image);
  });

  test.each([
    ['dds', CompressedTextureLoader],
    ['ktx-etc2', CompressedTextureLoader],
    ['ktx2', BasisLoader]
  ] as const)('routes %s mip levels through the injected texture decoder', async (textureFormat, loader) => {
    const mipLevels = [{width: 1, height: 1, data: Uint8Array.of(7), compressed: true}];
    const parse = vi.fn(async () => (textureFormat === 'ktx2' ? [mipLevels] : mipLevels));
    const context = {fetch: async () => new Response(Uint8Array.of(1)), _parse: parse} as any;
    const content = await parseI3STileContent(
      createGeometry(),
      {
        mbs: [0, 0, 0],
        textureUrl: '/compressed',
        textureFormat
      } as any,
      GEOMETRY_SCHEMA,
      {i3s: {decodeTextures: true}} as any,
      context
    );
    expect(parse).toHaveBeenCalledWith(expect.any(ArrayBuffer), loader, undefined, context);
    expect(content.textures?.['0']).toEqual({
      compressed: true,
      mipmaps: false,
      width: 1,
      height: 1,
      data: mipLevels
    });
  });

  test('requires a nested parse context for Draco and a declared schema for uncompressed geometry', async () => {
    await expect(
      parseI3STileContent(new ArrayBuffer(0), {isDracoGeometry: true} as any, {store: {}} as any)
    ).rejects.toThrow('requires LoaderContext to decode Draco geometry');
    await expect(
      parseI3STileContent(new ArrayBuffer(0), {} as any, {store: {}} as any)
    ).rejects.toThrow('requires store.defaultGeometrySchema');
  });
});
