export const signature = new Uint8Array([0x01, 0x00]);

/** info that can be placed into zip64 field */
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
export const createZip64Info = (options: Zip64Options): ArrayBuffer => {
  const optionsToUse = {
    ...options,
    zip64Length: (options.offset ? 1 : 0) * 8 + (options.size ? 1 : 0) * 16
  };

  let result = new ArrayBuffer(0);

  zip64Fields.forEach((field) => {
    if (!optionsToUse[field.name ?? ''] && !field.default) {
      return;
    }
    const newValue = new DataView(new ArrayBuffer(field.size));
    setNumbers[field.size](newValue, 0, optionsToUse[field.name ?? ''] ?? field.default);
    result = concatArrays(result, newValue.buffer);
  });

  return result;
};

/**
 * concats two ArrayBuffers
 * @param arr1 first array to concat
 * @param arr2 second array to concat
 * @returns concated array
 */
export const concatArrays = (arr1: ArrayBuffer, arr2: ArrayBuffer): ArrayBuffer => {
  const resHeader = new Uint8Array(arr1.byteLength + arr2.byteLength);
  resHeader.set(new Uint8Array(arr1));
  resHeader.set(new Uint8Array(arr2), arr1.byteLength);
  return resHeader.buffer;
};
/**
 * Function to write values into buffer
 * @param header buffer where to write a value
 * @param offset offset of the writing start
 * @param value value to be written
 */
type NumberSetter = (header: DataView, offset: number, value: number) => void;

/** functions to write values into buffer according to the bytes amount */
export const setNumbers: {[key: number]: NumberSetter} = {
  2: (header, offset, value) => {
    header.setUint16(offset, value, true);
  },
  4: (header, offset, value) => {
    header.setUint32(offset, value, true);
  },
  8: (header, offset, value) => {
    header.setBigUint64(offset, BigInt(value), true);
  }
};

/** Fields map */
const zip64Fields = [
  {
    size: 2,
    description: 'Header ID 0x0001',
    default: new DataView(signature.buffer).getUint16(0, true)
  },
  {
    size: 2,
    description: 'Size of the extra field chunk (8, 16, 24 or 28)',
    name: 'zip64Length'
  },
  {
    size: 8,
    description: 'Original uncompressed file size',
    name: 'size'
  },
  {
    size: 8,
    description: 'Size of compressed data',
    name: 'size'
  },
  {
    size: 8,
    description: 'Offset of local header record',
    name: 'offset'
  }
];
