// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {shortenUrlForDisplay} from '@loaders.gl/core/lib/utils/url-utils';

test('shortenUrlForDisplay', async (t) => {
  const longUrl =
    'http://www.longsitename.com/path1/path2/path3/longpath/longresourcename.extension';
  const shortUrl = shortenUrlForDisplay(longUrl);

  t.equal(shortUrl, 'http://www.longsitename.com/path...ename.extension');
  t.end();
});
