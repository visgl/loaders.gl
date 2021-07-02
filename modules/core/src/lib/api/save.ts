import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {encode, encodeSync} from './encode';
import {writeFile, writeFileSync} from '../fetch/write-file';

export async function save(data, url, writer: Writer, options: WriterOptions) {
  const encodedData = await encode(data, writer, options);
  return await writeFile(url, encodedData);
}

export function saveSync(data, url, writer, options) {
  const encodedData = encodeSync(data, writer, options);
  return writeFileSync(url, encodedData);
}
