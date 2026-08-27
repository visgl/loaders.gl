// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {loadImageTexture, loadImageTextureArray, loadImageTextureCube} from '@loaders.gl/textures';
import {getImageData, getImageType, isImage} from '@loaders.gl/images';
const LUT_URL = '@loaders.gl/images/test/data/ibl/brdfLUT.png';
const PAPERMILL_URL = '@loaders.gl/images/test/data/ibl/papermill';
test('loadImageTexture#mipLevels=0', async () => {
  const image = await loadImageTexture(LUT_URL, {fetch: fetchFile});
  expect(isImage(image)).toBeTruthy();
  expect(getImageType(image), 'returns the strict bitmap image type').toBe('imagebitmap');
  expect(
    getImageData(image).data.length > 0,
    'bitmap result can be converted to raw pixel data'
  ).toBeTruthy();
});
test('loadImageTexture#mipLevels=auto', async () => {
  const mipmappedImage = await loadImageTexture(({lod}) => `specular/specular_back_${lod}.jpg`, {
    baseUrl: PAPERMILL_URL,
    fetch: fetchFile,
    image: {
      mipLevels: 'auto'
    }
  });
  expect(mipmappedImage.every(isImage)).toBeTruthy();
  expect(
    mipmappedImage.every(image => getImageType(image) === 'imagebitmap'),
    'every mip level is returned as an ImageBitmap'
  ).toBeTruthy();
});
test('loadImageTextureArray#mipLevels=0', async () => {
  const images = await loadImageTextureArray(
    10,
    ({index}) => `specular/specular_back_${index}.jpg`,
    {
      baseUrl: PAPERMILL_URL,
      fetch: fetchFile
    }
  );
  expect(images.length, 'loadArray loaded 10 images').toBe(10);
  expect(images.every(isImage)).toBeTruthy();
  expect(
    images.every(image => getImageType(image) === 'imagebitmap'),
    'every layer is an ImageBitmap'
  ).toBeTruthy();
});
test('loadImageTextureArray#mipLevels=auto', async () => {
  const images = await loadImageTextureArray(
    1,
    ({index, lod}) => `specular/specular_back_${lod}.jpg`,
    {
      baseUrl: PAPERMILL_URL,
      fetch: fetchFile,
      image: {
        mipLevels: 'auto'
      }
    }
  );
  expect(images.length, 'loadArray loaded 1 image').toBe(1);
  images.every(imageMips => {
    expect(imageMips.length, 'array of mip images has correct length').toBe(10);
    expect(imageMips.every(isImage), 'entry is a valid array of mip images').toBeTruthy();
    expect(
      imageMips.every(image => getImageType(image) === 'imagebitmap'),
      'entry preserves the strict bitmap image type'
    ).toBeTruthy();
  });
});
test('loadImageTextureCube#mipLevels=0', async () => {
  const imageCube = await loadImageTextureCube(
    ({direction}) => `diffuse/diffuse_${direction}_0.jpg`,
    {
      baseUrl: PAPERMILL_URL,
      fetch: fetchFile
    }
  );
  expect(Object.keys(imageCube).length, 'image cube has 6 images').toBe(6);
  for (const face in imageCube) {
    const image = imageCube[face];
    expect(isImage(image), `face ${face} is a valid image`).toBeTruthy();
    expect(getImageType(image), `face ${face} is returned as an ImageBitmap`).toBe('imagebitmap');
  }
});
test('loadImageTextureCube#mipLevels=auto', async () => {
  const imageCube = await loadImageTextureCube(
    ({direction, lod}) => `specular/specular_${direction}_${lod}.jpg`,
    {
      baseUrl: PAPERMILL_URL,
      fetch: fetchFile,
      image: {
        mipLevels: 'auto'
      }
    }
  );
  expect(Object.keys(imageCube).length, 'image cube has 6 images').toBe(6);
  for (const face in imageCube) {
    const imageMips = imageCube[face];
    expect(imageMips.length, 'array of mip images has correct length').toBe(10);
    expect(imageMips.every(isImage), `face ${face} is a valid array of mip images`).toBeTruthy();
    expect(
      imageMips.every(image => getImageType(image) === 'imagebitmap'),
      `face ${face} preserves the strict bitmap image type`
    ).toBeTruthy();
  }
});
test('loadImageTexture#rejects deprecated image output modes', async () => {
  await expect(
    loadImageTexture(LUT_URL, {
      fetch: fetchFile,
      image: {type: 'data'}
    } as any),
    'deprecated image output modes are rejected by the helper path'
  ).rejects.toThrow(/ImageBitmapLoader only accepts options\.image\.type='imagebitmap'/);
});
