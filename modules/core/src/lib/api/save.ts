import type {WriterObject, CoreWriterOptions} from '@loaders.gl/loader-utils';
import {encode, encodeSync} from './encode';
import {writeFile, writeFileSync} from '../fetch/write-file';

export async function save(data, url, writer: WriterObject, options: CoreWriterOptions) {
  const encodedData = await encode(data, writer, options, url);
  return await writeFile(url, encodedData);
}

export function saveSync(data, url, writer, options) {
  const encodedData = encodeSync(data, writer, options, url);
  return writeFileSync(url, encodedData);
}
