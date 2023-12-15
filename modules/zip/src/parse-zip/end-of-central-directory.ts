// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {FileProvider, compareArrayBuffers} from '@loaders.gl/loader-utils';
import {ZipSignature, searchFromTheEnd} from './search-from-the-end';
import {setFieldToNumber} from './zip64-info-generation';

/**
 * End of central directory info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipEoCDRecord = {
  /** Relative offset of local file header */
  cdStartOffset: bigint;
  /** Relative offset of local file header */
  cdRecordsNumber: bigint;
  offsets: ZipEoCDRecordOffsets;
};

/**
 * End of central directory offsets
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipEoCDRecordOffsets = {
  zipEoCDOffset: bigint;

  zip64EoCDOffset?: bigint;
  zip64EoCDLocatorOffset?: bigint;
};

const eoCDSignature: ZipSignature = new Uint8Array([0x50, 0x4b, 0x05, 0x06]);
const zip64EoCDLocatorSignature = new Uint8Array([0x50, 0x4b, 0x06, 0x07]);
const zip64EoCDSignature = new Uint8Array([0x50, 0x4b, 0x06, 0x06]);

// offsets accroding to https://en.wikipedia.org/wiki/ZIP_(file_format)
const CD_RECORDS_NUMBER_OFFSET = 8n;
const CD_RECORDS_NUMBER_ON_DISC_OFFSET = 10n;
const CD_CD_BYTE_SIZE_OFFSET = 12n;
const CD_START_OFFSET_OFFSET = 16n;
const ZIP64_EOCD_START_OFFSET_OFFSET = 8n;
const ZIP64_CD_RECORDS_NUMBER_OFFSET = 24n;
const ZIP64_CD_RECORDS_NUMBER_ON_DISC_OFFSET = 32n;
const ZIP64_CD_CD_BYTE_SIZE_OFFSET = 40n;
const ZIP64_CD_START_OFFSET_OFFSET = 48n;

/**
 * Parses end of central directory record of zip file
 * @param file - FileProvider instance
 * @returns Info from the header
 */
export const parseEoCDRecord = async (file: FileProvider): Promise<ZipEoCDRecord> => {
  const zipEoCDOffset = await searchFromTheEnd(file, eoCDSignature);

  let cdRecordsNumber = BigInt(await file.getUint16(zipEoCDOffset + CD_RECORDS_NUMBER_OFFSET));
  let cdStartOffset = BigInt(await file.getUint32(zipEoCDOffset + CD_START_OFFSET_OFFSET));

  let zip64EoCDLocatorOffset = zipEoCDOffset - 20n;
  let zip64EoCDOffset = 0n;

  const magicBytes = await file.slice(zip64EoCDLocatorOffset, zip64EoCDLocatorOffset + 4n);
  if (compareArrayBuffers(magicBytes, zip64EoCDLocatorSignature)) {
    zip64EoCDOffset = await file.getBigUint64(
      zip64EoCDLocatorOffset + ZIP64_EOCD_START_OFFSET_OFFSET
    );

    const endOfCDMagicBytes = await file.slice(zip64EoCDOffset, zip64EoCDOffset + 4n);
    if (!compareArrayBuffers(endOfCDMagicBytes, zip64EoCDSignature.buffer)) {
      throw new Error('zip64 EoCD not found');
    }

    cdRecordsNumber = await file.getBigUint64(zip64EoCDOffset + ZIP64_CD_RECORDS_NUMBER_OFFSET);
    cdStartOffset = await file.getBigUint64(zip64EoCDOffset + ZIP64_CD_START_OFFSET_OFFSET);
  } else {
    zip64EoCDLocatorOffset = 0n;
  }

  return {
    cdRecordsNumber,
    cdStartOffset,
    offsets: {
      zip64EoCDOffset,
      zip64EoCDLocatorOffset,
      zipEoCDOffset
    }
  };
};

/**
 * updates EoCD record to add more files to the archieve
 * @param eocdBody buffer containing header
 * @param oldEoCDOffsets info read from EoCD record befor updating
 * @param newCDStartOffset CD start offset to be updated
 * @param eocdStartOffset EoCD start offset to be updated
 * @returns new EoCD header
 */
export async function updateEoCD(
  eocdBody: ArrayBuffer,
  oldEoCDOffsets: ZipEoCDRecordOffsets,
  newCDStartOffset: bigint,
  eocdStartOffset: bigint,
  newCDRecordsNumber: bigint
): Promise<Uint8Array> {
  const eocd = new DataView(eocdBody);

  const classicEoCDOffset = oldEoCDOffsets.zipEoCDOffset - (oldEoCDOffsets.zip64EoCDOffset ?? 0n);

  // updating classic EoCD record with new CD records number in general and on disc
  if (Number(newCDRecordsNumber) <= 0xffff) {
    setFieldToNumber(eocd, 2, classicEoCDOffset + CD_RECORDS_NUMBER_OFFSET, newCDRecordsNumber);
    setFieldToNumber(
      eocd,
      2,
      classicEoCDOffset + CD_RECORDS_NUMBER_ON_DISC_OFFSET,
      newCDRecordsNumber
    );
  }

  // updating zip64 EoCD record with new size of CD
  if (eocdStartOffset - newCDStartOffset <= 0xffffffff) {
    setFieldToNumber(
      eocd,
      4,
      classicEoCDOffset + CD_CD_BYTE_SIZE_OFFSET,
      eocdStartOffset - newCDStartOffset
    );
  }

  // updating classic EoCD record with new CD start offset
  if (newCDStartOffset < 0xffffffff) {
    setFieldToNumber(eocd, 4, classicEoCDOffset + CD_START_OFFSET_OFFSET, newCDStartOffset);
  }

  // updating zip64 EoCD locator and record with new EoCD record start offset and cd records number
  if (oldEoCDOffsets.zip64EoCDLocatorOffset && oldEoCDOffsets.zip64EoCDOffset) {
    // updating zip64 EoCD locator with new EoCD record start offset
    const locatorOffset = oldEoCDOffsets.zip64EoCDLocatorOffset - oldEoCDOffsets.zip64EoCDOffset;
    setFieldToNumber(eocd, 8, locatorOffset + ZIP64_EOCD_START_OFFSET_OFFSET, eocdStartOffset);

    // updating zip64 EoCD record with new cd start offset
    setFieldToNumber(eocd, 8, ZIP64_CD_START_OFFSET_OFFSET, newCDStartOffset);

    // updating zip64 EoCD record with new cd records number
    setFieldToNumber(eocd, 8, ZIP64_CD_RECORDS_NUMBER_OFFSET, newCDRecordsNumber);
    setFieldToNumber(eocd, 8, ZIP64_CD_RECORDS_NUMBER_ON_DISC_OFFSET, newCDRecordsNumber);

    // updating zip64 EoCD record with new size of CD
    setFieldToNumber(eocd, 8, ZIP64_CD_CD_BYTE_SIZE_OFFSET, eocdStartOffset - newCDStartOffset);
  }

  return new Uint8Array(eocd.buffer);
}
