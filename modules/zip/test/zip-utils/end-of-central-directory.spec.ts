// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {DATA_ARRAY} from '@loaders.gl/i3s/test/data/test.zip';
import {parseEoCDRecord} from '../../src/parse-zip/end-of-central-directory';
import {DataViewFile} from '@loaders.gl/loader-utils';
import {parseZipCDFileHeader} from '../../src/parse-zip/cd-file-header';

test('SLPKLoader#eon of central directory record parse', async (t) => {
  const provider = new DataViewFile(new DataView(DATA_ARRAY.buffer));
  const localFileHeader = await parseEoCDRecord(provider);
  t.ok(parseZipCDFileHeader(localFileHeader?.cdStartOffset, provider));
  t.end();
});
