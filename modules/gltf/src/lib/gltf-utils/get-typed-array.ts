import type {TypedArray} from '@loaders.gl/schema';
import type {
  GLTF,
  GLTFExternalBuffer,
  GLTFImage,
  GLTFAccessor,
  GLTFBufferView
} from '../types/gltf-types';
import {getAccessorArrayTypeAndLength} from './gltf-utils';

/**
 * Gets data poined by the buffer view.
 * @param json - json part of gltf content of a GLTF tile.
 * @param buffers - Array containing buffers of data.
 * @param bufferView - Accepts buffer view index or buffer view object.
 * @returns {Uint8Array} Array with the data poined by the buffer view
 */
export function getTypedArrayForBufferView(
  json: GLTF,
  buffers: GLTFExternalBuffer[],
  bufferView: GLTFBufferView | number
): Uint8Array {
  const gltfBufferView =
    typeof bufferView === 'number' ? json.bufferViews?.[bufferView] : bufferView;
  if (!gltfBufferView) {
    throw new Error(`No bufferView ${bufferView}`);
  }
  // Get hold of the arrayBuffer
  const bufferIndex = gltfBufferView.buffer;
  const binChunk = buffers[bufferIndex];
  if (!binChunk) {
    throw new Error(`No bufferView ${bufferIndex}`);
  }
  const byteOffset = (gltfBufferView.byteOffset || 0) + binChunk.byteOffset;
  return new Uint8Array(binChunk.arrayBuffer, byteOffset, gltfBufferView.byteLength);
}

/**
 * Gets data from Image
 * @param json - json part of gltf content of a GLTF tile.
 * @param buffers - Array containing buffers of data.
 * @param image - Accepts image index or image object.
 * @returns {Uint8Array} Array with the data taken from the image
 */
export function getTypedArrayForImageData(
  json: GLTF,
  buffers: GLTFExternalBuffer[],
  image: GLTFImage | number
): Uint8Array {
  const gltfImage = typeof image === 'number' ? json.images?.[image] : image;
  if (!gltfImage) {
    throw new Error(`No Image ${image}`);
  }
  if (typeof gltfImage.bufferView !== 'number') {
    throw new Error(`No Buffer View for Image ${gltfImage.bufferView}`);
  }

  const bufferViewIndex = json.bufferViews?.[gltfImage.bufferView];
  if (typeof bufferViewIndex !== 'number') {
    throw new Error(`No Buffer View ${bufferViewIndex}`);
  }
  return getTypedArrayForBufferView(json, buffers, bufferViewIndex);
}

/**
 * Gets data pointed by the accessor.
 * @param json - json part of gltf content of a GLTF tile.
 * @param buffers - Array containing buffers of data.
 * @param accessorIndex - accepts accessor index or accessor object.
 * @returns {TypedArray} Typed array with type that matches the types.
 */
// eslint-disable-next-line complexity
export function getTypedArrayForAccessor(
  json: GLTF,
  buffers: GLTFExternalBuffer[],
  accessor: GLTFAccessor | number
): TypedArray {
  const gltfAccessor = typeof accessor === 'number' ? json.accessors?.[accessor] : accessor;
  if (!gltfAccessor) {
    throw new Error(`No Accessor ${accessor}`);
  }
  if (typeof gltfAccessor.bufferView !== 'number') {
    throw new Error(`No bufferView index ${gltfAccessor.bufferView}`);
  }
  const bufferView = json.bufferViews?.[gltfAccessor.bufferView];
  if (!bufferView) {
    throw new Error(`No Buffer View for Accessor ${bufferView}`);
  }
  // Get `arrayBuffer` the `bufferView` looks at
  const {arrayBuffer, byteOffset: bufferByteOffset} = buffers[bufferView.buffer];
  // Resulting byteOffset is sum of the buffer, accessor and bufferView byte offsets
  const byteOffset =
    (bufferByteOffset || 0) + (gltfAccessor.byteOffset || 0) + (bufferView.byteOffset || 0);
  // Deduce TypedArray type and its length from `accessor` and `bufferView` data
  const {ArrayType, length, componentByteSize, numberOfComponentsInElement} =
    getAccessorArrayTypeAndLength(gltfAccessor, bufferView);
  // 'length' is a whole number of components of all elements in the buffer pointed by the accessor
  // Multiplier to calculate the address of the element in the arrayBuffer
  const elementByteSize = componentByteSize * numberOfComponentsInElement;
  const elementAddressScale = bufferView.byteStride || elementByteSize;
  // Creare an array of component's type where all components (not just elements) will reside
  if (typeof bufferView.byteStride === 'undefined' || bufferView.byteStride === elementByteSize) {
    // No iterleaving
    const result: TypedArray = new ArrayType(arrayBuffer, byteOffset, length);
    return result;
  }
  // Iterleaving
  const result: TypedArray = new ArrayType(length);
  for (let i = 0; i < gltfAccessor.count; i++) {
    const values = new ArrayType(
      arrayBuffer,
      byteOffset + i * elementAddressScale,
      numberOfComponentsInElement
    );
    result.set(values, i * numberOfComponentsInElement);
  }
  return result;
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
