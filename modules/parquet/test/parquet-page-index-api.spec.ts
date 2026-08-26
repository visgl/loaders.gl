import {describe, expect, test} from 'vitest';

import {
  canUseParquetPageIndexForColumn,
  decodeParquetPageStatisticsValue
} from '../src/lib/parquet-page-index';
import {ParquetSchema} from '../src/parquetjs/schema/schema';

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
});
