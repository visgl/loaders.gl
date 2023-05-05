import test from 'tape-promise/tape';
import {DATA_ARRAY} from './data/test.zip.js';
import {parseZipCDFileHeader} from '../src/lib/parsers/parse-zip/cd-file-header.js';

test('SLPKLoader#central directory file header parse', async (t) => {
  const cdFileHeader = parseZipCDFileHeader(78, new DataView(DATA_ARRAY.buffer));
  t.deepEqual(cdFileHeader.compressedSize, 39);
  t.deepEqual(cdFileHeader.fileNameLength, 9);
  const textDecoder = new TextDecoder();
  t.deepEqual(textDecoder.decode(cdFileHeader.fileName), 'test.json');
  t.deepEqual(cdFileHeader.localHeaderOffset, 0);
  t.end();
});
