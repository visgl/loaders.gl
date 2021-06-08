// This code is based on binary-gltf-utils
// Copyright (c) 2016-17 Karl Cheng, MIT license

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';

import {getBinaryImageMetadata} from '@loaders.gl/images';

const readFile = (url) => fetchFile(url).then((response) => response.arrayBuffer());

let imagesPromise = null;
const imageMap = {};

export async function loadImages() {
  imagesPromise =
    imagesPromise ||
    Promise.all([
      readFile('@loaders.gl/images/test/data/img1-preview.png').then(
        (data) => (imageMap['image/png'] = data)
      ),
      readFile('@loaders.gl/images/test/data/img1-preview.jpeg').then(
        (data) => (imageMap['image/jpeg'] = data)
      ),
      readFile('@loaders.gl/images/test/data/img1-preview.gif').then(
        (data) => (imageMap['image/gif'] = data)
      ),
      readFile('@loaders.gl/images/test/data/img1-preview.bmp').then(
        (data) => (imageMap['image/bmp'] = data)
      )
    ]);

  await imagesPromise;

  return imageMap;
}

test('getBinaryImageMetadata#mimeType', async (t) => {
  const images = await loadImages();

  for (const mimeType in images) {
    const metadata = getBinaryImageMetadata(images[mimeType]);
    t.equals(metadata && metadata.mimeType, mimeType, `getBinaryImageMetadata(${mimeType})`);
  }
  t.end();
});

test('getBinaryImageMetadata#size', async (t) => {
  const images = await loadImages();
  for (const imageType in images) {
    const dimensions = getBinaryImageMetadata(images[imageType]);
    t.ok(dimensions, `got image metadata for ${imageType.toUpperCase()}`);
    if (dimensions) {
      t.equals(dimensions.width, 480, `width, should work with ${imageType.toUpperCase()} files`);
      t.equals(dimensions.height, 320, `height, should work with ${imageType.toUpperCase()} files`);
    }
  }
  t.end();
});

// Try to avoid false positives

test('isBinaryImage#bmp detection edge case', (t) => {
  const arrayBuffer = new ArrayBuffer(4);
  const dataView = new DataView(arrayBuffer);
  const LITTLE_ENDIAN = true;

  // Encodes as 0x424D3EC4 and when written as little endian stored as 0xC4 0x3E 0x4D 0x42,
  // which matches BMP's magic characters.
  dataView.setFloat32(0, -761.207153, LITTLE_ENDIAN);

  t.equals(dataView.getUint16(0, LITTLE_ENDIAN), 0x4d42, 'Test data written correctly');
  t.notOk(getBinaryImageMetadata(arrayBuffer), 'image/bmp');
  t.end();
});

test('isBinaryImage#jpeg detection edge case', async (t) => {
  const arrayBuffer = new ArrayBuffer(4);
  const dataView = new DataView(arrayBuffer);
  const LITTLE_ENDIAN = true;

  // Encodes as 0xC224D8FF and when written as little endian stored // as 0xFF 0xD8 0x24 0xC2
  dataView.setFloat32(0, -41.211910247802734, LITTLE_ENDIAN);

  t.equals(dataView.getUint16(0), 0xffd8, 'Test data written correctly');
  t.notOk(
    getBinaryImageMetadata(arrayBuffer),
    'getBinaryImageMetadata fails with floating point data matching first 2 bytes of jpeg magic'
  );

  // Encodes as 0xC2FFD8FF and when written as little endian stored // as 0xFF 0xD8 0xFF 0xC2
  dataView.setFloat32(0, -127.92382049560547, LITTLE_ENDIAN);
  t.equals(dataView.getUint32(0), 0xffd8ffc2, 'Test data written correctly');

  // False positive case!
  t.notOk(
    getBinaryImageMetadata(arrayBuffer),
    'getBinaryImageMetadata has a false positive with floating point data matching first 3 bytes of jpeg magic'
  );

  t.end();
});
