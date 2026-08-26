import {describe, expect, test} from 'vitest';

import {
  canUseParquetPageIndexForColumn,
  decodeOffsetIndex,
  decodeParquetPageStatisticsValue
} from '../src/lib/parquet-page-index';
import {ParquetSchema} from '../src/parquetjs/schema/schema';
import {OffsetIndex, PageLocation} from '../src/parquetjs/parquet-thrift';
import {serializeThrift} from '../src/parquetjs/utils/read-utils';

describe('Parquet page-index public helpers', () => {
  test('decodes physical page statistics using logical field types', () => {
    const schema = new ParquetSchema({value: {type: 'INT32'}});
    expect(
      decodeParquetPageStatisticsValue(new Uint8Array([42, 0, 0, 0]), schema.findField(['value']))
    ).toBe(42);
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
});
