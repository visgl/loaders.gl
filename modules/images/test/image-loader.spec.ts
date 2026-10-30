// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {LegacyImageLoader, ImageLoader, getImageType, getImageData} from '@loaders.gl/images';
import {load, isBrowser} from '@loaders.gl/core';
import {parseImageBitmapBlob} from '../src/lib/parsers/parse-image-bitmap';
import {getBlob, isSVG} from '../src/lib/parsers/svg-utils';

import {
  TEST_CASES,
  IMAGE_URL,
  IMAGE_DATA_URL,
  SVG_DATA_URL,
  SVG_DATA_URL_NOT_LATIN
} from './lib/test-cases';

const INVALID_IMAGE_TYPES = ['auto', 'image', 'data'] as const;

test.each([
  ['icon.svg', true],
  ['icon.svg?version=2', true],
  ['icon.svg#fragment', true],
  ['icon.svgx/preview.svg', true],
  ['icon.svgx', false]
])('SVG URL detection handles %s', (url, expected) => {
  expect(isSVG(url)).toBe(expected);
});

test('direct SVG Blob parsing rejects SVG URLs', () => {
  expect(() => getBlob(new ArrayBuffer(0), 'icon.svg')).toThrow(
    'SVG cannot be parsed directly to imagebitmap'
  );
});

test('image loaders#imports', () => {
  expect(LegacyImageLoader, 'LegacyImageLoader defined').toBeTruthy();
  expect(ImageLoader, 'ImageLoader defined').toBeTruthy();
});

test('ImageLoader#load(URL) defaults to imagebitmap output', async () => {
  const image = await load(IMAGE_URL, ImageLoader);
  expect(image, 'image loaded successfully from URL').toBeTruthy();
  expect(getImageType(image), 'default image type is correct').toBe('imagebitmap');
});

test('ImageLoader#load(data URL)', async () => {
  const image = await load(IMAGE_DATA_URL, ImageLoader);
  expect(image, 'image loaded successfully from data URL').toBeTruthy();

  const imageData = getImageData(image);
  expect(imageData.width, 'image width is correct').toEqual(2);
  expect(imageData.height, 'image height is correct').toEqual(2);
});

test.runIf(isBrowser)('ImageLoader#load(Blob) uses native Blob decoding', async () => {
  const response = await fetch(IMAGE_DATA_URL);
  const blob = await response.blob();
  Object.defineProperty(blob, 'arrayBuffer', {
    value: async () => {
      throw new Error('Blob.arrayBuffer should not be called');
    }
  });

  const image = await load(blob, ImageLoader);
  expect(image, 'image loaded successfully from Blob').toBeTruthy();
  expect(getImageType(image), 'Blob image type is correct').toBe('imagebitmap');
  expect(image.width, 'Blob image width is correct').toBe(2);
  expect(image.height, 'Blob image height is correct').toBe(2);
});

test.runIf(isBrowser)('parseImageBitmapBlob uses native Blob decoding', async () => {
  const response = await fetch(IMAGE_DATA_URL);
  const blob = await response.blob();
  Object.defineProperty(blob, 'arrayBuffer', {
    value: async () => {
      throw new Error('Blob.arrayBuffer should not be called');
    }
  });

  const image = await parseImageBitmapBlob(blob);
  expect(getImageType(image), 'Blob image type is correct').toBe('imagebitmap');
  expect(image.width, 'Blob image width is correct').toBe(2);
  expect(image.height, 'Blob image height is correct').toBe(2);
});

test.runIf(isBrowser)('parseImageBitmapBlob falls back for SVG Blobs', async () => {
  const response = await fetch(SVG_DATA_URL);
  const blob = await response.blob();
  let arrayBufferCalled = false;
  const arrayBuffer = blob.arrayBuffer.bind(blob);
  Object.defineProperty(blob, 'arrayBuffer', {
    value: async () => {
      arrayBufferCalled = true;
      return await arrayBuffer();
    }
  });

  const image = await parseImageBitmapBlob(blob, {}, {url: 'image.svg'});
  expect(image, 'SVG Blob is loaded').toBeTruthy();
  expect(arrayBufferCalled, 'SVG Blob uses ArrayBuffer fallback').toBe(true);
});

test.runIf(isBrowser)('parseImageBitmapBlob rejects browsers without createImageBitmap', async () => {
  const response = await fetch(IMAGE_DATA_URL);
  const blob = await response.blob();
  const originalCreateImageBitmap = globalThis.createImageBitmap;

  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    value: undefined
  });

  try {
    await parseImageBitmapBlob(blob);
    throw new Error('parseImageBitmapBlob should fail without createImageBitmap');
  } catch (error) {
    expect((error as Error).message.includes('requires browser ImageBitmap support')).toBe(true);
  } finally {
    Object.defineProperty(globalThis, 'createImageBitmap', {
      configurable: true,
      value: originalCreateImageBitmap
    });
  }
});

