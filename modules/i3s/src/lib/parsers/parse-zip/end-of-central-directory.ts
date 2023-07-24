import {FileProvider} from './file-provider';
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

const offsets = {
  CD_RECORDS_NUMBER_OFFSET: 8n,
  CD_START_OFFSET_OFFSET: 16n,

  ZIP64_EOCD_START_OFFSET_OFFSET: 8n,

  ZIP64_CD_RECORDS_NUMBER_OFFSET: 24n,
  ZIP64_CD_START_OFFSET_OFFSET: 48n
};

/**
 * Parses end of central directory record of zip file
 * @param fileProvider - buffer containing whole array
 * @returns Info from the header
 */
export const parseEoCDRecord = async (fileProvider: FileProvider): Promise<ZipEoCDRecord> => {
  const zipEoCDOffset = await searchFromTheEnd(fileProvider, eoCDSignature);

  let cdRecordsNumber = BigInt(
    await fileProvider.getUint16(zipEoCDOffset + offsets.CD_RECORDS_NUMBER_OFFSET)
  );
  let cdStartOffset = BigInt(
    await fileProvider.getUint32(zipEoCDOffset + offsets.CD_START_OFFSET_OFFSET)
  );

  if (cdStartOffset === BigInt(0xffffffff)) {
    const zip64EoCDLocatorOffset = zipEoCDOffset - 20n;

    if (
      Buffer.from(
        await fileProvider.slice(zip64EoCDLocatorOffset, zip64EoCDLocatorOffset + 4n)
      ).compare(zip64EoCDLocatorSignature) !== 0
    ) {
      throw new Error('zip64 EoCD locator not found');
    }
    const zip64EoCDOffset = await fileProvider.getBigUint64(
      zip64EoCDLocatorOffset + offsets.ZIP64_EOCD_START_OFFSET_OFFSET
    );

    if (
      Buffer.from(await fileProvider.slice(zip64EoCDOffset, zip64EoCDOffset + 4n)).compare(
        zip64EoCDSignature
      ) !== 0
    ) {
      throw new Error('zip64 EoCD not found');
    }

    cdRecordsNumber = await fileProvider.getBigUint64(
      zip64EoCDOffset + offsets.ZIP64_CD_RECORDS_NUMBER_OFFSET
    );
    cdStartOffset = await fileProvider.getBigUint64(
      zip64EoCDOffset + offsets.ZIP64_CD_START_OFFSET_OFFSET
    );
  }

  return {
    cdRecordsNumber,
    cdStartOffset
  };
};
