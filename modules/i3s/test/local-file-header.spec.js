import test from 'tape-promise/tape';
import {DATA_ARRAY} from './data/test.zip.js';
import {ZipLocalFileHeader} from '../src/lib/parsers/parce-zip/local-file-header.js';

test('SLPKLoader#local file header parce', async (t) => {
  const localFileHeader = new ZipLocalFileHeader(0, new DataView(DATA_ARRAY.buffer));
  t.deepEqual(localFileHeader.compressedSize, 39);
  t.deepEqual(localFileHeader.fileNameLength, 9);
  t.end();
});
