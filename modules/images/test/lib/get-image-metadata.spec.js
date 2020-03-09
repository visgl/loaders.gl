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

test('isImage#bmp detection edge case', t => {
  const arrayBuffer = new ArrayBuffer(4);
  const dataView = new DataView(arrayBuffer);
  const LITTLE_ENDIAN = true;

  // Encodes as 0x424D3EC4 and when written as little endian stored as 0xC4 0x3E 0x4D 0x42,
  // which matches BMP's magic characters.
  dataView.setFloat32(0, -761.207153, LITTLE_ENDIAN);

  t.equals(dataView.getUint16(0, LITTLE_ENDIAN), 0x4d42, 'Test data written correctly');
  t.notOk(isImage(arrayBuffer, 'image/bmp'));
  t.end();
});

test('isImage#jpeg detection edge case', async t => {
  const arrayBuffer = new ArrayBuffer(4);
  const dataView = new DataView(arrayBuffer);
  const LITTLE_ENDIAN = true;

  // Encodes as 0xC224D8FF and when written as little endian stored // as 0xFF 0xD8 0x24 0xC2
  dataView.setFloat32(0, -41.211910247802734, LITTLE_ENDIAN);

  t.equals(dataView.getUint16(0), 0xffd8, 'Test data written correctly');
  t.notOk(
    isImage(arrayBuffer),
    'isImage fails with floating point data matching first 2 bytes of jpeg magic'
  );

  // Encodes as 0xC2FFD8FF and when written as little endian stored // as 0xFF 0xD8 0xFF 0xC2
  dataView.setFloat32(0, -127.92382049560547, LITTLE_ENDIAN);
  t.equals(dataView.getUint32(0), 0xffd8ffc2, 'Test data written correctly');

  // False positive case!
  t.ok(
    isImage(arrayBuffer),
    'isImage has a false positive with floating point data matching first 3 bytes of jpeg magic'
  );

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
