/** @typedef {import('./encode')} types */
import {concatenateArrayBuffers, resolvePath} from '@loaders.gl/loader-utils';
import {isBrowser} from '@loaders.gl/loader-utils';
import {writeFile} from '../fetch/write-file';
import {fetchFile} from '../fetch/fetch-file';

/**
 * @param {string} filename
 * @returns {string}
 * @todo Move to utils
 */
function getTemporaryFilename(filename) {
  return `/tmp/${filename}`;
}

export async function encode(data, writer, options, url) {
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
    const chunks = [];
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

export function encodeSync(data, writer, options, url) {
  if (writer.encodeSync) {
    return writer.encodeSync(data, options);
  }
  throw new Error('Writer could not synchronously encode data');
}

export async function encodeText(data, writer, options, url) {
  if (writer.text && writer.encodeText) {
    return await writer.encodeText(data, options);
  }

  if (writer.text && (writer.encode || writer.encodeInBatches)) {
    const arrayBuffer = await encode(data, writer, options);
    return new TextDecoder().decode(arrayBuffer);
  }

  throw new Error('Writer could not encode data as text');
}

export function encodeInBatches(data, writer, options, url) {
  if (writer.encodeInBatches) {
    const dataIterator = getIterator(data);
    return writer.encodeInBatches(dataIterator, options);
  }
  // TODO -fall back to atomic encode?
  throw new Error('Writer could not encode data in batches');
}

function getIterator(data) {
  // TODO - this is an unacceptable hack!!!
  const dataIterator = [{table: data, start: 0, end: data.length}];
  return dataIterator;
}

export async function encodeURLtoURL(inputUrl, outputUrl, writer, options) {
  inputUrl = resolvePath(inputUrl);
  outputUrl = resolvePath(outputUrl);
  if (isBrowser || !writer.encodeURLtoURL) {
    throw new Error();
  }
  const outputFilename = await writer.encodeURLtoURL(inputUrl, outputUrl, options);
  return outputFilename;
}
