import {parse} from '@loaders.gl/core';
import {ImageLUTLoader} from '../../src/image-lut-loader-types';
// SPDX-License-Identifier: MIT
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
