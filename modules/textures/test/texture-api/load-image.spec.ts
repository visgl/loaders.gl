// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {loadImageTexture, loadImageTextureArray, loadImageTextureCube} from '@loaders.gl/textures';
import {getImageData, getImageType, isImage} from '@loaders.gl/images';

const LUT_URL = '@loaders.gl/images/test/data/ibl/brdfLUT.png';
const PAPERMILL_URL = '@loaders.gl/images/test/data/ibl/papermill';

test('loadImageTexture#mipLevels=0', async t => {
  const image = await loadImageTexture(LUT_URL, {fetch: fetchFile});
  t.ok(isImage(image));
  t.equal(getImageType(image), 'imagebitmap', 'returns the strict bitmap image type');
  t.ok(getImageData(image).data.length > 0, 'bitmap result can be converted to raw pixel data');
  t.end();
});

test('loadImageTexture#mipLevels=auto', async t => {
  const mipmappedImage = await loadImageTexture(({lod}) => `specular/specular_back_${lod}.jpg`, {
    baseUrl: PAPERMILL_URL,
    fetch: fetchFile,
    image: {
      mipLevels: 'auto'
    }
  });
  t.ok(mipmappedImage.every(isImage));
  t.ok(
    mipmappedImage.every(image => getImageType(image) === 'imagebitmap'),
    'every mip level is returned as an ImageBitmap'
  );
  t.end();
});

test('loadImageTextureArray#mipLevels=0', async t => {
  const images = await loadImageTextureArray(
    10,
    ({index}) => `specular/specular_back_${index}.jpg`,
    {
      baseUrl: PAPERMILL_URL,
      fetch: fetchFile
    }
  );
  t.equal(images.length, 10, 'loadArray loaded 10 images');
  t.ok(images.every(isImage));
  t.ok(
    images.every(image => getImageType(image) === 'imagebitmap'),
    'every layer is an ImageBitmap'
  );
  t.end();
});

test('loadImageTextureArray#mipLevels=auto', async t => {
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
  t.equal(images.length, 1, 'loadArray loaded 1 image');
  images.every(imageMips => {
    t.equal(imageMips.length, 10, 'array of mip images has correct length');
    t.ok(imageMips.every(isImage), 'entry is a valid array of mip images');
    t.ok(
      imageMips.every(image => getImageType(image) === 'imagebitmap'),
      'entry preserves the strict bitmap image type'
    );
  });
  t.end();
});

test('loadImageTextureCube#mipLevels=0', async t => {
  const imageCube = await loadImageTextureCube(
    ({direction}) => `diffuse/diffuse_${direction}_0.jpg`,
    {
      baseUrl: PAPERMILL_URL,
      fetch: fetchFile
    }
  );
  t.equal(Object.keys(imageCube).length, 6, 'image cube has 6 images');
  for (const face in imageCube) {
    const image = imageCube[face];
    t.ok(isImage(image), `face ${face} is a valid image`);
    t.equal(getImageType(image), 'imagebitmap', `face ${face} is returned as an ImageBitmap`);
  }
  t.end();
});

test('loadImageTextureCube#mipLevels=auto', async t => {
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
  t.equal(Object.keys(imageCube).length, 6, 'image cube has 6 images');
  for (const face in imageCube) {
    const imageMips = imageCube[face];
    t.equal(imageMips.length, 10, 'array of mip images has correct length');
    t.ok(imageMips.every(isImage), `face ${face} is a valid array of mip images`);
    t.ok(
      imageMips.every(image => getImageType(image) === 'imagebitmap'),
      `face ${face} preserves the strict bitmap image type`
    );
  }
  t.end();
});

test('loadImageTexture#rejects deprecated image output modes', async t => {
  await t.rejects(
    loadImageTexture(LUT_URL, {
      fetch: fetchFile,
      image: {type: 'data'}
    } as any),
    /ImageBitmapLoader only accepts options\.image\.type='imagebitmap'/,
    'deprecated image output modes are rejected by the helper path'
  );
  t.end();
});
