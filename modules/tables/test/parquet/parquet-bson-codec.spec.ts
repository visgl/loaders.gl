// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {ArrayBufferFile} from '@loaders.gl/core/loader-utils';
import {ParquetEncoder, ParquetEnvelopeWriter} from '../../src/parquet/parquetjs/encoder/parquet-encoder';
import {ParquetReader} from '../../src/parquet/parquetjs/parser/parquet-reader';
import {ParquetSchema} from '../../src/parquet/parquetjs/schema/schema';
import {ParquetJSLoaderWithParser} from '../../src/parquet/parquet-js-loader';
import {BSONObjectId, createBSONValue, parseBSONSync} from '../../src/bson';

test.each([false, true])('Parquet BSON read/write and Arrow byte preservation, Data Page V2=%s', async useDataPageV2 => {
  const documents = [
    {id: new BSONObjectId('0123456789abcdef01234567'), count: 9007199254740993n,
      bytes: new Uint8Array([2, 3]), date: new Date(123456789), nested: [null, {text: 'héllo'}]},
    {value: createBSONValue({$bsonType: 'decimal128', bytes: new Uint8Array(16)}),
      timestamp: createBSONValue({$bsonType: 'timestamp', value: 18446744073709551615n})}
  ];
  const chunks: Uint8Array[] = [];
  const schema = new ParquetSchema({payload: {type: 'BSON', optional: true}});
  const options = {useDataPageV2, pageSize: 1};
  const envelope = new ParquetEnvelopeWriter(schema, async chunk => { chunks.push(chunk); }, async () => {}, 0, options);
  const encoder = new ParquetEncoder(schema, envelope, options);
  for (const payload of documents) await encoder.appendRow({payload});
  await encoder.appendRow({});
  await encoder.close();
  const bytes = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk, offset); offset += chunk.length;}
  const reader = new ParquetReader(new ArrayBufferFile(bytes.buffer));
  try {
    const metadata = await reader.getFileMetadata();
    expect(metadata.schema[1].logicalType?.BSON).toBeTruthy();
    const rows: unknown[] = [];
    for await (const row of reader.rowIterator()) rows.push(row);
    expect(rows).toEqual([...documents.map(payload => ({payload})), {}]);
  } finally {reader.close();}

  const table = await parse(bytes.buffer, ParquetJSLoaderWithParser, {core: {worker: false}, parquet: {shape: 'arrow-table'}});
  expect(table.shape).toBe('arrow-table');
  if (table.shape !== 'arrow-table') throw new Error('Expected an Arrow table');
  const payloads = table.data.getChild('payload')!;
  expect(payloads.get(2)).toBeNull();
  for (let index = 0; index < documents.length; index++) {
    const payload = payloads.get(index) as Uint8Array;
    expect(payload).toBeInstanceOf(Uint8Array);
    expect(parseBSONSync(payload.slice().buffer)).toEqual(documents[index]);
  }
});
