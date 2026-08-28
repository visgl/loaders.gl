// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, encode} from '@loaders.gl/core';
import {ImageBitmapLoader, getImageData} from '@loaders.gl/images';
import {BasisLoader, KTX2BasisWriter, KTX2BasisWriterWorker} from '@loaders.gl/textures';
import {isBrowser, processOnWorker, WorkerFarm} from '@loaders.gl/worker-utils';
const shannonPNG = '@loaders.gl/textures/test/data/shannon.png';
const shannonJPG = '@loaders.gl/textures/test/data/shannon.jpg';
test('KTX2BasisUniversalTextureWriter#Should encode PNG', async () => {
  const image = getImageData(await load(shannonPNG, ImageBitmapLoader));
  const encodedData = await encode(image, KTX2BasisWriter);
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];
  expect(encodedData).toBeTruthy();
  expect(transcodedImage).toBeTruthy();
  expect(image.height).toBe(transcodedImage.height);
  expect(image.width).toBe(transcodedImage.width);
});
test('KTX2BasisUniversalTextureWriter # Worker # Should encode PNG', async () => {
  const image = getImageData(await load(shannonPNG, ImageBitmapLoader));
  const encodedData = await processOnWorker(KTX2BasisWriterWorker, image, {
    _workerType: 'test'
  });
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];
  expect(encodedData).toBeTruthy();
  expect(transcodedImage).toBeTruthy();
  expect(image.height).toBe(transcodedImage.height);
  expect(image.width).toBe(transcodedImage.width);
  if (!isBrowser) {
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
  }
});
test('KTX2BasisUniversalTextureWriter#Should encode JPG', async () => {
  const image = getImageData(await load(shannonJPG, ImageBitmapLoader));
  const encodedData = await encode(image, KTX2BasisWriter);
  const transcodedImages = await load(encodedData, BasisLoader);
  const transcodedImage = transcodedImages[0][0];
  expect(encodedData).toBeTruthy();
  expect(transcodedImage).toBeTruthy();
  expect(image.height).toBe(transcodedImage.height);
  expect(image.width).toBe(transcodedImage.width);
});
