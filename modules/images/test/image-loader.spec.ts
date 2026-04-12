import {expect, test} from 'vitest';

import {ImageLoader, ImageBitmapLoader, getImageType, getImageData} from '@loaders.gl/images';
import {isBrowser, load} from '@loaders.gl/core';

import {
  TEST_CASES,
  IMAGE_URL,
  IMAGE_DATA_URL,
  SVG_DATA_URL,
  SVG_DATA_URL_NOT_LATIN
} from './lib/test-cases';

const INVALID_IMAGE_TYPES = ['auto', 'image', 'data'] as const;

test('image loaders#imports', () => {
  expect(ImageLoader, 'ImageLoader defined').toBeTruthy();
  expect(ImageBitmapLoader, 'ImageBitmapLoader defined').toBeTruthy();
});

test('ImageBitmapLoader#load(URL) defaults to imagebitmap output', async () => {
  const image = await load(IMAGE_URL, ImageBitmapLoader);
  expect(image, 'image loaded successfully from URL').toBeTruthy();
  expect(getImageType(image), 'default image type is correct').toBe('imagebitmap');

  if (!isBrowser) {
    expect(image instanceof ImageBitmap, 'node polyfills return ImageBitmap').toBeTruthy();
  }
});

test('ImageBitmapLoader#load(data URL)', async () => {
  const image = await load(IMAGE_DATA_URL, ImageBitmapLoader);
  expect(image, 'image loaded successfully from data URL').toBeTruthy();

  const imageData = getImageData(image);
  expect(imageData.width, 'image width is correct').toEqual(2);
  expect(imageData.height, 'image height is correct').toEqual(2);

  if (!isBrowser) {
    expect(ArrayBuffer.isView(imageData.data), 'image data is TypedArray').toBeTruthy();
    expect(imageData.data.byteLength, 'image `data.byteLength` is correct').toBe(16);
  }
});

test('ImageBitmapLoader#load({type: \'imagebitmap\'})', async () => {
  const image = await load(IMAGE_URL, ImageBitmapLoader, {
    image: {type: 'imagebitmap'}
  });
  expect(image, 'image loaded successfully with imagebitmap alias').toBeTruthy();
  expect(getImageType(image), 'imagebitmap alias preserves environment output').toBe('imagebitmap');
});

test.runIf(!isBrowser)('ImageBitmapLoader#node ImageBitmap data is globally accessible', async () => {
  const image = await load(IMAGE_URL, ImageBitmapLoader);
  // @ts-expect-error Node polyfill installs a global helper
  const imageData = globalThis.getImageBitmapData(image);
  expect(imageData.width, 'global getImageBitmapData returns width').toBe(480);
  expect(imageData.height, 'global getImageBitmapData returns height').toBe(320);
  expect(ArrayBuffer.isView(imageData.data), 'global getImageBitmapData returns pixels').toBeTruthy();
});

test.runIf(isBrowser)('ImageBitmapLoader#DATA URL - SVG', async () => {
  const svgImage = await load(SVG_DATA_URL, ImageBitmapLoader);
  expect(svgImage, 'SVG is loaded from data URL').toBeTruthy();
});

test.runIf(isBrowser)('ImageBitmapLoader#DATA URL - SVG/ not latin', async () => {
  const svgImage = await load(SVG_DATA_URL_NOT_LATIN, ImageBitmapLoader);
  expect(svgImage, 'SVG with characters outside latin range is loaded from data URL').toBeTruthy();
});

test('ImageBitmapLoader#rejects legacy image types', async () => {
  for (const type of INVALID_IMAGE_TYPES) {
    try {
      // @ts-expect-error Intentionally exercising removed runtime options
      await load(IMAGE_URL, ImageBitmapLoader, {image: {type}});
      throw new Error(`${type} should fail`);
    } catch (error) {
      // @ts-expect-error error typing
      expect(
        error.message.includes("only accepts options.image.type='imagebitmap'"),
        `${type} throws migration error`
      ).toBeTruthy();
    }
  }
});

test('ImageBitmapLoader#load formats', async () => {
  for (const testCase of TEST_CASES) {
    if (!testCase.skip) {
      const image = await load(testCase.url, ImageBitmapLoader);
      expect(image, `${testCase.title} is loaded`).toBeTruthy();
      expect(
        image.width === testCase.width && image.height === testCase.height,
        `${testCase.title} gets correct dimensions`
      ).toBeTruthy();
    }
  }
});

test('ImageBitmapLoader#imagebitmap options', async () => {
  let image = await load(IMAGE_URL, ImageBitmapLoader, {
    image: {type: 'imagebitmap'}
  });
  expect(image.width, 'Default imagebitmap options').toBe(isBrowser ? 480 : image.width);

  image = await load(IMAGE_URL, ImageBitmapLoader, {
    image: {type: 'imagebitmap'},
    imagebitmap: {resizeWidth: 240, resizeHeight: 160}
  });

  expect(image.width, 'Custom resizeWidth').toBe(isBrowser ? 240 : image.width);
});

test('ImageLoader#load({type: \'data\'}) preserves compatibility output', async () => {
  const image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'data'}
  });
  expect(getImageType(image), 'compatibility loader returns data').toBe('data');

  const imageData = getImageData(image);
  expect(imageData.width, 'compatibility data width is correct').toBe(480);
  expect(imageData.height, 'compatibility data height is correct').toBe(320);
});

test('ImageLoader#load({type: \'imagebitmap\'}) preserves bitmap mode', async () => {
  const image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'}
  });
  expect(getImageType(image), 'compatibility loader still supports bitmap mode').toBe('imagebitmap');
});

test('ImageLoader#load({type: \'auto\'}) preserves compatibility behavior', async () => {
  const image = await load(IMAGE_URL, ImageLoader);
  expect(['imagebitmap', 'image', 'data'].includes(getImageType(image)), 'auto returns supported type').toBeTruthy();
});
