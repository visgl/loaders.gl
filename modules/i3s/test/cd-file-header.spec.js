import test from 'tape-promise/tape';
import {DATA_ARRAY} from './data/test.zip.js';
import {parseZipCDFileHeader} from '../src/lib/parsers/parse-zip/cd-file-header.js';
import {DataViewFileProvider} from '../src/lib/parsers/parse-zip/data-view-file-provider.js';

test('SLPKLoader#central directory file header parse', async (t) => {
  const cdFileHeader = await parseZipCDFileHeader(
    78n,
    new DataViewFileProvider(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(cdFileHeader.compressedSize, 39);
  t.deepEqual(cdFileHeader.fileNameLength, 9);
  t.deepEqual(cdFileHeader.fileName, 'test.json');
  t.deepEqual(cdFileHeader.localHeaderOffset, 0);
  t.end();
});
