import {SlpkLoaderOptions} from 'modules/i3s/src/i3s-slpk-loader';
import CDFileHeader from './cd-file-header';
import LocalFileHeader from './local-file-header';
import SlpkArchieve from './slpk-archieve';

const getByteAt = (offset: number, buffer: DataView) => {
  return buffer.getUint8(buffer.byteOffset + offset);
};

export async function parceSlpk(data: ArrayBuffer, options: SlpkLoaderOptions = {}) {
  const slpkArchieve = new DataView(data);

  const searchWindow = [
    getByteAt(slpkArchieve.byteLength - 1, slpkArchieve),
    getByteAt(slpkArchieve.byteLength - 2, slpkArchieve),
    getByteAt(slpkArchieve.byteLength - 3, slpkArchieve),
    undefined
  ];

  let hashCDOffset = 0;

  for (let i = slpkArchieve.byteLength - 4; i > -1; i--) {
    // looking for the last record in the central directory
    searchWindow[3] = searchWindow[2];
    searchWindow[2] = searchWindow[1];
    searchWindow[1] = searchWindow[0];
    searchWindow[0] = getByteAt(i, slpkArchieve);
    if (searchWindow.toString().includes('80,75,1,2')) {
      hashCDOffset = i;
      break;
    }
  }

  const cdFileHeader = new CDFileHeader(hashCDOffset, slpkArchieve);

  const textDecoder = new TextDecoder();
  if (textDecoder.decode(cdFileHeader.getFileName()) !== '@specialIndexFileHASH128@') {
    throw new Error('No hash file in slpk');
  }

  const localFileHeader = new LocalFileHeader(cdFileHeader.getLocalHeaderOffset(), slpkArchieve);

  const fileDataOffset = localFileHeader.getFileDataOffset();
  const hashFile = slpkArchieve.buffer.slice(
    fileDataOffset,
    fileDataOffset + localFileHeader.getCompressedSize()
  );

  if (!hashFile) {
    throw new Error('No hash file in slpk');
  }

  return await new SlpkArchieve(data, hashFile).getFile(options.path ?? '');
}
