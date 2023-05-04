import {SLPKLoaderOptions} from 'modules/i3s/src/i3s-slpk-loader';
import {parseZipCDFileHeader} from '../parce-zip/cd-file-header';
import {parseZipLocalFileHeader} from '../parce-zip/local-file-header';
import {SLPKArchive} from './slpk-archieve';
/**
 * Returns one byte from the provided buffer at the provided position
 */
const getByteAt = (offset: number, buffer: DataView): number => {
  return buffer.getUint8(buffer.byteOffset + offset);
};

export async function parseSLPK(data: ArrayBuffer, options: SLPKLoaderOptions = {}) {
  const archive = new DataView(data);
  const cdFileHeaderSignature = [80, 75, 1, 2];

  const searchWindow = [
    getByteAt(archive.byteLength - 1, archive),
    getByteAt(archive.byteLength - 2, archive),
    getByteAt(archive.byteLength - 3, archive),
    undefined
  ];

  let hashCDOffset = 0;

  // looking for the last record in the central directory
  for (let i = archive.byteLength - 4; i > -1; i--) {
    searchWindow[3] = searchWindow[2];
    searchWindow[2] = searchWindow[1];
    searchWindow[1] = searchWindow[0];
    searchWindow[0] = getByteAt(i, archive);
    if (searchWindow.every((val, index) => val === cdFileHeaderSignature[index])) {
      hashCDOffset = i;
      break;
    }
  }

  const cdFileHeader = parseZipCDFileHeader(hashCDOffset, archive);

  const textDecoder = new TextDecoder();
  if (textDecoder.decode(cdFileHeader.fileName) !== '@specialIndexFileHASH128@') {
    throw new Error('No hash file in slpk');
  }

  const localFileHeader = parseZipLocalFileHeader(cdFileHeader.localHeaderOffset, archive);

  const fileDataOffset = localFileHeader.fileDataOffset;
  const hashFile = archive.buffer.slice(
    fileDataOffset,
    fileDataOffset + localFileHeader.compressedSize
  );

  if (!hashFile) {
    throw new Error('No hash file in slpk');
  }

  return await new SLPKArchive(data, hashFile).getFile(options.path ?? '');
}
