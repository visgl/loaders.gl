import {expect, test} from 'vitest';
import {testIfBrowser} from '@loaders.gl/test-utils/vitest';
import parseVideo, {parseVideoBlob} from '../src/lib/parsers/parse-video';
import {VideoLoaderWithParser} from '../src/video-loader-with-parser';
test('VideoLoaderWithParser#parseBlob is defined', () => {
  expect(VideoLoaderWithParser.parseBlob, 'parseBlob uses the Blob parser').toBe(parseVideoBlob);
});
testIfBrowser('parseVideoBlob creates a video element from a Blob URL', async () => {
  const video = await parseVideoBlob(new Blob(['video data'], {type: 'video/mp4'}));
  expect(video.tagName, 'Blob parser returns a video element').toBe('VIDEO');
  expect(video.src.startsWith('blob:'), 'Blob parser uses an object URL').toBeTruthy();
});
testIfBrowser('parseVideo creates a video element from an ArrayBuffer', async () => {
  const video = await parseVideo(new Uint8Array([1, 2, 3]).buffer);
  expect(video.tagName, 'ArrayBuffer parser returns a video element').toBe('VIDEO');
  expect(video.src.startsWith('blob:'), 'ArrayBuffer parser uses the Blob helper').toBeTruthy();
});
