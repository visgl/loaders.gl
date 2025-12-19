import {concatenateArrayBuffers} from '@loaders.gl/loader-utils';

export const signature = new Uint8Array([0x01, 0x00]);

/** info that can be placed into zip64 field, doc: https://en.wikipedia.org/wiki/ZIP_(file_format)#ZIP64 */
type Zip64Options = {
  /** Original uncompressed file size and Size of compressed data */
  size?: number;
  /** Offset of local header record */
  offset?: number;
};

/**
 * creates zip64 extra field
 * @param options info that can be placed into zip64 field
 * @returns buffer with field
 */
export function createZip64Info(options: Zip64Options): ArrayBuffer {
  const optionsToUse = {
    ...options,
    zip64Length: (options.offset ? 1 : 0) * 8 + (options.size ? 1 : 0) * 16
  };

  const arraysToConcat: ArrayBuffer[] = [];

  for (const field of ZIP64_FIELDS) {
    if (!optionsToUse[field.name ?? ''] && !field.default) {
      continue; // eslint-disable-line no-continue
    }
    const newValue = new DataView(new ArrayBuffer(field.size));
    NUMBER_SETTERS[field.size](newValue, 0, optionsToUse[field.name ?? ''] ?? field.default);
    arraysToConcat.push(newValue.buffer);
  }

  return concatenateArrayBuffers(...arraysToConcat);
}

/**
 * Function to write values into buffer
 * @param header buffer where to write a value
 * @param offset offset of the writing start
 * @param value value to be written
 */
type NumberSetter = (header: DataView, offset: number, value: number | bigint) => void;

/**
 * Writes values into buffer according to the bytes amount
 * @param header header where to write the data
 * @param fieldSize size of the field in bytes
 * @param fieldOffset offset of the field
 * @param value value to be written
 */
export function setFieldToNumber(
  header: DataView,
  fieldSize: number,
  fieldOffset: number | bigint,
  value: number | bigint
): void {
  NUMBER_SETTERS[fieldSize](header, Number(fieldOffset), value);
}

/** functions to write values into buffer according to the bytes amount */
const NUMBER_SETTERS: {[key: number]: NumberSetter} = {
  2: (header, offset, value) => {
    header.setUint16(offset, Number(value > 0xffff ? 0xffff : value), true);
  },
  4: (header, offset, value) => {
    header.setUint32(offset, Number(value > 0xffffffff ? 0xffffffff : value), true);
  },
  8: (header, offset, value) => {
    header.setBigUint64(offset, BigInt(value), true);
  }
};

/** zip64 info fields description, we need it as a pattern to build a zip64 info */
const ZIP64_FIELDS = [
  // Header ID 0x0001
  {
    size: 2,
    default: new DataView(signature.buffer).getUint16(0, true)
  },

  // Size of the extra field chunk (8, 16, 24 or 28)
  {
    size: 2,
    name: 'zip64Length'
  },

  // Original uncompressed file size
  {
    size: 8,
    name: 'size'
  },

  // Size of compressed data
  {
    size: 8,
    name: 'size'
  },

  // Offset of local header record
  {
    size: 8,
    name: 'offset'
  }
];
