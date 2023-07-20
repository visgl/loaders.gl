import test from 'tape-promise/tape';
import {DATA_ARRAY} from '../data/test.zip.js';
import {parseZipLocalFileHeader} from '../../src/lib/parsers/parse-zip/local-file-header';
import {DataViewFileProvider} from '../../src/lib/parsers/parse-zip/data-view-file-provider';

test('SLPKLoader#local file header parse', async (t) => {
  const localFileHeader = await parseZipLocalFileHeader(
    0n,
    new DataViewFileProvider(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(localFileHeader?.compressedSize, 39n);
  t.deepEqual(localFileHeader?.fileNameLength, 9);
  t.end();
});
