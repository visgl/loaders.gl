// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';

import {DataViewFile} from '@loaders.gl/loader-utils';
import {searchFromTheEnd} from '../../src/parse-zip/search-from-the-end';

test('SLPKLoader#searchFromTheEnd', async (t) => {
  t.equals(
    await searchFromTheEnd(
      new DataViewFile(new DataView(DATA_ARRAY.buffer)),
      new Uint8Array([0x50, 0x4b, 0x03, 0x04])
    ),
    0n
  );
  t.end();
});
