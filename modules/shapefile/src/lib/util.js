export const LITTLE_ENDIAN = true;
export const BIG_ENDIAN = false;

export function parseHeader(header) {
  return {
    // Length is stored as # of 2-byte words; multiply by 2 to get # of bytes
    length: header.getInt32(24, BIG_ENDIAN) * 2,
    type: header.getInt32(32, LITTLE_ENDIAN),
    bbox: {
      minX: header.getFloat64(36, LITTLE_ENDIAN),
      minY: header.getFloat64(44, LITTLE_ENDIAN),
      minZ: header.getFloat64(68, LITTLE_ENDIAN),
      minM: header.getFloat64(84, LITTLE_ENDIAN),
      maxX: header.getFloat64(52, LITTLE_ENDIAN),
      maxY: header.getFloat64(60, LITTLE_ENDIAN),
      maxZ: header.getFloat64(76, LITTLE_ENDIAN),
      maxM: header.getFloat64(92, LITTLE_ENDIAN)
    }
  };
}
