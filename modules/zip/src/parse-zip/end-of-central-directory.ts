import {FileProvider, compareArrayBuffers} from '@loaders.gl/loader-utils';
import {ZipSignature, searchFromTheEnd} from './search-from-the-end';

/**
 * End of central directory info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipEoCDRecord = {
  /** Relative offset of local file header */
  cdStartOffset: bigint;
  /** Relative offset of local file header */
  cdRecordsNumber: bigint;
};

const eoCDSignature: ZipSignature = new Uint8Array([0x50, 0x4b, 0x05, 0x06]);
const zip64EoCDLocatorSignature = new Uint8Array([0x50, 0x4b, 0x06, 0x07]);
const zip64EoCDSignature = new Uint8Array([0x50, 0x4b, 0x06, 0x06]);

// offsets accroding to https://en.wikipedia.org/wiki/ZIP_(file_format)
const CD_RECORDS_NUMBER_OFFSET = 8n;
const CD_START_OFFSET_OFFSET = 16n;
const ZIP64_EOCD_START_OFFSET_OFFSET = 8n;
const ZIP64_CD_RECORDS_NUMBER_OFFSET = 24n;
const ZIP64_CD_START_OFFSET_OFFSET = 48n;

/**
 * Parses end of central directory record of zip file
 * @param file - FileProvider instance
 * @returns Info from the header
 */
export const parseEoCDRecord = async (file: FileProvider): Promise<ZipEoCDRecord> => {
  const zipEoCDOffset = await searchFromTheEnd(file, eoCDSignature);

  let cdRecordsNumber = BigInt(
    await file.getUint16(zipEoCDOffset + CD_RECORDS_NUMBER_OFFSET)
  );
  let cdStartOffset = BigInt(await file.getUint32(zipEoCDOffset + CD_START_OFFSET_OFFSET));

  if (cdStartOffset === BigInt(0xffffffff) || cdRecordsNumber === BigInt(0xffffffff)) {
    const zip64EoCDLocatorOffset = zipEoCDOffset - 20n;

    const magicBytes = await file.slice(zip64EoCDLocatorOffset, zip64EoCDLocatorOffset + 4n);
    if (!compareArrayBuffers(magicBytes, zip64EoCDLocatorSignature)) {
      throw new Error('zip64 EoCD locator not found');
    }
    const zip64EoCDOffset = await file.getBigUint64(zip64EoCDLocatorOffset + ZIP64_EOCD_START_OFFSET_OFFSET);

    const endOfCDMagicBytes = await file.slice(zip64EoCDOffset, zip64EoCDOffset + 4n);
    if (!compareArrayBuffers(endOfCDMagicBytes, zip64EoCDSignature.buffer)) {
      throw new Error('zip64 EoCD not found');
    }

    cdRecordsNumber = await file.getBigUint64(zip64EoCDOffset + ZIP64_CD_RECORDS_NUMBER_OFFSET);
    cdStartOffset = await file.getBigUint64(zip64EoCDOffset + ZIP64_CD_START_OFFSET_OFFSET);
  }

  return {
    cdRecordsNumber,
    cdStartOffset
  };
};
