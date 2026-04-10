// TODO - GLTFScenegraph should use these
import {assert} from '../utils/assert';
import type {TypedArray} from '@loaders.gl/schema';
import type {GLTF, GLTFExternalBuffer, GLTFAccessor} from '../types/gltf-types';
import {getAccessorArrayTypeAndLength} from './gltf-utils';

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

/**
 * Gets data pointed by the accessor.
 * @param json - json part of gltf content of a GLTF tile.
 * @param buffers - Array containing buffers of data.
 * @param accessor - accepts accessor index or accessor object.
 * @returns {TypedArray} Typed array with type matching the type of data poited by the accessor.
 */
// eslint-disable-next-line complexity
export function getTypedArrayForAccessor(
  json: GLTF,
  buffers: GLTFExternalBuffer[],
  accessor: GLTFAccessor | number
): TypedArray {
  const gltfAccessor = typeof accessor === 'number' ? json.accessors?.[accessor] : accessor;
  if (!gltfAccessor) {
    throw new Error(`No gltf accessor ${JSON.stringify(accessor)}`);
  }
  const bufferView = json.bufferViews?.[gltfAccessor.bufferView || 0];
  if (!bufferView) {
    throw new Error(`No gltf buffer view for accessor ${bufferView}`);
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
