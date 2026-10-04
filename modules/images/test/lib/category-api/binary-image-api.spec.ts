// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {getBinaryImageMetadata} from '@loaders.gl/images';
const readFile = (url: string): Promise<ArrayBuffer> =>
  fetchFile(url).then(response => response.arrayBuffer());
let imagesPromise: Promise<ArrayBuffer[]> | null = null;
const imageMap: {
  [mimeType: string]: ArrayBuffer;
} = {};
export async function loadImages() {
  imagesPromise =
    imagesPromise ||
    Promise.all([
      readFile('@loaders.gl/images/test/data/img1-preview.png').then(
        data => (imageMap['image/png'] = data)
      ),
      readFile('@loaders.gl/images/test/data/img1-preview.jpeg').then(
        data => (imageMap['image/jpeg'] = data)
      ),
      readFile('@loaders.gl/images/test/data/img1-preview.gif').then(
        data => (imageMap['image/gif'] = data)
      ),
      readFile('@loaders.gl/images/test/data/img1-preview.bmp').then(
        data => (imageMap['image/bmp'] = data)
      ),
      readFile('@loaders.gl/images/test/data/avif/hato.profile0.8bpc.yuv420.avif').then(
        data => (imageMap['image/avif'] = data)
      )
    ]);
  await imagesPromise;
  return imageMap;
}
test('getBinaryImageMetadata#mimeType', async () => {
  const images = await loadImages();
  for (const mimeType in images) {
    const metadata = getBinaryImageMetadata(images[mimeType]);
    expect(metadata && metadata.mimeType, `getBinaryImageMetadata(${mimeType})`).toBe(mimeType);
  }
});
test('getBinaryImageMetadata#size', async () => {
  const images = await loadImages();
  for (const imageType in images) {
    const dimensions = getBinaryImageMetadata(images[imageType]);
    expect(dimensions, `got image metadata for ${imageType.toUpperCase()}`).toBeTruthy();
    if (dimensions) {
      expect(dimensions.mimeType, `width, should work with ${imageType.toUpperCase()} files`).toBe(
        imageType
      );
      if (dimensions.mimeType !== 'image/avif') {
        expect(dimensions.width, `width, should work with ${imageType.toUpperCase()} files`).toBe(
          480
        );
        expect(dimensions.height, `height, should work with ${imageType.toUpperCase()} files`).toBe(
          320
        );
      }
    }
  }
});
// Try to avoid false positives
test('isBinaryImage#bmp detection edge case', () => {
  const arrayBuffer = new ArrayBuffer(4);
  const dataView = new DataView(arrayBuffer);
  const LITTLE_ENDIAN = true;
  // Encodes as 0x424D3EC4 and when written as little endian stored as 0xC4 0x3E 0x4D 0x42,
  // which matches BMP's magic characters.
  dataView.setFloat32(0, -761.207153, LITTLE_ENDIAN);
  expect(dataView.getUint16(0, LITTLE_ENDIAN), 'Test data written correctly').toBe(0x4d42);
  expect(getBinaryImageMetadata(arrayBuffer), 'image/bmp').toBeFalsy();
});
test('isBinaryImage#jpeg detection edge case', async () => {
  const arrayBuffer = new ArrayBuffer(4);
  const dataView = new DataView(arrayBuffer);
  const LITTLE_ENDIAN = true;
  // Encodes as 0xC224D8FF and when written as little endian stored // as 0xFF 0xD8 0x24 0xC2
  dataView.setFloat32(0, -41.211910247802734, LITTLE_ENDIAN);
  expect(dataView.getUint16(0), 'Test data written correctly').toBe(0xffd8);
  expect(
    getBinaryImageMetadata(arrayBuffer),
    'getBinaryImageMetadata fails with floating point data matching first 2 bytes of jpeg magic'
  ).toBeFalsy();
  // Encodes as 0xC2FFD8FF and when written as little endian stored // as 0xFF 0xD8 0xFF 0xC2
  dataView.setFloat32(0, -127.92382049560547, LITTLE_ENDIAN);
  expect(dataView.getUint32(0), 'Test data written correctly').toBe(0xffd8ffc2);
  // False positive case!
  expect(
    getBinaryImageMetadata(arrayBuffer),
    'getBinaryImageMetadata has a false positive with floating point data matching first 3 bytes of jpeg magic'
  ).toBeFalsy();
});

/** A complete 2x2 RGBA PNG signature and IHDR chunk, including its CRC. */
function createPngHeader(): Uint8Array {
  return new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 2, 0, 0, 0, 2, 8, 6, 0,
    0, 0, 114, 182, 13, 36
  ]);
}

test('PNG metadata requires a complete header and respects DataView subviews', () => {
  const header = createPngHeader();
  const storage = new Uint8Array(header.length + 2);
  storage.set(header, 1);
  expect(getBinaryImageMetadata(new DataView(storage.buffer, 1, header.length))).toEqual({
    mimeType: 'image/png',
    width: 2,
    height: 2
  });
});

test.each([
  0, 4, 8, 12, 16, 24, 32
])('PNG metadata rejects a %s-byte truncated header', byteLength => {
  const header = createPngHeader();
  expect(getBinaryImageMetadata(new DataView(header.buffer, 0, byteLength))).toBeNull();
});

test.each([
  {label: 'first signature word', byteOffset: 0},
  {label: 'remaining signature word', byteOffset: 4},
  {label: 'IHDR length', byteOffset: 8},
  {label: 'IHDR chunk type', byteOffset: 12}
])('PNG metadata rejects invalid $label', ({byteOffset}) => {
  const header = createPngHeader();
  header[byteOffset] = 255;
  expect(getBinaryImageMetadata(header.buffer)).toBeNull();
});
