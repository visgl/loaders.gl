// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  FileProviderInterface,
  compareArrayBuffers,
  concatenateArrayBuffers
} from '@loaders.gl/loader-utils';
import {ZipSignature, searchFromTheEnd} from './search-from-the-end';
import {setFieldToNumber} from './zip64-info-generation';

/**
 * End of central directory info
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipEoCDRecord = {
  /** Relative offset of cd start */
  cdStartOffset: bigint;
  /** Total number of central directory records */
  cdRecordsNumber: bigint;
  /** Size of central directory */
  cdByteSize: bigint;
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

/**
 * Data to generate End of central directory record
 * according to https://en.wikipedia.org/wiki/ZIP_(file_format)
 */
export type ZipEoCDGenerationOptions = {
  recordsNumber: number;
  cdSize: number;
  cdOffset: bigint;
  eoCDStart: bigint;
};

const eoCDSignature: ZipSignature = new Uint8Array([0x50, 0x4b, 0x05, 0x06]);
const zip64EoCDLocatorSignature = new Uint8Array([0x50, 0x4b, 0x06, 0x07]);
const zip64EoCDSignature = new Uint8Array([0x50, 0x4b, 0x06, 0x06]);

// offsets accroding to https://en.wikipedia.org/wiki/ZIP_(file_format)
const CD_RECORDS_NUMBER_OFFSET = 8n;
const CD_RECORDS_NUMBER_ON_DISC_OFFSET = 10n;
const CD_CD_BYTE_SIZE_OFFSET = 12n;
const CD_START_OFFSET_OFFSET = 16n;
const CD_COMMENT_OFFSET = 22n;
const ZIP64_EOCD_START_OFFSET_OFFSET = 8n;
const ZIP64_CD_RECORDS_NUMBER_OFFSET = 24n;
const ZIP64_CD_RECORDS_NUMBER_ON_DISC_OFFSET = 32n;
const ZIP64_CD_CD_BYTE_SIZE_OFFSET = 40n;
const ZIP64_CD_START_OFFSET_OFFSET = 48n;
const ZIP64_COMMENT_OFFSET = 56n;

/**
 * Parses end of central directory record of zip file
 * @param file - FileProvider instance
 * @returns Info from the header
 */
