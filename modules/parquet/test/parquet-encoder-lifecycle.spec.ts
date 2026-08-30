// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {expect, test, vi} from 'vitest';
import {ParquetEncoder, ParquetEnvelopeWriter} from '../src/parquetjs/encoder/parquet-encoder';
import {ParquetSchema} from '../src/parquetjs/schema/schema';

const schema = new ParquetSchema({value: {type: 'INT32'}});

/** Creates a minimal envelope writer whose lifecycle calls can be inspected. */
function createEnvelopeWriter() {
  return {
    writeHeader: vi.fn(async () => {}),
    writeRowGroup: vi.fn(async () => {}),
    writeFooter: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    setPageSize: vi.fn()
  };
}

test('ParquetEncoder flushes row groups, metadata, callbacks, and rejects reuse', async () => {
  const envelopeWriter = createEnvelopeWriter();
  const encoder = new ParquetEncoder(schema, envelopeWriter as any, {rowGroupSize: 2});
  await encoder.writeHeader();
  encoder.setMetadata('number', 42 as unknown as string);
  encoder.setRowGroupSize(2);
  encoder.setPageSize(17);

  await encoder.appendRow({value: 1});
  await encoder.appendRow({value: 2});
  expect(envelopeWriter.writeRowGroup).toHaveBeenCalledTimes(1);
  expect(encoder.rowBuffer.rowCount).toBe(0);

  await encoder.appendRow({value: 3});
  const callback = vi.fn();
  await encoder.close(callback);
  expect(envelopeWriter.writeRowGroup).toHaveBeenCalledTimes(2);
  expect(envelopeWriter.writeFooter).toHaveBeenCalledWith({number: '42'});
  expect(envelopeWriter.setPageSize).toHaveBeenCalledWith(17);
  expect(envelopeWriter.close).toHaveBeenCalledOnce();
  expect(callback).toHaveBeenCalledOnce();
  await expect(encoder.appendRow({value: 4})).rejects.toThrow('writer was closed');
  await expect(encoder.close()).rejects.toThrow('writer was closed');
});

test('ParquetEncoder closes its output when writing the header fails', async () => {
  const envelopeWriter = createEnvelopeWriter();
  envelopeWriter.writeHeader.mockRejectedValueOnce(new Error('header failed'));
  const encoder = Object.create(ParquetEncoder.prototype) as ParquetEncoder<unknown>;
  encoder.envelopeWriter = envelopeWriter as any;

  await expect(encoder.writeHeader()).rejects.toThrow('header failed');
  expect(envelopeWriter.close).toHaveBeenCalledOnce();
});

test('ParquetEnvelopeWriter supports empty, plain, and encrypted envelope boundaries', async () => {
  const chunks: Uint8Array[] = [];
  const close = vi.fn(async () => {});
  const writer = new ParquetEnvelopeWriter(
    schema,
    async chunk => {
      chunks.push(chunk);
    },
    close,
    5,
    {}
  );
  writer.setPageSize(23);
  await writer.writeHeader();
  await writer.writeFooter(null as unknown as Record<string, string>);
  await writer.close();

  expect(chunks.length).toBe(2);
  expect(writer.offset).toBeGreaterThan(5);
  expect(writer.pageSize).toBe(23);
  expect(close).toHaveBeenCalledOnce();
});
