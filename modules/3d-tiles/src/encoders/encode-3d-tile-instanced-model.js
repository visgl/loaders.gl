import {MAGIC_ARRAY} from '../constants';
import {encode3DTileHeader} from './helpers/encode-3d-tile-header';

// Procedurally encode the tile array buffer for testing purposes
export function encodeInstancedModel3DTile(options = {}) {
  const {featuresLength = 1, gltfFormat = 1, gltfUri = ''} = options;

  const gltfUriByteLength = gltfUri.length;

  const featureTableJson = {
    INSTANCES_LENGTH: featuresLength,
    POSITION: new Array(featuresLength * 3).fill(0)
  };
  const featureTableJsonString = JSON.stringify(featureTableJson);
  const featureTableJsonByteLength = featureTableJsonString.length;

  const headerByteLength = 32;
  const uriByteLength = gltfUri.length;
  const byteLength = headerByteLength + featureTableJsonByteLength + uriByteLength;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);

  encode3DTileHeader(buffer, 0, {magic: MAGIC_ARRAY.INSTANCED_MODEL, byteLength, ...options});

  view.setUint32(12, featureTableJsonByteLength, true); // featureTableJsonByteLength
  view.setUint32(16, 0, true); // featureTableBinaryByteLength
  view.setUint32(20, 0, true); // batchTableJsonByteLength
  view.setUint32(24, 0, true); // batchTableBinaryByteLength
  view.setUint32(28, gltfFormat, true); // gltfFormat

  let byteOffset = headerByteLength;
  for (let i = 0; i < featureTableJsonByteLength; i++) {
    view.setUint8(byteOffset, featureTableJsonString.charCodeAt(i));
    byteOffset++;
  }
  for (let i = 0; i < gltfUriByteLength; i++) {
    view.setUint8(byteOffset, gltfUri.charCodeAt(i));
    byteOffset++;
  }
  return buffer;
}
