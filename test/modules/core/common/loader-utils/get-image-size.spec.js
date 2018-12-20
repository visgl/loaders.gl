// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */
import test from 'tape-catch';
import path from 'path';

import {getImageSize} from '@loaders.gl/core';
import {loadBinaryFile} from '@loaders.gl/core';

const PNG_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../../../data/images/img1-preview.png')) ||
  require('test-data/images/img1-preview.png');

const JPEG_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../../../data/images/img1-preview.jpeg')) ||
  require('test-data/images/img1-preview.jpeg');

const GIF_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../../../data/images/img1-preview.gif')) ||
  require('test-data/images/img1-preview.gif');

const BMP_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../../../data/images/img1-preview.bmp')) ||
  require('test-data/images/img1-preview.bmp');

const TIFF_BINARY =
  loadBinaryFile(path.resolve(__dirname, '../../../../data/images/img1-preview.tiff')) ||
  require('test-data/images/img1-preview.png');

const TEST_FILES = [
  ['png', PNG_BINARY],
  ['jpeg', JPEG_BINARY],
  ['gif', GIF_BINARY],
  ['bmp', BMP_BINARY],
  ['tiff', TIFF_BINARY]
];

function testImage(t, typeToTest, acceptableTypes, canThrow) {
  const files = TEST_FILES;

  acceptableTypes = new Set(acceptableTypes);
  for (const [type, image] of files) {
    const shouldPass = acceptableTypes.has(type);
    const buffer = image;

    const mimeType = typeToTest !== 'all' ? `image/${typeToTest}` : undefined;
    if (shouldPass) {
      const dimensions = getImageSize(buffer, mimeType);
      t.equals(dimensions.width, 480, `width, should work with ${type.toUpperCase()} files`);
      t.equals(dimensions.height, 320, `height, should work with ${type.toUpperCase()} files`);
    } else if (canThrow) {
      t.throws(() => getImageSize(buffer, mimeType),
        `should not work with ${type.toUpperCase()} files`);
    // } else {
    //   t.equals(getImageSize[typeToTest](buffer), null,
    //     `should not work with ${type.toUpperCase()} files`);
    }
  }
}

test('getImageSize#png', t => {
  testImage(t, 'png', ['png']);
  t.end();
});

test('getImageSize#jpeg', t => {
  testImage(t, 'jpeg', ['jpeg']);
  t.end();
});

test('getImageSize#gif', t => {
  testImage(t, 'gif', ['gif']);
  t.end();
});

test('getImageSize#bmp', t => {
  testImage(t, 'bmp', ['bmp']);
  t.end();
});

test('getImageSize#all', t => {
  testImage(t, 'all', ['png', 'jpeg', 'gif', 'bmp'], true);
  t.end();
});
