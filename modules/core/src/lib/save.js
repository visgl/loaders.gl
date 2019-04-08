import {encode, encodeSync} from './encode';
import {writeFile, writeFileSync} from './fetch/write-file';

export function save(data, url, writer) {
  const encodedData = encode(data, writer, url);
  return writeFile(url, encodedData);
}

export function saveSync(data, url, writer) {
  const encodedData = encodeSync(data, writer, url);
  return writeFileSync(url, encodedData);
}
