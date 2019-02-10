import {encodeFile, encodeFileSync} from '../encode-file/encode-file';
import {writeFile, writeFileSync} from '../write-file/write-file';

export function saveFile(data, url, writer) {
  const encodedData = encodeFile(data, writer, url);
  return writeFile(url, encodedData);
}

export function saveFileSync(data, url, writer) {
  const encodedData = encodeFileSync(data, writer, url);
  return writeFileSync(url, encodedData);
}
