// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc

/* global TextEncoder, TextDecoder */
import {
  concatenateArrayBuffers,
  WriterOptionsType,
  WriterWithEncoder
} from '@loaders.gl/loader-utils';
import {Table} from '@loaders.gl/schema';

export async function encodeTable<WriterT extends WriterWithEncoder = WriterWithEncoder>(
  data: Table,
  writer: WriterT,
  options?: WriterOptionsType<WriterT>
): Promise<ArrayBuffer> {
  if (writer.encode) {
    return await writer.encode(data, options);
  }

  if (writer.encodeText) {
    const text = await writer.encodeText(data, options);
    return new TextEncoder().encode(text);
  }

  if (writer.encodeInBatches) {
    // Create an iterator representing the data
    // TODO - Assumes this is a table
    const batches = encodeTableInBatches(data, writer, options);

    // Concatenate the output
    const chunks: ArrayBuffer[] = [];
    for await (const batch of batches) {
      chunks.push(batch);
    }
    return concatenateArrayBuffers(...chunks);
  }

  throw new Error('Writer could not encode data');
}

export async function encodeTableAsText<WriterT extends WriterWithEncoder = WriterWithEncoder>(
  data: Table,
  writer: WriterT,
  options?: WriterOptionsType<WriterT>
): Promise<string> {
  if (writer.text && writer.encodeText) {
    return await writer.encodeText(data, options);
  }

  if (writer.text) {
    const arrayBuffer = await encodeTable(data, writer, options);
    return new TextDecoder().decode(arrayBuffer);
  }
  throw new Error(`Writer ${writer.name} could not encode data as text`);
}

export function encodeTableInBatches<WriterT extends WriterWithEncoder = WriterWithEncoder>(
  data: Table,
  writer: WriterT,
  options?: WriterOptionsType<WriterT>
): AsyncIterable<ArrayBuffer> {
  if (writer.encodeInBatches) {
    const dataIterator = getIterator(data);
    // @ts-expect-error
    return writer.encodeInBatches(dataIterator, options);
  }
  // TODO -fall back to atomic encode?
  throw new Error('Writer could not encode data in batches');
}

function getIterator(data: any): Iterable<{start: number; end: number}> {
  const dataIterator = [{...data, start: 0, end: data.length}];
  return dataIterator;
}
