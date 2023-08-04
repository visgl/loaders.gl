import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip.js';
import {parseEoCDRecord} from '../../src/parse-zip/end-of-central-directory';
import {DataViewFileProvider} from '../../src/parse-zip/data-view-file-provider';
import {parseZipCDFileHeader} from '../../src/parse-zip/cd-file-header';

test('SLPKLoader#eon of central directory record parse', async (t) => {
  const provider = new DataViewFileProvider(new DataView(DATA_ARRAY.buffer));
  const localFileHeader = await parseEoCDRecord(provider);
  t.ok(parseZipCDFileHeader(localFileHeader?.cdStartOffset, provider));
  t.end();
});
