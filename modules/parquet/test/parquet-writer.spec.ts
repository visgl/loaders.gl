// loaders.gl, MIT license

import test from 'tape-promise/tape';
import {writeTestFile, readTestFile} from './test-utils/make-test-table';

import {_ParquetWriter as ParquetWriter} from '@loaders.gl/parquet';

const TEST_READS = true;

test('ParquetWriter#writer objects', (t) => {
  t.ok(ParquetWriter, 'ParquetWriter');
  t.end();
});

test.only('Parquet#DataPageHeaderV1#write a test file', async (t) => {
  const opts = {useDataPageV2: false, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});

test.skip('Parquet#DataPageHeaderV1#write a test file and then read it back', async (t) => {
  const opts = {useDataPageV2: false, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file', async (t) => {
  const opts = {useDataPageV2: true, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with GZIP compression', async (t) => {
  const opts = {useDataPageV2: true, compression: 'GZIP'};
  await writeTestFile(opts);
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with GZIP compression and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'GZIP'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with SNAPPY compression', async (t) => {
  const opts = {useDataPageV2: true, compression: 'SNAPPY'};
  await writeTestFile(opts);
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with SNAPPY compression and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'SNAPPY'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with LZO compression', async (t) => {
  const opts = {useDataPageV2: true, compression: 'LZO'};
  await writeTestFile(opts);
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with LZO compression and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'LZO'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with BROTLI compression', async (t) => {
  const opts = {useDataPageV2: true, compression: 'BROTLI'};
  await writeTestFile(opts);
  t.end();
});

test.skip('Parquet#DataPageHeaderV2#write a test file with BROTLI compression and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'BROTLI'};
  await writeTestFile(opts);
  if (TEST_READS) {
    await readTestFile(t);
  }
  t.end();
});
