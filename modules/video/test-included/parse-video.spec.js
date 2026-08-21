// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test, {testIfBrowser} from 'test/utils/vitest-tape';

import parseVideo, {parseVideoBlob} from '../src/lib/parsers/parse-video';
import {VideoLoaderWithParser} from '../src/video-loader-with-parser';

test('VideoLoaderWithParser#parseBlob is defined', t => {
  t.equal(VideoLoaderWithParser.parseBlob, parseVideoBlob, 'parseBlob uses the Blob parser');
  t.end();
});

testIfBrowser('parseVideoBlob creates a video element from a Blob URL', async t => {
  const video = await parseVideoBlob(new Blob(['video data'], {type: 'video/mp4'}));

  t.equal(video.tagName, 'VIDEO', 'Blob parser returns a video element');
  t.ok(video.src.startsWith('blob:'), 'Blob parser uses an object URL');
  t.end();
});

testIfBrowser('parseVideo creates a video element from an ArrayBuffer', async t => {
  const video = await parseVideo(new Uint8Array([1, 2, 3]).buffer);

  t.equal(video.tagName, 'VIDEO', 'ArrayBuffer parser returns a video element');
  t.ok(video.src.startsWith('blob:'), 'ArrayBuffer parser uses the Blob helper');
  t.end();
});
