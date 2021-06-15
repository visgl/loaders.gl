// TODO - GLTFScenegraph should use these
import {assert} from '../utils/assert';

// accepts buffer view index or buffer view object
// returns a `Uint8Array`
export function getTypedArrayForBufferView(json, buffers, bufferViewIndex) {
  const bufferView = json.bufferViews[bufferViewIndex];
  assert(bufferView);

  // Get hold of the arrayBuffer
  const bufferIndex = bufferView.buffer;
  const binChunk = buffers[bufferIndex];
  assert(binChunk);

  const byteOffset = (bufferView.byteOffset || 0) + binChunk.byteOffset;
  return new Uint8Array(binChunk.arrayBuffer, byteOffset, bufferView.byteLength);
}

// accepts accessor index or accessor object
// returns a `Uint8Array`
export function getTypedArrayForImageData(json, buffers, imageIndex) {
  const image = json.images[imageIndex];
  const bufferViewIndex = json.bufferViews[image.bufferView];
  return getTypedArrayForBufferView(json, buffers, bufferViewIndex);
}

/*
// accepts accessor index or accessor object
// returns a typed array with type that matches the types
export function getTypedArrayForAccessor(accessor) {
  accessor = this.getAccessor(accessor);
  const bufferView = this.getBufferView(accessor.bufferView);
  const buffer = this.getBuffer(bufferView.buffer);
  const arrayBuffer = buffer.data;

  // Create a new typed array as a view into the combined buffer
  const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, bufferView);
  const byteOffset = bufferView.byteOffset + accessor.byteOffset;
  return new ArrayType(arrayBuffer, byteOffset, length);
}
*/
