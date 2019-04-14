import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader} from './helpers/encode-3d-tile-header';

// Procedurally encode the tile array buffer for testing purposes
export function encodeBatchedModel3DTile(options = {}) {
  const {featuresLength = 1} = options;

  const featureTableJson = {
    BATCH_LENGTH: featuresLength
  };
  const featureTableJsonString = JSON.stringify(featureTableJson);
  const featureTableJsonByteLength = featureTableJsonString.length;

  const headerByteLength = 28;
  const byteLength = headerByteLength + featureTableJsonByteLength;

  const buffer = new ArrayBuffer(byteLength);

  encode3DTileHeader(buffer, 0, {magic: MAGIC_ARRAY.BATCHED_MODEL, byteLength, ...options});

  const view = new DataView(buffer);

  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, 0, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }

  return buffer;
}
