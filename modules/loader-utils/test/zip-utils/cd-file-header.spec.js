import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {parseZipCDFileHeader} from '../../src//parse-zip/cd-file-header';
import {DataViewFile} from '../../src/parse-zip/data-view-file';

test('SLPKLoader#central directory file header parse', async (t) => {
  const cdFileHeader = await parseZipCDFileHeader(
    78n,
    new DataViewFile(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(cdFileHeader?.compressedSize, 39n);
  t.deepEqual(cdFileHeader?.fileNameLength, 9);
  t.deepEqual(cdFileHeader?.fileName, 'test.json');
  t.deepEqual(cdFileHeader?.localHeaderOffset, 0n);
  t.end();
});
