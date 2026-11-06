// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {parse} from '@loaders.gl/core';
import {ImageLUTLoader} from '../../src/image-lut-loader-types';
import {test, expect} from 'vitest';
import {ImageLUTLoaderWithParser} from '../../src/image-lut-loader';

test('PNG LUT loader decodes opaque pixels without changing sample values', async () => {
  const canvas = new OffscreenCanvas(4, 2);
  const context = canvas.getContext('2d')!;
  const pixels = new Uint8ClampedArray(4 * 2 * 4);
  for (let blue = 0; blue < 2; blue++)
    for (let green = 0; green < 2; green++)
      for (let red = 0; red < 2; red++)
        pixels.set(
          [red * 128 + 64, green * 128 + 32, blue * 128 + 16, 255],
          (green * 4 + blue * 2 + red) * 4
        );
  context.putImageData(new ImageData(pixels, 4, 2), 0, 0);
  const data = await (await canvas.convertToBlob({type: 'image/png'})).arrayBuffer();
  const result = await parse(data, ImageLUTLoader, {lut: {size: 2, tilesPerRow: 2}});
  expect(result.data[3]).toBeCloseTo(192 / 255, 6);
  expect(result.data[4]).toBeCloseTo(32 / 255, 6);
  expect(result.data[5]).toBeCloseTo(16 / 255, 6);
  expect(result.data[result.data.length - 1]).toBeCloseTo(144 / 255, 6);
  await expect(ImageLUTLoaderWithParser.parse(data)).rejects.toThrow(/layout options/);
});

test('PNG LUT loader rejects unsupported precision before bitmap decoding', async () => {
  await expect(
    ImageLUTLoaderWithParser.parse(new ArrayBuffer(0), {lut: {size: 2, tilesPerRow: 2}})
  ).rejects.toThrow(/PNG bytes/);
  const canvas = new OffscreenCanvas(4, 2);
  canvas.getContext('2d')!.fillRect(0, 0, 4, 2);
  const buffer = await (await canvas.convertToBlob({type: 'image/png'})).arrayBuffer();
  new Uint8Array(buffer)[24] = 16;
  await expect(
    ImageLUTLoaderWithParser.parse(buffer, {lut: {size: 2, tilesPerRow: 2}})
  ).rejects.toThrow(/8-bit PNG/);
});

test.each([
  'iCCP',
  'eXIf',
  'gAMA',
  'cHRM',
  'cICP',
  'sBIT'
])('PNG LUT rejects %s metadata before generic image decoding', async name => {
  const canvas = new OffscreenCanvas(4, 2);
  canvas.getContext('2d');
  const source = new Uint8Array(
    await (await canvas.convertToBlob({type: 'image/png'})).arrayBuffer()
  );
  const tagged = new Uint8Array(source.length + 12);
  tagged.set(source.subarray(0, 33));
  tagged.set(new TextEncoder().encode(name), 37);
  tagged.set(source.subarray(33), 45);
  await expect(
    ImageLUTLoaderWithParser.parse(tagged.buffer, {lut: {size: 2, tilesPerRow: 2}})
  ).rejects.toThrow(/unsupported PNG metadata/);
});

test('PNG LUT rejects truncated chunk boundaries before generic image decoding', async () => {
  const canvas = new OffscreenCanvas(4, 2);
  canvas.getContext('2d');
  const source = new Uint8Array(
    await (await canvas.convertToBlob({type: 'image/png'})).arrayBuffer()
  );
  const options = {lut: {size: 2, tilesPerRow: 2}};
  await expect(ImageLUTLoaderWithParser.parse(source.slice(0, 34).buffer, options)).rejects.toThrow(
    /truncated PNG chunk/
  );
  new DataView(source.buffer).setUint32(33, 0xffffffff);
  await expect(ImageLUTLoaderWithParser.parse(source.buffer, options)).rejects.toThrow(
    /truncated PNG chunk/
  );
});
