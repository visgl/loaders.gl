import {expect, test} from 'vitest';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {parseEoCDRecord} from '../../src/parse-zip/end-of-central-directory';
import {DataViewReadableFile} from '../../src/parse-zip/readable-file-utils';
import {parseZipCDFileHeader} from '../../src/parse-zip/cd-file-header';
test('SLPKLoader#eon of central directory record parse', async () => {
  const provider = new DataViewReadableFile(new DataView(DATA_ARRAY.buffer));
  const localFileHeader = await parseEoCDRecord(provider);
  expect(parseZipCDFileHeader(localFileHeader?.cdStartOffset, provider)).toBeTruthy();
});
