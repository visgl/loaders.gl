import {MD5Hash} from '@loaders.gl/crypto';
import {FileProvider} from '@loaders.gl/loader-utils';
import {makeZipCDHeaderIterator} from './parse-zip/cd-file-header';

/**
 * Reads hash file from buffer and returns it in ready-to-use form
 * @param arrayBuffer - buffer containing hash file
 * @returns Map containing hash and offset
 */
export function parseHashTable(arrayBuffer: ArrayBuffer): Record<string, bigint> {
  const dataView = new DataView(arrayBuffer);

  const hashMap: Record<string, bigint> = {};

  for (let i = 0; i < arrayBuffer.byteLength; i = i + 24) {
    const offset = dataView.getBigUint64(i + 16, true);
    const hash = bufferToHex(arrayBuffer, i, 16);
    hashMap[hash] = offset;
  }

  return hashMap;
}

function bufferToHex(buffer: ArrayBuffer, start: number, length: number): string {
  // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer, start, length)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * generates hash info from zip files "central directory"
 * @param fileProvider - provider of the archive
 * @returns ready to use hash info
 */
export async function makeHashTableFromZipHeaders(
  fileProvider: FileProvider
): Promise<Record<string, bigint>> {
  const zipCDIterator = makeZipCDHeaderIterator(fileProvider);
  const md5Hash = new MD5Hash();
  const textEncoder = new TextEncoder();

  const hashTable: Record<string, bigint> = {};

  for await (const cdHeader of zipCDIterator) {
    const filename = cdHeader.fileName.split('\\').join('/').toLocaleLowerCase();
    const arrayBuffer = textEncoder.encode(filename).buffer;
    const md5 = await md5Hash.hash(arrayBuffer, 'hex');
    hashTable[md5] = cdHeader.localHeaderOffset;
  }

  return hashTable;
}
