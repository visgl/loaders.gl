// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, encode} from '@loaders.gl/core';
import {ImageLoader, getImageData} from '@loaders.gl/images';
import {BasisLoader} from '@loaders.gl/images';
import {KTX2BasisWriter} from '@loaders.gl/images/ktx2-basis-writer';
import {KTX2BasisWriterWorker} from '@loaders.gl/images/ktx2-basis-writer-worker-loader';
import {processOnWorker} from '@loaders.gl/core/worker-utils';
const shannonPNG = '@loaders.gl/images/test/textures/data/shannon.png';
const shannonJPG = '@loaders.gl/images/test/textures/data/shannon.jpg';
test('KTX2BasisUniversalTextureWriter#Should encode PNG', async () => {
  const image = getImageData(await load(shannonPNG, ImageLoader));
  const encodedData = await encode(image, KTX2BasisWriter);
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];
  expect(encodedData).toBeTruthy();
  expect(transcodedImage).toBeTruthy();
  expect(image.height).toBe(transcodedImage.height);
  expect(image.width).toBe(transcodedImage.width);
});
test('KTX2BasisUniversalTextureWriter # Worker # Should encode PNG', async () => {
  const image = getImageData(await load(shannonPNG, ImageLoader));
  const encodedData = await processOnWorker(KTX2BasisWriterWorker, image, {
    _workerType: 'test'
  });
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];
  expect(encodedData).toBeTruthy();
  expect(transcodedImage).toBeTruthy();
  expect(image.height).toBe(transcodedImage.height);
  expect(image.width).toBe(transcodedImage.width);
});
test('KTX2BasisUniversalTextureWriter#Should encode JPG', async () => {
  const image = getImageData(await load(shannonJPG, ImageLoader));
  const encodedData = await encode(image, KTX2BasisWriter);
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];
  expect(encodedData).toBeTruthy();
  expect(transcodedImage).toBeTruthy();
  expect(image.height).toBe(transcodedImage.height);
  expect(image.width).toBe(transcodedImage.width);
});
