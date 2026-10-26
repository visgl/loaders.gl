// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TODO - GLTFScenegraph should use these
import {assert} from '../utils/assert';
import {padToNBytes} from '@loaders.gl/core/loader-utils';
import type {BigTypedArray} from '@loaders.gl/core/schema';
import type {GLTF, GLTFExternalBuffer, GLTFAccessor} from '../types/gltf-types';
import {getAccessorArrayTypeAndLength} from './gltf-utils';

// accepts buffer view index or buffer view object
// returns a `Uint8Array`
export function getTypedArrayForBufferView(json, buffers, bufferViewIndex) {
  const bufferView =
    typeof bufferViewIndex === 'number' ? json.bufferViews[bufferViewIndex] : bufferViewIndex;
  assert(bufferView);

  // Get hold of the arrayBuffer
  const bufferIndex = bufferView.buffer;
  const binChunk = buffers[bufferIndex];
  assert(binChunk);

  assert((bufferView.byteOffset || 0) >= 0 && bufferView.byteLength >= 0);
  assert((bufferView.byteOffset || 0) + bufferView.byteLength <= binChunk.byteLength);
  assert(
    binChunk.byteOffset >= 0 &&
      binChunk.byteOffset + binChunk.byteLength <= binChunk.arrayBuffer.byteLength
  );
  const byteOffset = (bufferView.byteOffset || 0) + binChunk.byteOffset;
  return new Uint8Array(binChunk.arrayBuffer, byteOffset, bufferView.byteLength);
}

// accepts accessor index or accessor object
// returns a `Uint8Array`
export function getTypedArrayForImageData(json, buffers, imageIndex) {
  const image = json.images[imageIndex];
  return getTypedArrayForBufferView(json, buffers, image.bufferView);
}

/**
 * Gets data pointed by the accessor.
 * @param json - json part of gltf content of a GLTF tile.
 * @param buffers - Array containing buffers of data.
 * @param accessor - accepts accessor index or accessor object.
 * @returns Typed array with type matching the accessor component type.
 */
// eslint-disable-next-line complexity
export function getTypedArrayForAccessor(
  json: GLTF,
  buffers: GLTFExternalBuffer[],
  accessor: GLTFAccessor | number
): BigTypedArray {
  const gltfAccessor = typeof accessor === 'number' ? json.accessors?.[accessor] : accessor;
  if (!gltfAccessor) {
    throw new Error(`No gltf accessor ${JSON.stringify(accessor)}`);
  }
  assert(Number.isSafeInteger(gltfAccessor.count) && gltfAccessor.count >= 0);
  const {ArrayType, length, numberOfComponentsInElement} = getAccessorArrayTypeAndLength(
    gltfAccessor,
    {byteLength: Infinity}
  );
  const decodedValue = (gltfAccessor as GLTFAccessor & {value?: BigTypedArray}).value;
  let result: BigTypedArray;
  if (ArrayBuffer.isView(decodedValue)) {
    assert(decodedValue.length === length);
    result = decodedValue;
  } else if (gltfAccessor.bufferView === undefined) {
    result = new ArrayType(length);
  } else {
    result = readAccessorValues(json, buffers, gltfAccessor);
  }
  const sparse = gltfAccessor.sparse;
  if (!sparse) return result;
  // Sparse substitutions must never mutate borrowed buffers or decoder-owned arrays.
  const copiedValue: BigTypedArray = new ArrayType(length);
  new Uint8Array(copiedValue.buffer).set(
    new Uint8Array(result.buffer, result.byteOffset, result.byteLength)
  );
  assert(sparse.count >= 0 && sparse.count <= gltfAccessor.count);
  assert([5121, 5123, 5125].includes(sparse.indices.componentType));
  const indices = readAccessorValues(json, buffers, {
    bufferView: sparse.indices.bufferView,
    byteOffset: sparse.indices.byteOffset,
    componentType: sparse.indices.componentType,
    count: sparse.count,
    type: 'SCALAR'
  });
  const values = readAccessorValues(json, buffers, {
    bufferView: sparse.values.bufferView,
    byteOffset: sparse.values.byteOffset,
    componentType: gltfAccessor.componentType,
    count: sparse.count,
    type: gltfAccessor.type
  });
  let previousIndex = -1;
  const copiedBytes = new Uint8Array(copiedValue.buffer);
  const elementByteLength = numberOfComponentsInElement * ArrayType.BYTES_PER_ELEMENT;
  const valueBytes = new Uint8Array(values.buffer, values.byteOffset, values.byteLength);
  for (let sparseIndex = 0; sparseIndex < sparse.count; sparseIndex++) {
    const index = Number(indices[sparseIndex]);
    assert(index > previousIndex && index < gltfAccessor.count);
    copiedBytes.set(
      valueBytes.subarray(sparseIndex * elementByteLength, (sparseIndex + 1) * elementByteLength),
      index * elementByteLength
    );
    previousIndex = index;
  }
  return copiedValue;
}

