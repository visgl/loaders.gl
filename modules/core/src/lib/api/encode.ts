// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  WriterOptions,
  WriterWithEncoder,
  WriterOptionsType,
  WriterDataType,
  WriterBatchType
} from '@loaders.gl/loader-utils';
import {canEncodeWithWorker, NodeFile, resolvePath, isBrowser} from '@loaders.gl/loader-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';
import {fetchFile} from '../fetch/fetch-file';
import {getLoaderOptions} from './loader-options';

/**
 * Encode loaded data into a binary ArrayBuffer using the specified Writer.
 */
export async function encode<WriterT extends WriterWithEncoder>(
  data: WriterDataType<WriterT>,
  writer: WriterT,
  options_?: WriterOptionsType<WriterT>
): Promise<ArrayBuffer> {
  const globalOptions = getLoaderOptions() as WriterOptions;
  // const globalOptions: WriterOptions = {}; // getWriterOptions();
  const options = {...globalOptions, ...options_};

  // Handle the special case where we are invoking external command-line tools
  if (writer.encodeURLtoURL) {
    return encodeWithCommandLineTool(writer, data, options);
  }

  // Worker support
  if (canEncodeWithWorker(writer, options)) {
    return await processOnWorker(writer, data, options);
  }

  // TODO Merge default writer options with options argument like it is done in load module.
  return await writer.encode(data, options);
}

/**
 * Encode loaded data into a binary ArrayBuffer using the specified Writer.
 */
export function encodeSync<WriterT extends WriterWithEncoder>(
  data: WriterDataType<WriterT>,
  writer: WriterT,
  options?: WriterOptionsType<WriterT>
): ArrayBuffer {
  if (writer.encodeSync) {
    return writer.encodeSync(data, options);
  }
  if (writer.encodeTextSync) {
    return new TextEncoder().encode(writer.encodeTextSync(data, options));
  }
  throw new Error(`Writer ${writer.name} could not synchronously encode data`);
}

/**
 * Encode loaded data to text using the specified Writer
 * @note This is a convenience function not intended for production use on large input data.
 * It is not optimized for performance. Data maybe converted from text to binary and back.
 * @throws if the writer does not generate text output
 */
export async function encodeText<WriterT extends WriterWithEncoder>(
  data: WriterDataType<WriterT>,
  writer: WriterT,
  options?: WriterOptionsType<WriterT>
): Promise<string> {
  if (writer.encodeText) {
    return await writer.encodeText(data, options);
  }

  if (writer.encodeTextSync) {
    return writer.encodeTextSync(data, options);
  }

  if (writer.text) {
    const arrayBuffer = await writer.encode(data, options);
    return new TextDecoder().decode(arrayBuffer);
  }

  throw new Error(`Writer ${writer.name} could not encode data as text`);
}

/**
 * Encode loaded data to text using the specified Writer
 * @note This is a convenience function not intended for production use on large input data.
 * It is not optimized for performance. Data maybe converted from text to binary and back.
 * @throws if the writer does not generate text output
 */
export function encodeTextSync<WriterT extends WriterWithEncoder>(
  data: WriterDataType<WriterT>,
  writer: WriterT,
  options?: WriterOptionsType<WriterT>
): string {
  if (writer.encodeTextSync) {
    return writer.encodeTextSync(data, options);
  }

  if (writer.text && writer.encodeSync) {
    const arrayBuffer = encodeSync(data, writer, options);
    return new TextDecoder().decode(arrayBuffer);
  }

  throw new Error(`Writer ${writer.name} could not encode data as text`);
}

/**
 * Encode loaded data into a sequence (iterator) of binary ArrayBuffers using the specified Writer.
 */
export function encodeInBatches<WriterT extends WriterWithEncoder>(
  data: WriterBatchType<WriterT>,
  writer: WriterT,
  options?: WriterOptionsType<WriterT>
): AsyncIterable<ArrayBuffer> {
  if (writer.encodeInBatches) {
    const dataIterator = getIterator(data);
    // @ts-expect-error
    return writer.encodeInBatches(dataIterator, options);
  }
  // TODO -fall back to atomic encode?
  throw new Error(`Writer ${writer.name} could not encode in batches`);
}

/**
 * Encode loaded data into a sequence (iterator) of binary ArrayBuffers using the specified Writer.
 */
export function encodeTextInBatches(
  data: unknown,
  writer: WriterWithEncoder,
  options?: WriterOptions
): AsyncIterable<ArrayBuffer> {
  if (writer.encodeTextInBatches) {
    const dataIterator = getIterator(data);
    // @ts-expect-error
    return writer.encodeTextInBatches(dataIterator, options);
  }
  // TODO -fall back to atomic encode?
  throw new Error(`Writer ${writer.name} could not encode text in batches`);
}

/**
 * Encode data stored in a file (on disk) to another file.
 * @note Node.js only. This function enables using command-line converters as "writers".
 */
export async function encodeURLtoURL(
  inputUrl: string,
  outputUrl: string,
  writer: Omit<WriterWithEncoder, 'encode'>,
  options?: WriterOptions
): Promise<string> {
  inputUrl = resolvePath(inputUrl);
  outputUrl = resolvePath(outputUrl);
  if (isBrowser || !writer.encodeURLtoURL) {
    throw new Error();
  }
  const outputFilename = await writer.encodeURLtoURL(inputUrl, outputUrl, options);
  return outputFilename;
}

/** Helper function to encode via external tool (typically command line execution in Node.js) */
async function encodeWithCommandLineTool(
  writer: WriterWithEncoder,
  data: unknown,
  options: WriterOptions
): Promise<ArrayBuffer> {
  if (isBrowser) {
    throw new Error(`Writer ${writer.name} not supported in browser`);
  }
  // TODO - how to generate filenames with correct extensions?
  const tmpInputFilename = getTemporaryFilename('input');
  const file = new NodeFile(tmpInputFilename, 'w');
  await file.write(data as ArrayBuffer);

  const tmpOutputFilename = getTemporaryFilename('output');

  const outputFilename = await encodeURLtoURL(tmpInputFilename, tmpOutputFilename, writer, options);

  const response = await fetchFile(outputFilename);
  return response.arrayBuffer();
}

/**
 * @todo TODO - this is an unacceptable hack!!!
 */
function getIterator(data: any): Iterable<{table: any; start: number; end: number}> {
  const dataIterator = [{...data, start: 0, end: data.length}];
  return dataIterator;
}

/**
 * @todo Move to utils
 */
function getTemporaryFilename(filename: string): string {
  return `/tmp/${filename}`;
}
