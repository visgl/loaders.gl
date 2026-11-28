// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright 2022 Foursquare Labs, Inc

/* global TextEncoder, TextDecoder */
import {
  concatenateArrayBuffers,
  ensureArrayBuffer,
  Writer,
  WriterOptions,
  WriterOptionsType,
  WriterDataType,
  WriterWithEncoder
} from '@loaders.gl/core/loader-utils';
import type {Table} from '@loaders.gl/core/schema';

/** Encode the data accepted by a table writer, including native Arrow tables. */
export async function encodeTable<WriterT extends Writer = Writer>(
  data: WriterDataType<WriterT>,
  writerDefinition: WriterT,
  options?: WriterOptionsType<WriterT>
): Promise<ArrayBuffer> {
  const writer: Writer & Partial<WriterWithEncoder> = writerDefinition.preload
    ? await writerDefinition.preload()
    : writerDefinition;
  if (writer.encode) {
    return await writer.encode(data, options);
  }

  if (writer.encodeText) {
    const text = await writer.encodeText(data, options);
    return ensureArrayBuffer(new TextEncoder().encode(text));
  }

  if (writer.encodeInBatches) {
    // Create an iterator representing the data
    // TODO - Assumes this is a table
    const batches = encodeWriterTableInBatches(data, writer, options);

    // Concatenate the output
    const chunks: ArrayBuffer[] = [];
    for await (const batch of batches) {
      chunks.push(batch);
    }
    return concatenateArrayBuffers(...chunks);
  }

  throw new Error('Writer could not encode data');
}

/** Encode a table as text using the writer's inferred input and options types. */
export async function encodeTableAsText<WriterT extends Writer = Writer>(
  data: WriterDataType<WriterT>,
  writerDefinition: WriterT,
  options?: WriterOptionsType<WriterT>
): Promise<string> {
  const writer: Writer & Partial<WriterWithEncoder> = writerDefinition.preload
    ? await writerDefinition.preload()
    : writerDefinition;
  if (writer.text && writer.encodeText) {
    return await writer.encodeText(data, options);
  }
  if (writer.text && writer.encodeTextSync) {
    return writer.encodeTextSync(data, options);
  }

  if (writer.text) {
    const arrayBuffer = await encodeTable<Writer>(data, writer, options);
    return new TextDecoder().decode(arrayBuffer);
  }
  throw new Error(`Writer ${writer.name} could not encode data as text`);
}

export function encodeTableInBatches<WriterT extends Writer = Writer>(
  data: Table,
  writerDefinition: WriterT,
  options?: WriterOptionsType<WriterT>
): AsyncIterable<ArrayBuffer> {
  const writer: Writer & Partial<WriterWithEncoder> = writerDefinition;
  if (!writer.encodeInBatches && writer.preload) {
    const preload = writer.preload.bind(writer);
    return (async function* () {
      const implementation = await preload();
      yield* encodeWriterTableInBatches(data, implementation, options);
    })();
  }
  return encodeWriterTableInBatches(data, writer, options);
}

/** Encodes table batches using the resolved writer's batch method. */
function encodeWriterTableInBatches(
  data: unknown,
  writer: Writer & Partial<WriterWithEncoder>,
  options?: WriterOptions
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
