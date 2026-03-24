import test from 'tape-promise/tape';

import {ImageLoader, getImageType, getImageData} from '@loaders.gl/images';
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
  t.end();
});

test('ImageLoader#load(URL) defaults to environment output', async (t) => {
  const image = await load(IMAGE_URL, ImageLoader);
  t.ok(image, 'image loaded successfully from URL');
  t.equal(getImageType(image), isBrowser ? 'imagebitmap' : 'data', 'default image type is correct');

  t.end();
});

test('ImageLoader#load(data URL)', async (t) => {
  const image = await load(IMAGE_DATA_URL, ImageLoader);
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

test('ImageLoader#load({type: \'imagebitmap\'})', async (t) => {
  const image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'}
  });
  t.ok(image, 'image loaded successfully with imagebitmap alias');
  t.equal(
    getImageType(image),
    isBrowser ? 'imagebitmap' : 'data',
    'imagebitmap alias preserves environment output'
  );

  t.end();
});

test('ImageLoader#DATA URL - SVG', async (t) => {
  if (!isBrowser) {
    t.comment('Skipping browser-only test');
    t.end();
    return;
  }

  const svgImage = await load(SVG_DATA_URL, ImageLoader);
  t.ok(svgImage, 'SVG is loaded from data URL');
  t.end();
});

test('ImageLoader#DATA URL - SVG/ not latin', async (t) => {
  if (!isBrowser) {
    t.comment('Skipping browser-only test');
    t.end();
    return;
  }

  const svgImage = await load(SVG_DATA_URL_NOT_LATIN, ImageLoader);
  t.ok(svgImage, 'SVG with characters outside latin range is loaded from data URL');
  t.end();
});

test('ImageLoader#rejects legacy image types', async (t) => {
  for (const type of INVALID_IMAGE_TYPES) {
    try {
      // @ts-expect-error Intentionally exercising removed runtime options
      await load(IMAGE_URL, ImageLoader, {image: {type}});
      t.fail(`${type} should fail`);
    } catch (error) {
      // @ts-expect-error error typing
      t.ok(error.message.includes("only accepts options.image.type='imagebitmap'"), `${type} throws migration error`);
    }
  }

  t.end();
});

test('loadImage#formats', async (t) => {
  for (const testCase of TEST_CASES) {
    if (!testCase.skip) {
      const image = await load(testCase.url, ImageLoader);
      t.ok(image, `${testCase.title} is loaded`);
      t.ok(
        image.width === testCase.width && image.height === testCase.height,
        `${testCase.title} gets correct dimensions`
      );
    }
  }

  t.end();
});

test('loadImage#imagebitmap', async (t) => {
  let image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'}
  });
  t.is(image.width, isBrowser ? 480 : image.width, 'Default imagebitmap options');

  image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'},
    imagebitmap: {resizeWidth: 240, resizeHeight: 160}
  });

  t.is(image.width, isBrowser ? 240 : image.width, 'Custom resizeWidth');

  t.end();
});
