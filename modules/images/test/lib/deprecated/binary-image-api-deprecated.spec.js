// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

import test from 'tape-promise/tape';

import {isBinaryImage, getBinaryImageMIMEType, getBinaryImageSize} from '@loaders.gl/images';
import {loadImages} from '../category-api/binary-image-api.spec';

test('isBinaryImage (deprecated)', async (t) => {
  const images = await loadImages();
  for (const imageType in images) {
    t.equals(isBinaryImage(images[imageType]), true, `isBinaryImage(${imageType})`);
  }
  t.equals(isBinaryImage(images['image/png'], 'image/png'), true, 'isBinaryImage(png, png)');
  t.equals(isBinaryImage(images['image/png'], 'image/jpeg'), false, 'isBinaryImage(png, jpeg)');
  t.equals(isBinaryImage(images['image/jpeg'], 'image/png'), false, 'isBinaryImage(jpeg, png)');
  t.equals(isBinaryImage(images['image/jpeg'], 'image/jpeg'), true, 'isBinaryImage(jpeg, jpeg)');
  t.end();
});

test('getBinaryImageMIMEType (deprecated)', async (t) => {
  const images = await loadImages();
  for (const imageType in images) {
    t.equals(
      getBinaryImageMIMEType(images[imageType]),
      imageType,
      `getBinaryImageMIMEType(${imageType})`
    );
  }
  t.end();
});

test('getBinaryImageSize (deprecated)', async (t) => {
  const images = await loadImages();
  for (const imageType in images) {
    const dimensions = getBinaryImageSize(images[imageType]);
    t.equals(dimensions.width, 480, `width, should work with ${imageType.toUpperCase()} files`);
    t.equals(dimensions.height, 320, `height, should work with ${imageType.toUpperCase()} files`);
  }
  t.end();
});
