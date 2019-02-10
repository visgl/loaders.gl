// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

/* eslint-disable max-len, max-statements */
import test from 'tape-promise/tape';
import path from 'path';
import {readFileSync, getImageSize} from '@loaders.gl/core';

/*
import {addFileAliases, isBrowser} from '@loaders.gl/core';

const TEST_DATA_DIR = path.resolve(__dirname, '../../data');

// Makes sample files available to readFile in browser
// These are bundled using webpack arraybuffer-loader
addFileAliases(TEST_DATA_DIR, {
  'images/img1-preview.png': isBrowser && require('../../data/images/img1-preview.png'),
  'images/img1-preview.jpeg': isBrowser && require('../../data/images/img1-preview.jpeg'),
  'images/img1-preview.gif': isBrowser && require('../../data/images/img1-preview.gif'),
  'images/img1-preview.bmp': isBrowser && require('../../data/images/img1-preview.bmp'),
  'images/img1-preview.tiff': isBrowser && require('../../data/images/img1-preview.tiff')
});

const PNG_BINARY = readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.png'));
const JPEG_BINARY = readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.jpeg'));
const GIF_BINARY = readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.gif'));
const BMP_BINARY = readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.bmp'));
const TIFF_BINARY = readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.tiff'));
*/

const TEST_DATA_DIR = path.resolve(__dirname, '../../data');

const PNG_BINARY =
  readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.png')) ||
  require('../../data/images/img1-preview.png');

const JPEG_BINARY =
  readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.jpeg')) ||
  require('../../data/images/img1-preview.jpeg');

const GIF_BINARY =
  readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.gif')) ||
  require('../../data/images/img1-preview.gif');

const BMP_BINARY =
  readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.bmp')) ||
  require('../../data/images/img1-preview.bmp');

const TIFF_BINARY =
  readFileSync(path.resolve(TEST_DATA_DIR, 'images/img1-preview.tiff')) ||
  require('../../data/images/img1-preview.png');

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
  testImage(t, 'all', ['png', 'jpeg', 'gif', 'bmp']);
  t.end();
});
