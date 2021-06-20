import type {Writer, LoaderOptions} from '@loaders.gl/loader-utils';
import {concatenateArrayBuffers, resolvePath} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/loader-utils';
import {writeFile} from '../fetch/write-file';
import {fetchFile} from '../fetch/fetch-file';

/**
 * Encode loaded data into a binary ArrayBuffer using the specified Writer.
 */
export async function encode(
  data: any,
  writer: Writer,
  options?: LoaderOptions,
  url?: string
): Promise<ArrayBuffer> {
  if (writer.encode) {
    return await writer.encode(data, options);
  }

  if (writer.encodeSync) {
    return writer.encodeSync(data, options);
  }

  if (writer.encodeText) {
    return new TextEncoder().encode(await writer.encodeText(data, options));
  }

  if (writer.encodeInBatches) {
    // Create an iterator representing the data
    // TODO - Assumes this is a table
    const batches = encodeInBatches(data, writer, options);

    // Concatenate the output
    const chunks: any[] = [];
    for await (const batch of batches) {
      chunks.push(batch);
    }
    // @ts-ignore
    return await concatenateArrayBuffers(...chunks);
  }

  if (!isBrowser && writer.encodeURLtoURL) {
    // TODO - how to generate filenames with correct extensions?
    const tmpInputFilename = getTemporaryFilename('input');
    await writeFile(tmpInputFilename, data);

    const tmpOutputFilename = getTemporaryFilename('output');

    const outputFilename = await encodeURLtoURL(
      tmpInputFilename,
      tmpOutputFilename,
      writer,
      options
    );

    const response = await fetchFile(outputFilename);
    return response.arrayBuffer();
  }

  throw new Error('Writer could not encode data');
}

/**
 * Encode loaded data into a binary ArrayBuffer using the specified Writer.
 */
export function encodeSync(
  data: any,
  writer: Writer,
  options?: LoaderOptions,
  url?: string
): ArrayBuffer {
  if (writer.encodeSync) {
    return writer.encodeSync(data, options);
  }
  throw new Error('Writer could not synchronously encode data');
}

/**
 * Encode loaded data to text using the specified Writer
 * @note This is a convenience function not intended for production use on large input data.
 * It is not optimized for performance. Data maybe converted from text to binary and back.
 * @throws if the writer does not generate text output
 */
export async function encodeText(
  data: any,
  writer: Writer,
  options?: LoaderOptions,
  url?: string
): Promise<string> {
  if (writer.text && writer.encodeText) {
    return await writer.encodeText(data, options);
  }

  if (writer.text && (writer.encode || writer.encodeInBatches)) {
    const arrayBuffer = await encode(data, writer, options);
    return new TextDecoder().decode(arrayBuffer);
  }

  throw new Error('Writer could not encode data as text');
}

/**
 * Encode loaded data into a sequence (iterator) of binary ArrayBuffers using the specified Writer.
 */
export function encodeInBatches(
  data: any,
  writer: Writer,
  options?: LoaderOptions,
  url?: string
): AsyncIterable<ArrayBuffer> {
  if (writer.encodeInBatches) {
    const dataIterator = getIterator(data);
    return writer.encodeInBatches(dataIterator, options);
  }
  // TODO -fall back to atomic encode?
  throw new Error('Writer could not encode data in batches');
}

/**
 * Encode data stored in a file (on disk) to another file.
 * @note Node.js only. This function enables using command-line converters as "writers".
 */
export async function encodeURLtoURL(
  inputUrl,
  outputUrl,
  writer: Writer,
  options
): Promise<string> {
  inputUrl = resolvePath(inputUrl);
  outputUrl = resolvePath(outputUrl);
  if (isBrowser || !writer.encodeURLtoURL) {
    throw new Error();
  }
  const outputFilename = await writer.encodeURLtoURL(inputUrl, outputUrl, options);
  return outputFilename;
}

/**
 * @todo TODO - this is an unacceptable hack!!!
 */
function getIterator(data) {
  const dataIterator = [{table: data, start: 0, end: data.length}];
  return dataIterator;
}

/**
 * @todo Move to utils
 */
function getTemporaryFilename(filename: string): string {
  return `/tmp/${filename}`;
}
