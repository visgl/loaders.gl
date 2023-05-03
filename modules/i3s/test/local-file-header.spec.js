import test from 'tape-promise/tape';
import {DATA_ARRAY} from './data/test.zip.js';
import LocalFileHeader from '../src/lib/parsers/parse-slpk/local-file-header.js';

test('SlpkLoader#local file header parce', async (t) => {
  const localFileHeader = new LocalFileHeader(0, new DataView(DATA_ARRAY.buffer));
  t.deepEqual(localFileHeader.compressedSize, 39);
  t.deepEqual(localFileHeader.fileNameLength, 9);
  t.end();
});
