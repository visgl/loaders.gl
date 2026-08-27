import {describe, expect, test} from 'vitest';

import {crc32} from '../src/parquetjs/utils/crc32';
import {decodePage} from '../src/parquetjs/parser/decoders';
import {
  DictionaryPageHeader,
  Encoding,
  PageHeader,
  PageType
} from '../src/parquetjs/parquet-thrift';
import {serializeThrift} from '../src/parquetjs/utils/read-utils';
import type {ParquetReaderContext} from '../src/parquetjs/schema/declare';

const CONTEXT: ParquetReaderContext = {
  type: 'INT32',
  rLevelMax: 0,
  dLevelMax: 0,
  compression: 'UNCOMPRESSED',
  column: {
    name: 'value',
    path: ['value'],
    key: 'value',
    primitiveType: 'INT32',
    repetitionType: 'REQUIRED',
    rLevelMax: 0,
    dLevelMax: 0
  },
  verifyPageChecksums: true
};

function createDictionaryPage(body: Uint8Array): Uint8Array {
  const header = new PageHeader({
    type: PageType.DICTIONARY_PAGE,
    uncompressed_page_size: body.length,
    compressed_page_size: body.length,
    crc: crc32(body),
    dictionary_page_header: new DictionaryPageHeader({
      num_values: 1,
      encoding: Encoding.PLAIN
    })
  });
  const headerBytes = serializeThrift(header);
  const page = new Uint8Array(headerBytes.length + body.length);
  page.set(headerBytes);
  page.set(body, headerBytes.length);
  return page;
}

describe('Parquet page checksums', () => {
  test('computes the standard CRC-32 checksum', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  test('verifies a dictionary page body and rejects corruption', async () => {
    const page = createDictionaryPage(new Uint8Array([1, 0, 0, 0]));
    const cursor = {buffer: page, offset: 0, size: page.length};
    await expect(decodePage(cursor, CONTEXT)).resolves.toMatchObject({dictionary: [1]});

    const corruptedPage = page.slice();
    corruptedPage[corruptedPage.length - 1] ^= 1;
    await expect(
      decodePage({buffer: corruptedPage, offset: 0, size: corruptedPage.length}, CONTEXT)
    ).rejects.toThrow('Parquet page checksum mismatch');
  });
});
