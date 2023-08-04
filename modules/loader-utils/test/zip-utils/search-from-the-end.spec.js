import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip.js';
import {searchFromTheEnd} from '../../src/parse-zip/search-from-the-end';
import {DataViewFileProvider} from '../../src/parse-zip/data-view-file-provider';

test('SLPKLoader#searchFromTheEnd', async (t) => {
  t.equals(
    await searchFromTheEnd(
      new DataViewFileProvider(new DataView(DATA_ARRAY.buffer)),
      [0x50, 0x4b, 0x03, 0x04]
    ),
    0n
  );
  t.end();
});
