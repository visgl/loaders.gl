import {FileProvider} from '@loaders.gl/loader-utils';
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

const eoCDSignature: ZipSignature = [0x50, 0x4b, 0x05, 0x06];
const zip64EoCDLocatorSignature = Buffer.from([0x50, 0x4b, 0x06, 0x07]);
const zip64EoCDSignature = Buffer.from([0x50, 0x4b, 0x06, 0x06]);

// offsets accroding to https://en.wikipedia.org/wiki/ZIP_(file_format)
const CD_RECORDS_NUMBER_OFFSET = 8n;
const CD_START_OFFSET_OFFSET = 16n;
const ZIP64_EOCD_START_OFFSET_OFFSET = 8n;
const ZIP64_CD_RECORDS_NUMBER_OFFSET = 24n;
const ZIP64_CD_START_OFFSET_OFFSET = 48n;

/**
 * Parses end of central directory record of zip file
 * @param fileProvider - FileProvider instance
 * @returns Info from the header
 */
export const parseEoCDRecord = async (fileProvider: FileProvider): Promise<ZipEoCDRecord> => {
  const zipEoCDOffset = await searchFromTheEnd(fileProvider, eoCDSignature);

  let cdRecordsNumber = BigInt(
    await fileProvider.getUint16(zipEoCDOffset + CD_RECORDS_NUMBER_OFFSET)
  );
  let cdStartOffset = BigInt(await fileProvider.getUint32(zipEoCDOffset + CD_START_OFFSET_OFFSET));

  if (cdStartOffset === BigInt(0xffffffff) || cdRecordsNumber === BigInt(0xffffffff)) {
    const zip64EoCDLocatorOffset = zipEoCDOffset - 20n;

    if (
      Buffer.from(
        await fileProvider.slice(zip64EoCDLocatorOffset, zip64EoCDLocatorOffset + 4n)
      ).compare(zip64EoCDLocatorSignature) !== 0
    ) {
      throw new Error('zip64 EoCD locator not found');
    }
    const zip64EoCDOffset = await fileProvider.getBigUint64(
      zip64EoCDLocatorOffset + ZIP64_EOCD_START_OFFSET_OFFSET
    );

    if (
      Buffer.from(await fileProvider.slice(zip64EoCDOffset, zip64EoCDOffset + 4n)).compare(
        zip64EoCDSignature
      ) !== 0
    ) {
      throw new Error('zip64 EoCD not found');
    }

    cdRecordsNumber = await fileProvider.getBigUint64(
      zip64EoCDOffset + ZIP64_CD_RECORDS_NUMBER_OFFSET
    );
    cdStartOffset = await fileProvider.getBigUint64(zip64EoCDOffset + ZIP64_CD_START_OFFSET_OFFSET);
  }

  return {
    cdRecordsNumber,
    cdStartOffset
  };
};
