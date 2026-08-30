import {describe, expect, test} from 'vitest';

import {
  canUseParquetPageIndexForColumn,
  decodeOffsetIndex,
  decodeParquetPageStatisticsValue,
  getParquetIndexRange
} from '../src/lib/parquet-page-index';
import {ParquetSchema} from '../src/parquetjs/schema/schema';
import {Encoding, OffsetIndex, PageLocation, SizeStatistics} from '../src/parquetjs/parquet-thrift';
import {serializeThrift} from '../src/parquetjs/utils/read-utils';
import {Uint8ArrayCompactProtocol} from '../src/parquetjs/utils/uint8-array-compact-protocol';
import {Uint8ArrayTransport} from '../src/parquetjs/utils/uint8-array-transport';
import {PARQUET_CODECS} from '../src/parquetjs/codecs';
import {createParquetModuleAad, decryptParquetModule} from '../src/lib/parquet-encryption';

describe('Parquet page-index public helpers', () => {
  test('decodes legacy BIT_PACKED level values', () => {
    const encoded = PARQUET_CODECS.BIT_PACKED.encodeValues('INT32', [0, 1, 2, 3, 4], {
      bitWidth: 3
    });
    const decoded = PARQUET_CODECS.BIT_PACKED.decodeValues(
      'INT32',
      {buffer: encoded, offset: 0, size: encoded.length},
      5,
      {bitWidth: 3}
    );
    expect(decoded).toEqual([0, 1, 2, 3, 4]);
  });
  test('decodes physical page statistics using logical field types', () => {
    const schema = new ParquetSchema({value: {type: 'INT32'}});
    expect(
      decodeParquetPageStatisticsValue(new Uint8Array([42, 0, 0, 0]), schema.findField(['value']))
    ).toBe(42);
  });

  test('decodes every physical page-statistics representation', () => {
    const cases = [
      [{type: 'BOOLEAN'}, Uint8Array.of(1), true],
      [{type: 'UINT_32'}, Uint8Array.of(255, 255, 255, 255), 4294967295],
      [{type: 'INT_64'}, Uint8Array.of(254, 255, 255, 255, 255, 255, 255, 255), -2n],
      [{type: 'UINT_64'}, Uint8Array.of(2, 0, 0, 0, 0, 0, 0, 0), 2n],
      [{type: 'FLOAT'}, floatBytes(1.25, 4), 1.25],
      [{type: 'DOUBLE'}, floatBytes(-2.5, 8), -2.5],
      [{type: 'UTF8'}, new TextEncoder().encode('text'), 'text']
    ] as const;
    for (const [definition, bytes, expected] of cases) {
      const field = new ParquetSchema({value: definition as any}).findField('value');
      expect(decodeParquetPageStatisticsValue(bytes, field)).toEqual(expected);
    }

    const int96 = new Uint8Array(12);
    const int96View = new DataView(int96.buffer);
    int96View.setBigUint64(0, 1_000_000n, true);
    int96View.setInt32(8, 2440588, true);
    const int96Field = new ParquetSchema({value: {type: 'INT96'}}).findField('value');
    expect(decodeParquetPageStatisticsValue(int96, int96Field, {int96AsTimestamp: true})).toBe(
      1_000_000n
    );
    int96View.setBigUint64(0, 86_400_000_000_000n, true);
    expect(decodeParquetPageStatisticsValue(int96, int96Field, {int96AsTimestamp: true})).toEqual(
      int96
    );
    expect(
      decodeParquetPageStatisticsValue(Uint8Array.of(1), {primitiveType: 'INVALID'} as any)
    ).toBeUndefined();
  });

  test('validates page-index ranges and dictionary selection prerequisites', () => {
    expect(getParquetIndexRange(10 as any, 20, 100)).toEqual({offset: 10, length: 20});
    for (const [offset, length, fileSize] of [
      [undefined, 1, 10],
      [1, undefined, 10],
      [-1, 1, 10],
      [1, 0, 10],
      [1, 1.5, 10],
      [9, 2, 10],
      [1, 1, -1]
    ]) {
      expect(getParquetIndexRange(offset as any, length, fileSize as number)).toBeUndefined();
    }

    const schema = new ParquetSchema({value: {type: 'INT32'}});
    expect(canUseParquetPageIndexForColumn(schema, {} as any)).toBe(false);
    expect(
      canUseParquetPageIndexForColumn(schema, {
        meta_data: {path_in_schema: ['value'], encodings: [], dictionary_page_offset: undefined}
      } as any)
    ).toBe(true);
    expect(
      canUseParquetPageIndexForColumn(schema, {
        meta_data: {
          path_in_schema: ['value'],
          encodings: [Encoding.PLAIN_DICTIONARY],
          dictionary_page_offset: undefined
        }
      } as any)
    ).toBe(false);
  });

  test('keeps repeated leaves on the complete-column path', () => {
    const schema = new ParquetSchema({
      values: {repeated: true, type: 'INT32'}
    });
    const columnChunk = {
      meta_data: {
        path_in_schema: ['values'],
        encodings: [],
        dictionary_page_offset: undefined
      }
    } as any;
    expect(canUseParquetPageIndexForColumn(schema, columnChunk)).toBe(false);
  });

  test('extends repeated offset-index continuation pages to the next row', () => {
    const bytes = serializeThrift(
      new OffsetIndex({
        page_locations: [
          new PageLocation({offset: 10, compressed_page_size: 5, first_row_index: 0}),
          new PageLocation({offset: 20, compressed_page_size: 5, first_row_index: 1}),
          new PageLocation({offset: 30, compressed_page_size: 5, first_row_index: 1}),
          new PageLocation({offset: 40, compressed_page_size: 5, first_row_index: 3})
        ]
      })
    );
    expect(decodeOffsetIndex(bytes, 4).map(page => [page.firstRowIndex, page.endRowIndex])).toEqual([
      [0, 1],
      [1, 3],
      [1, 3],
      [3, 4]
    ]);
  });

  test('round-trips size statistics without coercing absent histograms', () => {
    const statistics = new SizeStatistics({
      unencoded_byte_array_data_bytes: 1234,
      repetition_level_histogram: [3, 4],
      definition_level_histogram: [5, 2, 1]
    });
    const bytes = serializeThrift(statistics);
    const decoded = SizeStatistics.read(
      new Uint8ArrayCompactProtocol(new Uint8ArrayTransport(bytes)) as any
    );
    expect(Number(decoded.unencoded_byte_array_data_bytes)).toBe(1234);
    expect(decoded.repetition_level_histogram?.map(Number)).toEqual([3, 4]);
    expect(decoded.definition_level_histogram?.map(Number)).toEqual([5, 2, 1]);
    expect(new SizeStatistics().repetition_level_histogram).toBeUndefined();
  });

  test('decrypts a length-prefixed AES-GCM module with authenticated data', async () => {
    const keyBytes = new Uint8Array(16).fill(7);
    const key = await crypto.subtle.importKey('raw', keyBytes, {name: 'AES-GCM'}, false, ['encrypt']);
    const nonce = new Uint8Array(12).fill(3);
    const aad = createParquetModuleAad(new Uint8Array([1]), new Uint8Array([2]), 'footer');
    const plaintext = new TextEncoder().encode('footer');
    const ciphertext = new Uint8Array(
      await crypto.subtle.encrypt({name: 'AES-GCM', iv: nonce, additionalData: aad}, key, plaintext)
    );
    const encryptedBuffer = new Uint8Array(4 + nonce.length + ciphertext.length);
    new DataView(encryptedBuffer.buffer).setUint32(0, encryptedBuffer.length - 4, true);
    encryptedBuffer.set(nonce, 4);
    encryptedBuffer.set(ciphertext, 4 + nonce.length);
    const decoded = await decryptParquetModule(encryptedBuffer, {
      algorithm: 'AES_GCM_V1',
      aad,
      keyRetriever: () => keyBytes
    });
    expect(new TextDecoder().decode(decoded)).toBe('footer');
  });

  test('includes page ordinals only for data page modules', () => {
    const fileUnique = new Uint8Array(8).fill(2);
    for (const module of ['data-page', 'data-page-header'] as const) {
      const aad = createParquetModuleAad(undefined, fileUnique, module, 3, 5, 7);
      expect(aad.byteLength).toBe(15);
      const suffix = new DataView(aad.buffer, aad.byteOffset, aad.byteLength);
      expect(suffix.getInt16(8 + 1, true)).toBe(3);
      expect(suffix.getInt16(8 + 3, true)).toBe(5);
      expect(suffix.getInt16(8 + 5, true)).toBe(7);
    }
    for (const module of ['dictionary-page', 'dictionary-page-header'] as const) {
      const aad = createParquetModuleAad(undefined, fileUnique, module, 3, 5, 7);
      expect(aad.byteLength).toBe(13);
    }
  });
});

function floatBytes(value: number, byteLength: 4 | 8): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  const dataView = new DataView(bytes.buffer);
  if (byteLength === 4) dataView.setFloat32(0, value, true);
  else dataView.setFloat64(0, value, true);
  return bytes;
}
