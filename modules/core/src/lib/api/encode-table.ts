// loaders.gl, MIT license
// Copyright 2022 Foursquare Labs, Inc

/* global TextEncoder, TextDecoder */
import {concatenateArrayBuffers, DataWriter} from '@loaders.gl/loader-utils';
import {Table} from '@loaders.gl/schema';

/** Crazy typescript helper to extract the writer options type from a generic writer type */
type extractWriterOptions<T = DataWriter<any, any, any> | {writer: DataWriter<any, any, any>}> =
  T extends DataWriter<any, any, infer Options>
    ? Options
    : T extends {writer: DataWriter<any, any, infer Options>}
    ? Options
    : never;

export async function encodeTable<WriterT extends DataWriter = DataWriter>(
  data: Table,
  writer: WriterT,
  options?: extractWriterOptions<WriterT>
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

export async function encodeTableAsText<WriterT extends DataWriter = DataWriter>(
  data: Table,
  writer: WriterT,
  options?: extractWriterOptions<WriterT>
): Promise<string> {
  if (writer.text && writer.encodeText) {
    return await writer.encodeText(data, options);
  }

  if (writer.text && (writer.encode || writer.encodeInBatches)) {
    const arrayBuffer = await encodeTable(data, writer, options);
    return new TextDecoder().decode(arrayBuffer);
  }
  throw new Error('Writer could not encode data as text');
}

export function encodeTableInBatches<WriterOptions>(
  data: Table,
  writer: DataWriter<WriterOptions>,
  options?: WriterOptions
): AsyncIterable<ArrayBuffer> {
  if (writer.encodeInBatches) {
    const dataIterator = getIterator(data);
    // @ts-expect-error - TODO: the data iterator shape is not what's expected here
    return writer.encodeInBatches(dataIterator, options);
  }
  // TODO -fall back to atomic encode?
  throw new Error('Writer could not encode data in batches');
}

function getIterator(data) {
  const dataIterator = [{table: data, start: 0, end: data.length}];
  return dataIterator;
}
