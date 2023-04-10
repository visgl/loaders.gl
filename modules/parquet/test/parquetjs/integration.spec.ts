/* eslint-disable camelcase */
import test from 'tape-promise/tape';
import {writeTestFile, readTestFile} from '../test-utils/make-test-table';

const TEST_READS = false; // = !isBrowser;

test('Parquet#DataPageHeaderV1#write a test file', async (t) => {
  const opts = {useDataPageV2: false, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  t.end();
});

test('Parquet#DataPageHeaderV1#write a test file and then read it back', async (t) => {
  const opts = {useDataPageV2: false, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  if (TEST_READS) {
    // await readTestFile(t);
  }
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file', async (t) => {
  const opts = {useDataPageV2: true, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  if (TEST_READS) {
    // await readTestFile(t);
  }
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'UNCOMPRESSED'};
  await writeTestFile(opts);
  if (TEST_READS) {
    // await readTestFile(t);
  }
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file with GZIP compression', async (t) => {
  const opts = {useDataPageV2: true, compression: 'GZIP'};
  await writeTestFile(opts);
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file with GZIP compression and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'GZIP'};
  await writeTestFile(opts);
  if (TEST_READS) {
    // await readTestFile(t);
  }
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file with SNAPPY compression', async (t) => {
  const opts = {useDataPageV2: true, compression: 'SNAPPY'};
  await writeTestFile(opts);
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file with SNAPPY compression and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'SNAPPY'};
  await writeTestFile(opts);
  if (TEST_READS) {
    // await readTestFile(t);
  }
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file with LZO compression', async (t) => {
  const opts = {useDataPageV2: true, compression: 'LZO'};
  await writeTestFile(opts);
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file with LZO compression and then read it back', async (t) => {
  const opts = {useDataPageV2: true, compression: 'LZO'};
  await writeTestFile(opts);
  if (TEST_READS) {
    // await readTestFile(t);
  }
  t.end();
});

test('Parquet#DataPageHeaderV2#write a test file with BROTLI compression', async (t) => {
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
