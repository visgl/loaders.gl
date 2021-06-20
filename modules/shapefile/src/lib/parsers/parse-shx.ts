import {parseSHPHeader} from './parse-shp-header';

export interface SHXOutput {
  offsets: Int32Array;
  lengths: Int32Array;
}

const SHX_HEADER_SIZE = 100;
const BIG_ENDIAN = false;

export function parseShx(arrayBuffer: ArrayBuffer): SHXOutput {
  // SHX header is identical to SHP Header
  const headerView = new DataView(arrayBuffer, 0, SHX_HEADER_SIZE);
  const header = parseSHPHeader(headerView);
  const contentLength = header.length - SHX_HEADER_SIZE;

  const contentView = new DataView(arrayBuffer, SHX_HEADER_SIZE, contentLength);

  const offsets = new Int32Array(contentLength);
  const lengths = new Int32Array(contentLength);

  for (let i = 0; i < contentLength / 8; i++) {
    offsets[i] = contentView.getInt32(i * 8, BIG_ENDIAN);
    lengths[i] = contentView.getInt32(i * 8 + 4, BIG_ENDIAN);
  }

  return {
    offsets,
    lengths
  };
}
