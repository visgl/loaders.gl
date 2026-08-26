// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';

import GIFBuilder from '../src/gif-builder';

afterEach(() => {
  vi.restoreAllMocks();
});

test('GIFBuilder exposes metadata and accepts image files', async () => {
  expect(GIFBuilder.properties).toMatchObject({id: 'gif', extensions: ['gif']});
  const gifBuilder = new GIFBuilder({source: 'images', width: 400, height: 300});
  const createGIF = vi
    .spyOn(gifBuilder.gifshot, 'createGIF')
    .mockImplementation((options, callback) => {
      expect(options).toMatchObject({images: ['first-image'], gifWidth: 400, gifHeight: 300});
      callback({error: false, image: 'data:image/gif;base64,AAAA'});
    });

  await gifBuilder.add('first-image');
  await expect(gifBuilder.build()).resolves.toBe('data:image/gif;base64,AAAA');
  expect(createGIF).toHaveBeenCalledTimes(1);
});

test('GIFBuilder supports video and webcam sources', async () => {
  const videoBuilder = new GIFBuilder({source: 'video', width: 10, height: 20});
  vi.spyOn(videoBuilder.gifshot, 'createGIF').mockImplementation((options, callback) => {
    expect(options).toMatchObject({video: ['video-file'], gifWidth: 10, gifHeight: 20});
    callback({error: false, image: 'video-gif'});
  });
  await videoBuilder.add('video-file');
  await expect(videoBuilder.build()).resolves.toBe('video-gif');

  const webcamBuilder = new GIFBuilder({source: 'webcam'});
  vi.spyOn(webcamBuilder.gifshot, 'createGIF').mockImplementation((_options, callback) => {
    callback({error: false, image: 'webcam-gif'});
  });
  await expect(webcamBuilder.build()).resolves.toBe('webcam-gif');
});

test('GIFBuilder rejects invalid sources, files, and gifshot errors', async () => {
  const invalidBuilder = new GIFBuilder({source: 'invalid'});
  await expect(invalidBuilder.build()).rejects.toThrow('GIFBuilder: invalid source');

  const webcamBuilder = new GIFBuilder({source: 'webcam'});
  await webcamBuilder.add('unexpected-file');
  await expect(webcamBuilder.build()).rejects.toThrow();

  const errorBuilder = new GIFBuilder({source: 'images'});
  vi.spyOn(errorBuilder.gifshot, 'createGIF').mockImplementation((_options, callback) => {
    callback({error: true, errorMsg: 'gifshot failed'});
  });
  await expect(errorBuilder.build()).rejects.toBe('gifshot failed');
});
