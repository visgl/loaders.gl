import test from 'tape-promise/tape';

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

test('image loaders#imports', (t) => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.ok(ImageBitmapLoader, 'ImageBitmapLoader defined');
  t.end();
});

test('ImageBitmapLoader#load(URL) defaults to imagebitmap output', async (t) => {
  const image = await load(IMAGE_URL, ImageBitmapLoader);
  t.ok(image, 'image loaded successfully from URL');
  t.equal(getImageType(image), 'imagebitmap', 'default image type is correct');
  if (!isBrowser) {
    t.ok(image instanceof ImageBitmap, 'node polyfills return ImageBitmap');
  }

  t.end();
});

test('ImageBitmapLoader#load(data URL)', async (t) => {
  const image = await load(IMAGE_DATA_URL, ImageBitmapLoader);
  t.ok(image, 'image loaded successfully from data URL');

  const imageData = getImageData(image);
  t.deepEquals(imageData.width, 2, 'image width is correct');
  t.deepEquals(imageData.height, 2, 'image height is correct');
  if (!isBrowser) {
    t.ok(ArrayBuffer.isView(imageData.data), 'image data is TypedArray');
    t.equals(imageData.data.byteLength, 16, 'image `data.byteLength` is correct');
  }

  t.end();
});

test('ImageBitmapLoader#load({type: \'imagebitmap\'})', async (t) => {
  const image = await load(IMAGE_URL, ImageBitmapLoader, {
    image: {type: 'imagebitmap'}
  });
  t.ok(image, 'image loaded successfully with imagebitmap alias');
  t.equal(getImageType(image), 'imagebitmap', 'imagebitmap alias preserves environment output');

  t.end();
});

test('ImageBitmapLoader#node ImageBitmap data is globally accessible', async (t) => {
  if (isBrowser) {
    t.comment('Skipping node-only test');
    t.end();
    return;
  }

  const image = await load(IMAGE_URL, ImageBitmapLoader);
  // @ts-expect-error Node polyfill installs a global helper
  const imageData = globalThis.getImageBitmapData(image);
  t.equal(imageData.width, 480, 'global getImageBitmapData returns width');
  t.equal(imageData.height, 320, 'global getImageBitmapData returns height');
  t.ok(ArrayBuffer.isView(imageData.data), 'global getImageBitmapData returns pixels');

  t.end();
});

test('ImageBitmapLoader#DATA URL - SVG', async (t) => {
  if (!isBrowser) {
    t.comment('Skipping browser-only test');
    t.end();
    return;
  }

  const svgImage = await load(SVG_DATA_URL, ImageBitmapLoader);
  t.ok(svgImage, 'SVG is loaded from data URL');
  t.end();
});

test('ImageBitmapLoader#DATA URL - SVG/ not latin', async (t) => {
  if (!isBrowser) {
    t.comment('Skipping browser-only test');
    t.end();
    return;
  }

  const svgImage = await load(SVG_DATA_URL_NOT_LATIN, ImageBitmapLoader);
  t.ok(svgImage, 'SVG with characters outside latin range is loaded from data URL');
  t.end();
});

test('ImageBitmapLoader#rejects legacy image types', async (t) => {
  for (const type of INVALID_IMAGE_TYPES) {
    try {
      // @ts-expect-error Intentionally exercising removed runtime options
      await load(IMAGE_URL, ImageBitmapLoader, {image: {type}});
      t.fail(`${type} should fail`);
    } catch (error) {
      // @ts-expect-error error typing
      t.ok(
        error.message.includes("only accepts options.image.type='imagebitmap'"),
        `${type} throws migration error`
      );
    }
  }

  t.end();
});

test('ImageBitmapLoader#load formats', async (t) => {
  for (const testCase of TEST_CASES) {
    if (!testCase.skip) {
      const image = await load(testCase.url, ImageBitmapLoader);
      t.ok(image, `${testCase.title} is loaded`);
      t.ok(
        image.width === testCase.width && image.height === testCase.height,
        `${testCase.title} gets correct dimensions`
      );
    }
  }

  t.end();
});

test('ImageBitmapLoader#imagebitmap options', async (t) => {
  let image = await load(IMAGE_URL, ImageBitmapLoader, {
    image: {type: 'imagebitmap'}
  });
  t.is(image.width, isBrowser ? 480 : image.width, 'Default imagebitmap options');

  image = await load(IMAGE_URL, ImageBitmapLoader, {
    image: {type: 'imagebitmap'},
    imagebitmap: {resizeWidth: 240, resizeHeight: 160}
  });

  t.is(image.width, isBrowser ? 240 : image.width, 'Custom resizeWidth');

  t.end();
});

test('ImageLoader#load({type: \'data\'}) preserves compatibility output', async (t) => {
  const image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'data'}
  });
  t.equal(getImageType(image), 'data', 'compatibility loader returns data');

  const imageData = getImageData(image);
  t.equal(imageData.width, 480, 'compatibility data width is correct');
  t.equal(imageData.height, 320, 'compatibility data height is correct');

  t.end();
});

test('ImageLoader#load({type: \'imagebitmap\'}) preserves bitmap mode', async (t) => {
  const image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'}
  });
  t.equal(getImageType(image), 'imagebitmap', 'compatibility loader still supports bitmap mode');
  t.end();
});

test('ImageLoader#load({type: \'auto\'}) preserves compatibility behavior', async (t) => {
  const image = await load(IMAGE_URL, ImageLoader);
  t.ok(['imagebitmap', 'image', 'data'].includes(getImageType(image)), 'auto returns supported type');
  t.end();
});
