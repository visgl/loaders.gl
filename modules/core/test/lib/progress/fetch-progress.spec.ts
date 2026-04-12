import {expect, test} from 'vitest';
import {fetchFile, _fetchProgress} from '@loaders.gl/core';
const PROGRESS_IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.jpeg';
test('progress#fetchProgress', async () => {
  expect(_fetchProgress, '_fetchProgress defined').toBeTruthy();
  const response = await _fetchProgress(
    // @ts-ignore Did you forget to use 'await'?
    fetchFile(PROGRESS_IMAGE_URL),
    (percent, {loadedBytes, totalBytes}) => {
      expect(Number.isFinite(percent)).toBeTruthy();
      expect(Number.isFinite(loadedBytes)).toBeTruthy();
      expect(Number.isFinite(totalBytes)).toBeTruthy();
    }
  );
  await response.arrayBuffer();
});