/** Read dense values, respecting buffer-view ranges, interleaving and matrix column padding. */
function readAccessorValues(
  json: GLTF,
  buffers: GLTFExternalBuffer[],
  gltfAccessor: GLTFAccessor
): BigTypedArray {
  const bufferView = json.bufferViews?.[gltfAccessor.bufferView!];
  if (!bufferView) {
    throw new Error(`No gltf buffer view for accessor ${bufferView}`);
  }
  // Get `arrayBuffer` the `bufferView` looks at
  const externalBuffer = buffers[bufferView.buffer];
  assert(externalBuffer);
  const {arrayBuffer, byteOffset: bufferByteOffset} = externalBuffer;
  assert((bufferView.byteOffset || 0) >= 0 && bufferView.byteLength >= 0);
  assert((bufferView.byteOffset || 0) + bufferView.byteLength <= externalBuffer.byteLength);
  assert(
    bufferByteOffset >= 0 && bufferByteOffset + externalBuffer.byteLength <= arrayBuffer.byteLength
  );
  assert((gltfAccessor.byteOffset || 0) >= 0);
  // Resulting byteOffset is sum of the buffer, accessor and bufferView byte offsets
  const byteOffset =
    (bufferByteOffset || 0) + (gltfAccessor.byteOffset || 0) + (bufferView.byteOffset || 0);
  // Deduce TypedArray type and its length from `accessor` and `bufferView` data
  const {ArrayType, length, componentByteSize, numberOfComponentsInElement} =
    getAccessorArrayTypeAndLength(gltfAccessor, bufferView);
  // 'length' is a whole number of components of all elements in the buffer pointed by the accessor
  // Multiplier to calculate the address of the element in the arrayBuffer
  const elementByteSize = componentByteSize * numberOfComponentsInElement;
  const matrixColumns = gltfAccessor.type.startsWith('MAT')
    ? Number(gltfAccessor.type.slice(3))
    : 1;
  const matrixColumnByteSize = padToNBytes(matrixColumns * componentByteSize, 4);
  const packedElementByteSize =
    matrixColumns > 1 ? matrixColumns * matrixColumnByteSize : elementByteSize;
  const elementStride = bufferView.byteStride ?? packedElementByteSize;
  const lastElementByteSize =
    matrixColumns > 1
      ? (matrixColumns - 1) * matrixColumnByteSize + matrixColumns * componentByteSize
      : elementByteSize;
  assert(elementStride >= packedElementByteSize);
  assert(
    (gltfAccessor.byteOffset || 0) +
      (gltfAccessor.count === 0
        ? 0
        : (gltfAccessor.count - 1) * elementStride + lastElementByteSize) <=
      bufferView.byteLength
  );
  if (gltfAccessor.count === 0) return new ArrayType(0);
  if (matrixColumns > 1 && matrixColumnByteSize !== matrixColumns * componentByteSize) {
    const elementStride = bufferView.byteStride ?? matrixColumns * matrixColumnByteSize;
    const lastElementSize =
      (matrixColumns - 1) * matrixColumnByteSize + matrixColumns * componentByteSize;
    assert(
      (gltfAccessor.byteOffset || 0) + (gltfAccessor.count - 1) * elementStride + lastElementSize <=
        bufferView.byteLength
    );
    const result: BigTypedArray = new ArrayType(length);
    const outputBytes = new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
    for (let elementIndex = 0; elementIndex < gltfAccessor.count; elementIndex++) {
      for (let columnIndex = 0; columnIndex < matrixColumns; columnIndex++) {
        const columnBytes = new Uint8Array(
          arrayBuffer,
          byteOffset + elementIndex * elementStride + columnIndex * matrixColumnByteSize,
          matrixColumns * componentByteSize
        );
        outputBytes.set(
          columnBytes,
          elementIndex * elementByteSize + columnIndex * matrixColumns * componentByteSize
        );
      }
    }
    return result;
  }
  const elementAddressScale = bufferView.byteStride || elementByteSize;
  // Creare an array of component's type where all components (not just elements) will reside
  if (typeof bufferView.byteStride === 'undefined' || bufferView.byteStride === elementByteSize) {
    // No iterleaving
    if (byteOffset % componentByteSize !== 0) {
      const bytes = new Uint8Array(arrayBuffer, byteOffset, length * componentByteSize);
      const alignedBytes = new Uint8Array(bytes.byteLength);
      alignedBytes.set(bytes);
      return new ArrayType(alignedBytes.buffer, 0, length);
    }
    const result: BigTypedArray = new ArrayType(arrayBuffer, byteOffset, length);
    return result;
  }
  // Iterleaving
  const result: BigTypedArray = new ArrayType(length);
  for (let i = 0; i < gltfAccessor.count; i++) {
    const elementByteOffset = byteOffset + i * elementAddressScale;
    let values: any;
    if (elementByteOffset % componentByteSize !== 0) {
      const bytes = new Uint8Array(arrayBuffer, elementByteOffset, elementByteSize);
      const alignedBytes = new Uint8Array(elementByteSize);
      alignedBytes.set(bytes);
      values = new ArrayType(alignedBytes.buffer, 0, numberOfComponentsInElement);
    } else {
      values = new ArrayType(arrayBuffer, elementByteOffset, numberOfComponentsInElement);
    }
    result.set(values, i * numberOfComponentsInElement);
  }
  return result;
}
