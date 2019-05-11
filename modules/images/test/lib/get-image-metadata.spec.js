// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';

import {isImage, getImageMIMEType, getImageSize, getImageMetadata} from '@loaders.gl/images';

const readFile = url => fetchFile(url).then(response => response.arrayBuffer());

const IMAGES = {};
const IMAGES_PROMISE = Promise.all([
  readFile('@loaders.gl/images/test/data/img1-preview.png').then(data => (IMAGES.png = data)),
  readFile('@loaders.gl/images/test/data/img1-preview.jpeg').then(data => (IMAGES.jpeg = data)),
  readFile('@loaders.gl/images/test/data/img1-preview.gif').then(data => (IMAGES.gif = data)),
  readFile('@loaders.gl/images/test/data/img1-preview.bmp').then(data => (IMAGES.bmp = data))
  // readFile('@loaders.gl/images/test/data/img1-preview.tiff').then(data => IMAGES.tiff = data)
]).then(() => IMAGES);

test('isImage', async t => {
  const images = await IMAGES_PROMISE;
  for (const imageType in images) {
    t.equals(isImage(images[imageType]), true, `isImage(${imageType})`);
  }
  t.equals(isImage(images.png, 'image/png'), true, 'isImage(png, png)');
  t.equals(isImage(images.png, 'image/jpeg'), false, 'isImage(png, jpeg)');
  t.equals(isImage(images.jpeg, 'image/png'), false, 'isImage(jpeg, png)');
  t.equals(isImage(images.jpeg, 'image/jpeg'), true, 'isImage(jpeg, jpeg)');
  t.end();
});

test('getImageMIMEType', async t => {
  const images = await IMAGES_PROMISE;
  for (const imageType in images) {
    t.equals(
      getImageMIMEType(images[imageType]),
      `image/${imageType}`,
      `getImageMIMEType(${imageType})`
    );
  }
  t.end();
});

test('getImageSize', async t => {
  const images = await IMAGES_PROMISE;
  for (const imageType in images) {
    const dimensions = getImageSize(images[imageType]);
    t.equals(dimensions.width, 480, `width, should work with ${imageType.toUpperCase()} files`);
    t.equals(dimensions.height, 320, `height, should work with ${imageType.toUpperCase()} files`);
  }
  t.end();
});

test('getImageMetadata', async t => {
  const images = await IMAGES_PROMISE;
  for (const imageType in images) {
    const metadata = getImageMetadata(images[imageType]);
    t.equals(metadata.width, 480, `width, should work with ${imageType.toUpperCase()} files`);
    t.equals(metadata.height, 320, `height, should work with ${imageType.toUpperCase()} files`);
    t.equals(metadata.mimeType, `image/${imageType}`, `mimeType = ${imageType}`);
  }
  t.end();
});
