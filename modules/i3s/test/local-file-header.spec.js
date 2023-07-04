import test from 'tape-promise/tape';
import {DATA_ARRAY} from './data/test.zip.js';
import {parseZipLocalFileHeader} from '../src/lib/parsers/parse-zip/local-file-header.js';
import {DataViewFileProvider} from '../src/lib/parsers/parse-zip/buffer-file-provider.js';

test('SLPKLoader#local file header parse', async (t) => {
  const localFileHeader = await parseZipLocalFileHeader(
    0,
    new DataViewFileProvider(new DataView(DATA_ARRAY.buffer))
  );
  t.deepEqual(localFileHeader?.compressedSize, 39);
  t.deepEqual(localFileHeader?.fileNameLength, 9);
  t.end();
});
