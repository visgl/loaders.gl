// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';

import {isBinaryImage, getBinaryImageMIMEType, getBinaryImageSize} from '@loaders.gl/images';

const readFile = url => fetchFile(url).then(response => response.arrayBuffer());

const IMAGES = {};
const IMAGES_PROMISE = Promise.all([
  readFile('@loaders.gl/images/test/data/img1-preview.png').then(data => (IMAGES.png = data)),
  readFile('@loaders.gl/images/test/data/img1-preview.jpeg').then(data => (IMAGES.jpeg = data)),
  readFile('@loaders.gl/images/test/data/img1-preview.gif').then(data => (IMAGES.gif = data)),
  readFile('@loaders.gl/images/test/data/img1-preview.bmp').then(data => (IMAGES.bmp = data))
  // readFile('@loaders.gl/images/test/data/img1-preview.tiff').then(data => IMAGES.tiff = data)
]).then(() => IMAGES);

test('isBinaryImage', async t => {
  const images = await IMAGES_PROMISE;
  for (const imageType in images) {
    t.equals(isBinaryImage(images[imageType]), true, `isBinaryImage(${imageType})`);
  }
  t.equals(isBinaryImage(images.png, 'image/png'), true, 'isBinaryImage(png, png)');
  t.equals(isBinaryImage(images.png, 'image/jpeg'), false, 'isBinaryImage(png, jpeg)');
  t.equals(isBinaryImage(images.jpeg, 'image/png'), false, 'isBinaryImage(jpeg, png)');
  t.equals(isBinaryImage(images.jpeg, 'image/jpeg'), true, 'isBinaryImage(jpeg, jpeg)');
  t.end();
});

test('getBinaryImageMIMEType', async t => {
  const images = await IMAGES_PROMISE;
  for (const imageType in images) {
    t.equals(
      getBinaryImageMIMEType(images[imageType]),
      `image/${imageType}`,
      `getBinaryImageMIMEType(${imageType})`
    );
  }
  t.end();
});

test('getBinaryImageSize', async t => {
  const images = await IMAGES_PROMISE;
  for (const imageType in images) {
    const dimensions = getBinaryImageSize(images[imageType]);
    t.equals(dimensions.width, 480, `width, should work with ${imageType.toUpperCase()} files`);
    t.equals(dimensions.height, 320, `height, should work with ${imageType.toUpperCase()} files`);
  }
  t.end();
});
