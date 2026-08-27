// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { expect, test } from "vitest";
import * as parquetThrift from '@loaders.gl/parquet/parquetjs/parquet-thrift';
import { getThriftEnum, serializeThrift } from '@loaders.gl/parquet/parquetjs/utils/read-utils';
test('thrift#getThriftEnum resolves generated numeric enums', () => {
    expect(getThriftEnum(parquetThrift.Type, parquetThrift.Type.BYTE_ARRAY)).toBe('BYTE_ARRAY');
    expect(() => getThriftEnum(parquetThrift.Type, 100)).toThrow(/Invalid ENUM value/);
});
// TODO v4 disabled because of Node.js Buffer dependency
test.skip('thrift#should correctly en/decode literal zeroes with the CompactProtocol', () => {
    const obj = new parquetThrift.ColumnMetaData({
        type: parquetThrift.Type.BOOLEAN,
        path_in_schema: ['test'],
        codec: parquetThrift.CompressionCodec.UNCOMPRESSED,
        encodings: [parquetThrift.Encoding.PLAIN],
        num_values: 0,
        total_uncompressed_size: 100,
        total_compressed_size: 100,
        data_page_offset: 0
    });
    // tslint:disable-next-line:variable-name
    const obj_bin = serializeThrift(obj);
    expect(obj_bin.length).toBe(25);
});
