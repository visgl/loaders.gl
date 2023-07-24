import test from 'tape-promise/tape';
import {DATA_ARRAY} from './data/test.zip.js';
import {parseEoCDRecord} from '../src/lib/parsers/parse-zip/end-of-central-directory';
import {DataViewFileProvider} from '../src/lib/parsers/parse-zip/data-view-file-provider';
import {parseZipCDFileHeader} from '../src/lib/parsers/parse-zip/cd-file-header';

test('SLPKLoader#eon of central directory record parse', async (t) => {
  const provider = new DataViewFileProvider(new DataView(DATA_ARRAY.buffer));
  const localFileHeader = await parseEoCDRecord(provider);
  t.ok(parseZipCDFileHeader(localFileHeader?.cdStartOffset, provider));
  t.end();
});