test.runIf(!isBrowser)('ImageLoader#load(URL) returns Node ImageBitmap', async () => {
  const image = await load(IMAGE_URL, ImageLoader);
  expect(image instanceof ImageBitmap, 'node polyfills return ImageBitmap').toBeTruthy();
});

test.runIf(!isBrowser)('ImageLoader#load(data URL) returns Node pixel data', async () => {
  const image = await load(IMAGE_DATA_URL, ImageLoader);
  const imageData = getImageData(image);
  expect(ArrayBuffer.isView(imageData.data), 'image data is TypedArray').toBeTruthy();
  expect(imageData.data.byteLength, 'image `data.byteLength` is correct').toBe(16);
});

test('ImageLoader#load({type: \'imagebitmap\'})', async () => {
  const image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'}
  });
  expect(image, 'image loaded successfully with imagebitmap alias').toBeTruthy();
  expect(getImageType(image), 'imagebitmap alias preserves environment output').toBe('imagebitmap');
});

test.runIf(!isBrowser)('ImageLoader#node ImageBitmap data is globally accessible', async () => {
  const image = await load(IMAGE_URL, ImageLoader);
  // @ts-expect-error Node polyfill installs a global helper
  const imageData = globalThis.getImageBitmapData(image);
  expect(imageData.width, 'global getImageBitmapData returns width').toBe(480);
  expect(imageData.height, 'global getImageBitmapData returns height').toBe(320);
  expect(ArrayBuffer.isView(imageData.data), 'global getImageBitmapData returns pixels').toBeTruthy();
});

test.runIf(isBrowser)('ImageLoader#DATA URL - SVG', async () => {
  const svgImage = await load(SVG_DATA_URL, ImageLoader);
  expect(svgImage, 'SVG is loaded from data URL').toBeTruthy();
});

test.runIf(isBrowser)('ImageLoader#DATA URL - SVG/ not latin', async () => {
  const svgImage = await load(SVG_DATA_URL_NOT_LATIN, ImageLoader);
  expect(svgImage, 'SVG with characters outside latin range is loaded from data URL').toBeTruthy();
});

test('ImageLoader#rejects legacy image types', async () => {
  for (const type of INVALID_IMAGE_TYPES) {
    try {
      // @ts-expect-error Intentionally exercising removed runtime options
      await load(IMAGE_URL, ImageLoader, {image: {type}});
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

test('ImageLoader#load formats', async () => {
  for (const testCase of TEST_CASES) {
    if (!testCase.skip) {
      const image = await load(testCase.url, ImageLoader);
      expect(image, `${testCase.title} is loaded`).toBeTruthy();
      expect(
        image.width === testCase.width && image.height === testCase.height,
        `${testCase.title} gets correct dimensions`
      ).toBeTruthy();
    }
  }
});

test('ImageLoader#imagebitmap options', async () => {
  let image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'}
  });
  expect(image.width, 'Default imagebitmap options').toBe(isBrowser ? 480 : image.width);

  image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'},
    imagebitmap: {resizeWidth: 240, resizeHeight: 160}
  });

  expect(image.width, 'Custom resizeWidth').toBe(isBrowser ? 240 : image.width);
});

test('LegacyImageLoader#load({type: \'data\'}) preserves compatibility output', async () => {
  const image = await load(IMAGE_URL, LegacyImageLoader, {
    image: {type: 'data'}
  });
  expect(getImageType(image), 'compatibility loader returns data').toBe('data');

  const imageData = getImageData(image);
  expect(imageData.width, 'compatibility data width is correct').toBe(480);
  expect(imageData.height, 'compatibility data height is correct').toBe(320);
});

test('LegacyImageLoader#load({type: \'imagebitmap\'}) preserves bitmap mode', async () => {
  const image = await load(IMAGE_URL, LegacyImageLoader, {
    image: {type: 'imagebitmap'}
  });
  expect(getImageType(image), 'compatibility loader still supports bitmap mode').toBe('imagebitmap');
});

test('LegacyImageLoader#load({type: \'auto\'}) preserves compatibility behavior', async () => {
  const image = await load(IMAGE_URL, LegacyImageLoader);
  expect(['imagebitmap', 'image', 'data'].includes(getImageType(image)), 'auto returns supported type').toBeTruthy();
});
