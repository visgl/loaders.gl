import {SlpkLoaderOptions} from 'modules/i3s/src/i3s-slpk-loader';
import CDFileHeader from './cd-file-header';
import LocalFileHeader from './local-file-header';
import SlpkArchive from './slpk-archieve';
/**
 * Returns one byte from the provided buffer at the provided position
 */
const getByteAt = (offset: number, buffer: DataView): number => {
  return buffer.getUint8(buffer.byteOffset + offset);
};

export async function parseSlpk(data: ArrayBuffer, options: SlpkLoaderOptions = {}) {
  const slpkArchive = new DataView(data);
  const cdFileHeaderSignature = [80, 75, 1, 2];

  const searchWindow = [
    getByteAt(slpkArchive.byteLength - 1, slpkArchive),
    getByteAt(slpkArchive.byteLength - 2, slpkArchive),
    getByteAt(slpkArchive.byteLength - 3, slpkArchive),
    undefined
  ];

  let hashCDOffset = 0;

  // looking for the last record in the central directory
  for (let i = slpkArchive.byteLength - 4; i > -1; i--) {
    searchWindow[3] = searchWindow[2];
    searchWindow[2] = searchWindow[1];
    searchWindow[1] = searchWindow[0];
    searchWindow[0] = getByteAt(i, slpkArchive);
    if (searchWindow.every((val, index) => val === cdFileHeaderSignature[index])) {
      hashCDOffset = i;
      break;
    }
  }

  const cdFileHeader = new CDFileHeader(hashCDOffset, slpkArchive);

  const textDecoder = new TextDecoder();
  if (textDecoder.decode(cdFileHeader.fileName) !== '@specialIndexFileHASH128@') {
    throw new Error('No hash file in slpk');
  }

  const localFileHeader = new LocalFileHeader(cdFileHeader.localHeaderOffset, slpkArchive);

  const fileDataOffset = localFileHeader.fileDataOffset;
  const hashFile = slpkArchive.buffer.slice(
    fileDataOffset,
    fileDataOffset + localFileHeader.compressedSize
  );

  if (!hashFile) {
    throw new Error('No hash file in slpk');
  }

  return await new SlpkArchive(data, hashFile).getFile(options.path ?? '');
}
