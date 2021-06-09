import test from 'tape-promise/tape';

import {ImageLoader, isImageTypeSupported, getImageType, getImageData} from '@loaders.gl/images';
import {isBrowser, load} from '@loaders.gl/core';

import {TEST_CASES, IMAGE_URL, IMAGE_DATA_URL, SVG_DATA_URL} from './lib/test-cases';

const TYPES = ['auto', 'imagebitmap', 'image', 'data'].filter(isImageTypeSupported);

test('image loaders#imports', (t) => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.end();
});

test('ImageLoader#load(URL)', async (t) => {
  for (const type of TYPES) {
    const image = await load(IMAGE_URL, ImageLoader, {image: {type}});
    t.ok(image, `image of type ${type} loaded successfully from data URL`);
  }
  t.end();
});

test('ImageLoader#load(data URL)', async (t) => {
  for (const type of TYPES) {
    const image = await load(IMAGE_DATA_URL, ImageLoader, {image: {type}});
    t.ok(image, `image of type ${type} loaded successfully from data URL`);

    const imageData = getImageData(image);
    t.deepEquals(imageData.width, 2, 'image width is correct');
    t.deepEquals(imageData.height, 2, 'image height is correct');
    if (!isBrowser) {
      t.ok(ArrayBuffer.isView(imageData.data), 'image data is TypedArray');
      t.equals(imageData.data.byteLength, 16, 'image `data.byteLength` is correct');
    }
  }
  t.end();
});

test(`ImageLoader#load({type: 'data'})`, async (t) => {
  TEST_CASES.shift();
  TEST_CASES.shift();
  for (const testCase of TEST_CASES) {
    const {title, url, width, height, skip} = testCase;

    // Skip some test case under Node.js
    if (skip) {
      continue; // eslint-disable-line
    }

    const imageData = await load(url, ImageLoader, {image: {type: 'data'}});
    t.equal(getImageType(imageData), 'data', `${title} image type is data`);
    t.equal(imageData.width, width, `${title} image has correct width`);
    t.equal(imageData.height, height, `${title} image has correct height`);
    t.ok(ArrayBuffer.isView(imageData.data), `${title} image data is TypedArray`);
  }

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
  if (!isImageTypeSupported('imagebitmap')) {
    t.comment('Browser only');
    t.end();
    return;
  }
  let image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'}
  });
  t.is(image.width, 480, 'Default imagebitmap options');

  image = await load(IMAGE_URL, ImageLoader, {
    image: {type: 'imagebitmap'},
    imagebitmap: {resizeWidth: 240, resizeHeight: 160}
  });

  t.is(image.width, 240, 'Custom resizeWidth');

  t.end();
});
