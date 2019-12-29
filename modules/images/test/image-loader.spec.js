import test from 'tape-promise/tape';

import {ImageLoader, isImageTypeSupported, getImageType, getImageData} from '@loaders.gl/images';
import {isBrowser, load} from '@loaders.gl/core';

import {TEST_CASES, IMAGE_URL, IMAGE_DATA_URL, SVG_DATA_URL} from './lib/test-cases';
import {getImageSize} from '../dist/es5/lib/parsed-image-api/parsed-image-api';

const TYPES = ['auto', 'imagebitmap', 'image', 'data'].filter(isImageTypeSupported);

test('image loaders#imports', t => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.end();
});

test('ImageLoader#load(URL)', async t => {
  for (const type of TYPES) {
    const image = await load(IMAGE_URL, ImageLoader, {image: {type}});
    t.ok(image, `image of type ${type} loaded successfully from data URL`);
  }
  t.end();
});

test('ImageLoader#load(data URL)', async t => {
  for (const type of TYPES) {
    const image = await load(IMAGE_DATA_URL, ImageLoader, {image: {type}});
    t.ok(image, `image of type ${type} loaded successfully from data URL`);

    const imageData = getImageData(image);
    t.deepEquals(imageData.width, 2, 'image width is correct');
    t.deepEquals(imageData.height, 2, 'image height is correct');
    if (!isBrowser) {
      t.ok(ArrayBuffer.isView(imageData.data), 'image data is `ArrayBuffer`');
      t.equals(imageData.data.byteLength, 16, 'image `data.byteLength` is correct');
    }
  }
  t.end();
});

test(`ImageLoader#load({type: 'data'})`, async t => {
  for (const testCase of TEST_CASES) {
    const {title, url, width, height, skip} = testCase;

    // Skip some test case under Node.js
    if (skip) {
      return;
    }

    const imageData = await load(url, ImageLoader, {image: {type: 'data'}});
    t.equal(getImageType(imageData), 'data', `${title} image type is data`);
    t.equal(getImageData(imageData), imageData, `${title} getImageData() works`);
    t.equal(imageData.width, width, `${title} image has correct width`);
    t.equal(imageData.height, height, `${title} image has correct height`);
  }

  t.end();
});

test('ImageLoader#DATA URL - SVG', async t => {
  if (!isBrowser) {
    t.comment('Skipping browser-only test');
    t.end();
    return;
  }

  const svgImage = await load(SVG_DATA_URL, ImageLoader);
  t.ok(svgImage, 'SVG is loaded from data URL');
  t.end();
});

test('loadImage#formats', async t => {
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
