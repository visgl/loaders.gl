import {expect, test} from 'vitest';
import {shortenUrlForDisplay} from '@loaders.gl/core/lib/utils/url-utils';
test('shortenUrlForDisplay', async () => {
  const longUrl =
    'http://www.longsitename.com/path1/path2/path3/longpath/longresourcename.extension';
  const shortUrl = shortenUrlForDisplay(longUrl);
  expect(shortUrl).toBe('http://www.longsitename.com/path...ename.extension');
});
