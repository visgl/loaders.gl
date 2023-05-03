import test from 'tape-promise/tape';
import {DATA_ARRAY} from './data/test.zip.js';
import CDFileHeader from '../src/lib/parsers/parse-slpk/cd-file-header';

test('SlpkLoader#central directory file header parce', async (t) => {
  const cdFileHeader = new CDFileHeader(78, new DataView(DATA_ARRAY.buffer));
  t.deepEqual(cdFileHeader.compressedSize, 39);
  t.deepEqual(cdFileHeader.fileNameLength, 9);
  const textDecoder = new TextDecoder();
  t.deepEqual(textDecoder.decode(cdFileHeader.fileName), 'test.json');
  t.deepEqual(cdFileHeader.localHeaderOffset, 0);
  t.end();
});
