import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader} from './helpers/encode-3d-tile-header';
import {padStringToByteAlignment} from './helpers/encode-utils';

// Procedurally encode the tile array buffer for testing purposes
export function encodePointCloud3DTile(options = {}) {
  const DEFAULT_FEATURE_TABLE_JSON = {
    POINTS_LENGTH: 1,
    POSITIONS: {
      byteOffset: 0
    }
  };

  const {featureTableJson = DEFAULT_FEATURE_TABLE_JSON} = options;

  let featureTableJsonString = JSON.stringify(featureTableJson);
  featureTableJsonString = padStringToByteAlignment(featureTableJsonString, 4);
  const {featureTableJsonByteLength = featureTableJsonString.length} = options;

  const featureTableBinary = new ArrayBuffer(12); // Enough space to hold 3 floats
  const featureTableBinaryByteLength = featureTableBinary.byteLength;

  const headerByteLength = 28;
  const byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength;
  const buffer = new ArrayBuffer(byteLength);

  encode3DTileHeader(buffer, 0, {magic: MAGIC_ARRAY.POINT_CLOUD, ...options, byteLength});

  const view = new DataView(buffer);
  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, featureTableBinaryByteLength, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }
  for (let i = 0; i < featureTableBinaryByteLength; i++) {
    view.setUint8(byteOffset, featureTableBinary[i]);
    byteOffset++;
  }
  return buffer;
}