export const parseEoCDRecord = async (file: FileProviderInterface): Promise<ZipEoCDRecord> => {
  const zipEoCDOffset = await searchFromTheEnd(file, eoCDSignature);

  let cdRecordsNumber = BigInt(await file.getUint16(zipEoCDOffset + CD_RECORDS_NUMBER_OFFSET));
  let cdByteSize = BigInt(await file.getUint32(zipEoCDOffset + CD_CD_BYTE_SIZE_OFFSET));
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
    cdByteSize = await file.getBigUint64(zip64EoCDOffset + ZIP64_CD_CD_BYTE_SIZE_OFFSET);
    cdStartOffset = await file.getBigUint64(zip64EoCDOffset + ZIP64_CD_START_OFFSET_OFFSET);
  } else {
    zip64EoCDLocatorOffset = 0n;
  }

  return {
    cdRecordsNumber,
    cdStartOffset,
    cdByteSize,
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
export function updateEoCD(
  eocdBody: ArrayBuffer,
  oldEoCDOffsets: ZipEoCDRecordOffsets,
  newCDStartOffset: bigint,
  eocdStartOffset: bigint,
  newCDRecordsNumber: bigint
): Uint8Array {
  const eocd = new DataView(eocdBody);

  const classicEoCDOffset = oldEoCDOffsets.zip64EoCDOffset
    ? oldEoCDOffsets.zipEoCDOffset - oldEoCDOffsets.zip64EoCDOffset
    : 0n;

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

/**
 * generates EoCD record
 * @param options data to generate EoCD record
 * @returns ArrayBuffer with EoCD record
 */
export function generateEoCD(options: ZipEoCDGenerationOptions): ArrayBuffer {
  const header = new DataView(new ArrayBuffer(Number(CD_COMMENT_OFFSET)));

  for (const field of EOCD_FIELDS) {
    setFieldToNumber(
      header,
      field.size,
      field.offset,
      options[field.name ?? ''] ?? field.default ?? 0
    );
  }
  const locator = generateZip64InfoLocator(options);

  const zip64Record = generateZip64Info(options);

  return concatenateArrayBuffers(zip64Record, locator, header.buffer);
}

/** standart EoCD fields */
const EOCD_FIELDS = [
  // End of central directory signature = 0x06054b50
  {
    offset: 0,
    size: 4,
    default: new DataView(eoCDSignature.buffer).getUint32(0, true)
  },

  // Number of this disk (or 0xffff for ZIP64)
  {
    offset: 4,
    size: 2,
    default: 0
  },

  // Disk where central directory starts (or 0xffff for ZIP64)
  {
    offset: 6,
    size: 2,
    default: 0
  },

  // Number of central directory records on this disk (or 0xffff for ZIP64)
  {
    offset: 8,
    size: 2,
    name: 'recordsNumber'
  },

  // Total number of central directory records (or 0xffff for ZIP64)
  {
    offset: 10,
    size: 2,
    name: 'recordsNumber'
  },

  // Size of central directory (bytes) (or 0xffffffff for ZIP64)
  {
    offset: 12,
    size: 4,
    name: 'cdSize'
  },

  // Offset of start of central directory, relative to start of archive (or 0xffffffff for ZIP64)
  {
    offset: 16,
    size: 4,
    name: 'cdOffset'
  },

  // Comment length (n)
  {
    offset: 20,
    size: 2,
    default: 0
  }
];

/**
 * generates eocd zip64 record
 * @param options data to generate eocd zip64 record
 * @returns buffer with eocd zip64 record
 */
function generateZip64Info(options: ZipEoCDGenerationOptions): ArrayBuffer {
  const record = new DataView(new ArrayBuffer(Number(ZIP64_COMMENT_OFFSET)));
  for (const field of ZIP64_EOCD_FIELDS) {
    setFieldToNumber(
      record,
      field.size,
      field.offset,
      options[field.name ?? ''] ?? field.default ?? 0
    );
  }

  return record.buffer;
}

/**
 * generates eocd zip64 record locator
 * @param options data to generate eocd zip64 record
 * @returns buffer with eocd zip64 record
 */
function generateZip64InfoLocator(options: ZipEoCDGenerationOptions): ArrayBuffer {
  const locator = new DataView(new ArrayBuffer(Number(20)));

  for (const field of ZIP64_EOCD_LOCATOR_FIELDS) {
    setFieldToNumber(
      locator,
      field.size,
      field.offset,
      options[field.name ?? ''] ?? field.default ?? 0
    );
  }

  return locator.buffer;
}

/** zip64 EoCD record locater fields */
const ZIP64_EOCD_LOCATOR_FIELDS = [
  // zip64 end of central dir locator signature
  {
    offset: 0,
    size: 4,
    default: new DataView(zip64EoCDLocatorSignature.buffer).getUint32(0, true)
  },

  // number of the disk with the start of the zip64 end of
  {
    offset: 4,
    size: 4,
    default: 0
  },

  // start of the zip64 end of central directory
  {
    offset: 8,
    size: 8,
    name: 'eoCDStart'
  },

  // total number of disks
  {
    offset: 16,
    size: 4,
    default: 1
  }
];

/** zip64 EoCD recodrd fields */
const ZIP64_EOCD_FIELDS = [
  // End of central directory signature = 0x06064b50
  {
    offset: 0,
    size: 4,
    default: new DataView(zip64EoCDSignature.buffer).getUint32(0, true)
  },

  // Size of the EOCD64 minus 12
  {
    offset: 4,
    size: 8,
    default: 44
  },

  // Version made by
  {
    offset: 12,
    size: 2,
    default: 45
  },

  // Version needed to extract (minimum)
  {
    offset: 14,
    size: 2,
    default: 45
  },

  // Number of this disk
  {
    offset: 16,
    size: 4,
    default: 0
  },

  // Disk where central directory starts
  {
    offset: 20,
    size: 4,
    default: 0
  },

  // Number of central directory records on this disk
  {
    offset: 24,
    size: 8,
    name: 'recordsNumber'
  },

  // Total number of central directory records
  {
    offset: 32,
    size: 8,
    name: 'recordsNumber'
  },

  // Size of central directory (bytes)
  {
    offset: 40,
    size: 8,
    name: 'cdSize'
  },

  // Offset of start of central directory, relative to start of archive
  {
    offset: 48,
    size: 8,
    name: 'cdOffset'
  }
];
