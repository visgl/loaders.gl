import {parseHeader, BIG_ENDIAN} from './util';
// var {readFileSync} = require('fs');
// var path = '../../shp/PADUS2_0CO_Shapefile/PADUS2_0Proclamation_CO.shx';
// var arrayBuffer = readFileSync(path).buffer;
// readFileSync(path).length;

const SHX_HEADER_SIZE = 100;

export function parseShx(arrayBuffer) {
  const headerView = new DataView(arrayBuffer, 0, SHX_HEADER_SIZE);
  const header = parseHeader(headerView);
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
