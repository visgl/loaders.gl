// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {encode, parse} from '@loaders.gl/core';
import {ImageWriter, ImageLoader, getBinaryImageMetadata, getImageData} from '@loaders.gl/images';
const IMAGE = {
  width: 2,
  height: 3,
  // biome-ignore format: preserve intentional fixture layout
  data: new Uint8Array([
        255, 0, 0, 255, 0, 255, 255, 255, 0, 0, 255, 255, 255, 255, 0, 255, 0, 255, 0, 255, 255, 0, 255, 255
    ])
};
// Test that we can write and read an image, and that result is identical
test('ImageWriter#write-and-read-image', async () => {
  let arrayBuffer = await encode(IMAGE, ImageWriter, {
    image: {mimeType: 'image/jpeg', jpegQuality: 90}
  });
  let metadata = getBinaryImageMetadata(arrayBuffer);
  expect(metadata).toBeTruthy();
  if (metadata) {
    expect(metadata.width, 'encoded image width is correct').toBe(IMAGE.width);
    expect(metadata.height, 'encoded image height is correct').toBe(IMAGE.height);
    expect(metadata.mimeType, 'encoded image mimeType is correct').toBe('image/jpeg');
  }
  let image = getImageData(await parse(arrayBuffer, ImageLoader));
  expect(image.width, 'encoded and parsed image widths are same').toEqual(IMAGE.width);
  expect(image.height, 'encoded and parsed image heights are same').toEqual(IMAGE.height);
  // NOTE - encoded and decoded data are expected to be equal due to lossy jpeg compression
  // TODO - even, so they seems a bit too different, may want to do additional checks
  // t.deepEqual(image.data, IMAGE.data, 'encoded and parsed image data are same');
  arrayBuffer = await encode(IMAGE, ImageWriter, {image: {mimeType: 'image/png'}});
  metadata = getBinaryImageMetadata(arrayBuffer);
  expect(metadata).toBeTruthy();
  if (metadata) {
    expect(metadata.width, 'encoded image width is correct').toBe(IMAGE.width);
    expect(metadata.height, 'encoded image height is correct').toBe(IMAGE.height);
    expect(metadata.mimeType, 'encoded image mimeType is correct').toBe('image/png');
  }
  image = getImageData(await parse(arrayBuffer, ImageLoader));
  expect(image.width, 'encoded and parsed image widths are same').toEqual(IMAGE.width);
  expect(image.height, 'encoded and parsed image heightsare same').toEqual(IMAGE.height);
  expect(Array.from(image.data), 'encoded and parsed image data are same').toEqual(
    Array.from(IMAGE.data)
  );
});

test('ImageWriter supports OffscreenCanvas and the DOM canvas fallback', async () => {
  const bytes = await encode(IMAGE, ImageWriter, {image: {mimeType: 'image/png'}});
  const jpegBytes = await encode(IMAGE, ImageWriter, {
    image: {mimeType: 'image/jpeg', jpegQuality: 0.5}
  });
  let fallback: ArrayBuffer;
  let fallbackJpegBytes: ArrayBuffer;
  vi.stubGlobal('OffscreenCanvas', undefined);
  try {
    fallback = await encode(IMAGE, ImageWriter, {image: {mimeType: 'image/png'}});
    fallbackJpegBytes = await encode(IMAGE, ImageWriter, {
      image: {mimeType: 'image/jpeg', jpegQuality: 0.5}
    });
  } finally {
    vi.unstubAllGlobals();
  }
  for (const encoded of [jpegBytes, fallbackJpegBytes]) {
    expect(getBinaryImageMetadata(encoded)).toMatchObject({
      width: IMAGE.width,
      height: IMAGE.height,
      mimeType: 'image/jpeg'
    });
  }
  for (const encoded of [bytes, fallback]) {
    expect(getBinaryImageMetadata(encoded)).toMatchObject({
      width: IMAGE.width,
      height: IMAGE.height,
      mimeType: 'image/png'
    });
    const image = getImageData(await parse(encoded, ImageLoader));
    expect(Array.from(image.data)).toEqual(Array.from(IMAGE.data));
  }
});
