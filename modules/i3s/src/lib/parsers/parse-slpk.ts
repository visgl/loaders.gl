import md5 from 'md5';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const ZIP_OFFSETS = {
  compressedSize: 18,

  cdCompressedSize: 20,
  cdUncompressedSize: 24,
  cdFileName: 46,
  cdFileNameLength: 28,
  cdExtraFieldLength: 30
};

class SlpkArchieve {
  slpkArchieve: DataView;
  hashArray: {hash: Buffer; offset: number}[];
  constructor(slpkArchieveBuffer: ArrayBuffer, hashFile: ArrayBuffer) {
    const hashFileBuffer = Buffer.from(hashFile);
    this.slpkArchieve = new DataView(slpkArchieveBuffer);
    this.hashArray = [];
    for (let i = 0; i < hashFileBuffer.buffer.byteLength; i = i + 24) {
      const offsetBuffer = new DataView(
        hashFileBuffer.buffer.slice(
          hashFileBuffer.byteOffset + i + 16,
          hashFileBuffer.byteOffset + i + 24
        )
      );
      const offset = offsetBuffer.getUint32(offsetBuffer.byteOffset, true);
      this.hashArray.push({
        hash: hashFileBuffer.subarray(
          hashFileBuffer.byteOffset + i,
          hashFileBuffer.byteOffset + i + 16
        ),
        offset
      });
    }
  }

  /* eslint-disable consistent-return */
  getFile(path: string) {
    const fileInfo = this.hashArray.find(
      (val) => Buffer.compare(val.hash, Buffer.from(md5(`${path}.gz`), 'hex')) === 0
    );

    if (!fileInfo) {
      return;
    }

    const fileOffset = this.slpkArchieve.byteOffset + fileInfo?.offset;
    const fileDataOffset =
      fileOffset +
      30 +
      this.slpkArchieve.getUint16(fileOffset + 26, true) +
      this.slpkArchieve.getUint16(fileOffset + 28, true);

    return this.slpkArchieve.buffer.slice(
      fileDataOffset,
      fileDataOffset + this.slpkArchieve.getUint32(fileOffset + 18, true)
    );
  }
}

export async function parseSlpk(data: ArrayBuffer, options = {}, context?) {
  const slpkArchieve = new DataView(data);
  let hashFile: ArrayBuffer | undefined;

  const getAt = (offset: number) => {
    return slpkArchieve.getUint8(slpkArchieve.byteOffset + offset);
  };

  const searchWindow = [
    getAt(slpkArchieve.byteLength - 1),
    getAt(slpkArchieve.byteLength - 2),
    getAt(slpkArchieve.byteLength - 3),
    undefined
  ];

  let hashCDOffset = 0;

  for (let i = slpkArchieve.byteLength - 4; i > -1; i--) {
    // looking for the last record in the central directory
    searchWindow[3] = searchWindow[2];
    searchWindow[2] = searchWindow[1];
    searchWindow[1] = searchWindow[0];
    searchWindow[0] = getAt(i);
    if (searchWindow.toString().includes('80,75,1,2')) {
      hashCDOffset = i;
      break;
    }
  }

  const textDecoder = new TextDecoder();
  if (
    textDecoder.decode(
      slpkArchieve.buffer.slice(
        hashCDOffset + 46,
        hashCDOffset + 46 + slpkArchieve.getUint16(hashCDOffset + 28, true)
      )
    ) !== '@specialIndexFileHASH128@'
  ) {
    throw new Error('No hash file in slpk');
  }

  const fileDataOffset = slpkArchieve.getUint32(hashCDOffset + 42, true);
  if (fileDataOffset < 0xffffffff) {
    // check if it in zip or zip64 format
    hashFile = slpkArchieve.buffer.slice(
      fileDataOffset,
      fileDataOffset + slpkArchieve.getUint16(fileDataOffset + ZIP_OFFSETS.compressedSize, true)
    );
  } else {
    let offsetInZip64Data = 4;
    if (slpkArchieve.getUint16(hashCDOffset + ZIP_OFFSETS.cdCompressedSize, true) === 0xffffffff) {
      // looking for info that should be in zip64 extra field
      offsetInZip64Data += 4;
    }
    if (
      slpkArchieve.getUint16(hashCDOffset + ZIP_OFFSETS.cdUncompressedSize, true) === 0xffffffff
    ) {
      offsetInZip64Data += 4;
    }
    const n = slpkArchieve.getUint16(hashCDOffset + ZIP_OFFSETS.cdFileNameLength, true);
    const fileDataOffset64 = slpkArchieve.getUint32(
      hashCDOffset + ZIP_OFFSETS.cdFileName + n + offsetInZip64Data,
      true
    ); // replace with BigInt for archieves bigger than 2gb

    const fileDataOffset =
      fileDataOffset64 +
      30 +
      slpkArchieve.getUint16(fileDataOffset64 + 26, true) +
      slpkArchieve.getUint16(fileDataOffset64 + 28, true);
    const fileLength = slpkArchieve.getUint32(fileDataOffset64 + 18, true);
    hashFile = slpkArchieve.buffer.slice(fileDataOffset, fileDataOffset + fileLength);
  }

  if (!hashFile) {
    throw new Error('No hash file in slpk');
  }

  return new SlpkArchieve(data, hashFile);
}
