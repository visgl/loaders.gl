import {Writer, WriterOptions, canEncodeWithWorker} from '@loaders.gl/loader-utils';
import {concatenateArrayBuffers, resolvePath, NodeFile} from '@loaders.gl/loader-utils';
import {processOnWorker} from '@loaders.gl/worker-utils';
import {isBrowser} from '@loaders.gl/loader-utils';
import {fetchFile} from '../fetch/fetch-file';
import {getLoaderOptions} from './loader-options';

/**
 * Encode loaded data into a binary ArrayBuffer using the specified Writer.
 */
export async function encode(
  data: unknown,
  writer: Writer,
  options?: WriterOptions
): Promise<ArrayBuffer> {
  const globalOptions = getLoaderOptions() as WriterOptions;
  // const globalOptions: WriterOptions = {}; // getWriterOptions();
  options = {...globalOptions, ...options};
  if (canEncodeWithWorker(writer, options)) {
    return await processOnWorker(writer, data, options);
  }

  // TODO Merge default writer options with options argument like it is done in load module.
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
    const chunks: unknown[] = [];
    for await (const batch of batches) {
      chunks.push(batch);
    }
    // @ts-ignore
    return concatenateArrayBuffers(...chunks);
  }

  if (!isBrowser && writer.encodeURLtoURL) {
    // TODO - how to generate filenames with correct extensions?
    const tmpInputFilename = getTemporaryFilename('input');
    const file = new NodeFile(tmpInputFilename, "w");
    await file.write(data as ArrayBuffer);

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
export function encodeSync(data: unknown, writer: Writer, options?: WriterOptions): ArrayBuffer {
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
  data: unknown,
  writer: Writer,
  options?: WriterOptions
): Promise<string> {
  if (writer.text && writer.encodeText) {
    return await writer.encodeText(data, options);
  }

  if (writer.text && (writer.encode || writer.encodeInBatches)) {
    const arrayBuffer = await encode(data, writer, options);
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
export function encodeTextSync(data: unknown, writer: Writer, options?: WriterOptions): string {
  if (writer.text && writer.encodeTextSync) {
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
export function encodeInBatches(
  data: unknown,
  writer: Writer,
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

/**
 * Encode data stored in a file (on disk) to another file.
 * @note Node.js only. This function enables using command-line converters as "writers".
 */
export async function encodeURLtoURL(
  inputUrl: string,
  outputUrl: string,
  writer: Writer,
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
