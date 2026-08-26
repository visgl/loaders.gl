// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';

import {VideoFormat} from '../src/video-format';
import {VideoLoader} from '../src/video-loader';
import {VideoLoaderWithParser} from '../src/video-loader-with-parser';

test('video loader exposes stable metadata', () => {
  expect(VideoLoader).toMatchObject({
    id: 'video',
    name: 'Video',
    extensions: ['mp4'],
    mimeTypes: ['video/mp4'],
    binary: true
  });
  expect(VideoLoader).not.toHaveProperty('parse');
  expect(VideoFormat).toEqual(expect.objectContaining({id: 'video', format: 'video'}));
});

test('video loader preloads its parser-bearing implementation', async () => {
  const parserLoader = await VideoLoader.preload();
  expect(parserLoader).toBe(VideoLoaderWithParser);
  expect(parserLoader.parse).toBeTypeOf('function');
  expect(parserLoader.parseBlob).toBeTypeOf('function');
});

test('video parser creates a video element from binary data', async () => {
  const video = {src: ''};
  vi.spyOn(document, 'createElement').mockReturnValue(video);
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:video-fixture');

  const parsedVideo = await VideoLoaderWithParser.parse(new ArrayBuffer(0));
  expect(parsedVideo).toBe(video);
  expect(parsedVideo.src).toBe('blob:video-fixture');
});
