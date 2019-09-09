import test from 'tape-promise/tape';
import {fetchFile, _fetchProgress} from '@loaders.gl/core';

const PROGRESS_IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.jpeg';

test('progress#fetchProgress', async t => {
  debugger;
  t.ok(_fetchProgress, '_fetchProgress defined');
  const response = await _fetchProgress(
    fetchFile(PROGRESS_IMAGE_URL),
    (percent, {loadedBytes, totalBytes}) => {
      t.ok(Number.isFinite(percent));
      t.ok(Number.isFinite(loadedBytes));
      t.ok(Number.isFinite(totalBytes));
      t.end();
    }
  );
  await response.arrayBuffer();
});
