export interface SHPHeader {
  /** SHP Magic number */
  magic: number;

  /** Number of bytes in file */
  length: number;
  version: number;
  type: number;
  bbox: {
    minX: number;
    minY: number;
    minZ: number;
    minM: number;
    maxX: number;
    maxY: number;
    maxZ: number;
    maxM: number;
  };
}

const LITTLE_ENDIAN = true;
const BIG_ENDIAN = false;
const SHP_MAGIC_NUMBER = 0x0000270a;

/**
 * Extract the binary header
 * Note: Also used by SHX
 */
export function parseSHPHeader(headerView: DataView): SHPHeader {
  // Note: The SHP format switches endianness between fields!
  // https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf
  const header = {
    magic: headerView.getInt32(0, BIG_ENDIAN),
    // Length is stored as # of 2-byte words; multiply by 2 to get # of bytes
    length: headerView.getInt32(24, BIG_ENDIAN) * 2,
    version: headerView.getInt32(28, LITTLE_ENDIAN),
    type: headerView.getInt32(32, LITTLE_ENDIAN),
    bbox: {
      minX: headerView.getFloat64(36, LITTLE_ENDIAN),
      minY: headerView.getFloat64(44, LITTLE_ENDIAN),
      minZ: headerView.getFloat64(68, LITTLE_ENDIAN),
      minM: headerView.getFloat64(84, LITTLE_ENDIAN),
      maxX: headerView.getFloat64(52, LITTLE_ENDIAN),
      maxY: headerView.getFloat64(60, LITTLE_ENDIAN),
      maxZ: headerView.getFloat64(76, LITTLE_ENDIAN),
      maxM: headerView.getFloat64(92, LITTLE_ENDIAN)
    }
  };
  if (header.magic !== SHP_MAGIC_NUMBER) {
    // eslint-disable-next-line
    console.error(`SHP file: bad magic number ${header.magic}`);
  }
  if (header.version !== 1000) {
    // eslint-disable-next-line
    console.error(`SHP file: bad version ${header.version}`);
  }
  return header;
}
