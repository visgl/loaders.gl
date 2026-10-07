import {expect, test} from 'vitest';
import {ParquetJSLoaderWithParser} from '../src/parquet-js-loader';
import {PageHeader, DataPageHeader, FileMetaData, SchemaElement, ColumnMetaData, ColumnChunk, RowGroup, PageType, Encoding, Type, FieldRepetitionType, CompressionCodec} from '../src/parquetjs/parquet-thrift';
import {serializeThrift} from '../src/parquetjs/utils/read-utils';

/** Builds a tiny required INT32 column with a literal-only raw LZO1X data page. */
function createLzoParquetFile(framing: 'raw' | 'chunks' | 'blocks'): ArrayBuffer {
  const values = new Uint8Array(12);
  const view = new DataView(values.buffer);
  [10, 20, 30].forEach((value, index) => view.setInt32(index * 4, value, true));
  /** Encodes a small literal-only block for testing container framing. */
  const rawBlock = (bytes: Uint8Array) => new Uint8Array([17 + bytes.length, ...bytes, 17, 0, 0]);
  let compressed = rawBlock(values);
  if (framing !== 'raw') {
    const chunks = [rawBlock(values.slice(0, 6)), rawBlock(values.slice(6))];
    const bytes: number[] = [];
    /** Writes one Hadoop big-endian block or chunk length. */
    const writeSize = (size: number) => bytes.push((size >>> 24) & 255, (size >>> 16) & 255, (size >>> 8) & 255, size & 255);
    if (framing === 'chunks') writeSize(values.length);
    for (const chunk of chunks) {
      if (framing === 'blocks') writeSize(6);
      writeSize(chunk.length);
      bytes.push(...chunk);
    }
    compressed = new Uint8Array(bytes);
  }
  const header = serializeThrift(new PageHeader({type: PageType.DATA_PAGE, uncompressed_page_size: values.length, compressed_page_size: compressed.length, data_page_header: new DataPageHeader({num_values: 3, encoding: Encoding.PLAIN, definition_level_encoding: Encoding.RLE, repetition_level_encoding: Encoding.RLE})}));
  const pageLength = header.length + compressed.length;
  const metadata = serializeThrift(new FileMetaData({version: 1, schema: [new SchemaElement({name: 'schema', num_children: 1}), new SchemaElement({name: 'value', type: Type.INT32, repetition_type: FieldRepetitionType.REQUIRED})], num_rows: 3, row_groups: [new RowGroup({num_rows: 3, total_byte_size: header.length + values.length, columns: [new ColumnChunk({file_offset: 4, meta_data: new ColumnMetaData({type: Type.INT32, encodings: [Encoding.PLAIN, Encoding.RLE], path_in_schema: ['value'], codec: CompressionCodec.LZO, num_values: 3, total_uncompressed_size: header.length + values.length, total_compressed_size: pageLength, data_page_offset: 4})})]})]}));
  const output = new Uint8Array(4 + pageLength + metadata.length + 8);
  output.set([80, 65, 82, 49]);
  output.set(header, 4);
  output.set(compressed, 4 + header.length);
  output.set(metadata, 4 + pageLength);
  new DataView(output.buffer).setUint32(output.length - 8, metadata.length, true);
  output.set([80, 65, 82, 49], output.length - 4);
  return output.buffer;
}

test.each(['raw', 'chunks', 'blocks'] as const)('ParquetJSLoader reads LZO %s framing', async framing => {
  const output = await ParquetJSLoaderWithParser.parse(createLzoParquetFile(framing), {parquet: {shape: 'object-row-table'}});
  expect(output).toMatchObject({shape: 'object-row-table', data: [{value: 10}, {value: 20}, {value: 30}]});
});
