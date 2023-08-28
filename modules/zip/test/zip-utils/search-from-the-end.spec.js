import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {searchFromTheEnd} from '../../src/parse-zip/search-from-the-end';
import {DataViewFile} from '../../src/file-provider/data-view-file';

test('SLPKLoader#searchFromTheEnd', async (t) => {
  t.equals(
    await searchFromTheEnd(
      new DataViewFile(new DataView(DATA_ARRAY.buffer)),
      [0x50, 0x4b, 0x03, 0x04]
    ),
    0n
  );
  t.end();
});
