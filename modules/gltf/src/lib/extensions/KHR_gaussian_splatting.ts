// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

/* eslint-disable camelcase */

import type {GLTF, GLTFMeshPrimitive} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import {GLTFIterator} from '../api/gltf-iterator';
import type {
  GLTFGaussianSplatPrimitive,
  GLTF_KHR_gaussian_splatting
} from '../types/gltf-ext-gaussian-splatting-schema';

/** Name of the ratified Gaussian splatting glTF extension. */
export const name = 'KHR_gaussian_splatting';

/** Name of the draft SPZ2 compression companion extension. */
export const SPZ_COMPRESSION_EXTENSION_NAME = 'KHR_gaussian_splatting_compression_spz_2';

const REQUIRED_ATTRIBUTES = [
  'POSITION',
  'KHR_gaussian_splatting:ROTATION',
  'KHR_gaussian_splatting:SCALE',
  'KHR_gaussian_splatting:OPACITY',
  'KHR_gaussian_splatting:SH_DEGREE_0_COEF_0'
] as const;

/** Validates Gaussian splat primitives while preserving all source JSON. */
export async function decode(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions): Promise<void> {
  const descriptors = getGaussianSplatPrimitives(gltfData);
  const iterator = new GLTFIterator(gltfData);
  for (const [meshIndex, mesh] of (gltfData.json.meshes || []).entries()) {
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const extension = primitive.extensions?.[name] as GLTF_KHR_gaussian_splatting | undefined;
      if (!extension) continue;
      validateGaussianSplatPrimitive(
        gltfData.json,
        primitive,
        extension,
        meshIndex,
        primitiveIndex,
        iterator
      );
      const compression = extension.extensions?.[SPZ_COMPRESSION_EXTENSION_NAME];
      if (compression) {
        const descriptor = descriptors.find(
          item => item.meshIndex === meshIndex && item.primitiveIndex === primitiveIndex
        );
        if (descriptor) {
          const decoder = options?.gltf?.splatDecoder;
          const bufferView = gltfData.json.bufferViews?.[compression.bufferView];
          if (bufferView && gltfData.buffers[bufferView.buffer]) {
            descriptor.compressedBytes = getBufferViewBytes(gltfData, compression.bufferView);
          } else if (decoder) {
            throw new Error(
              `KHR_gaussian_splatting: bufferView ${compression.bufferView} is not loaded for SPZ2 decoding.`
            );
          }
          if (decoder && descriptor.compressedBytes) {
            descriptor.decoded = await decoder(descriptor.compressedBytes.buffer, {
              sourceCoordinateSystem: 'LUF'
            });
          }
        }
      }
    }
  }
  if (descriptors.length) {
    gltfData.gaussianSplatPrimitives = descriptors;
  }
}

/** Returns a copied buffer-view payload so applications can retain compressed bytes safely. */
function getBufferViewBytes(gltfData: GLTFWithBuffers, bufferViewIndex: number): Uint8Array {
  const bufferView = gltfData.json.bufferViews?.[bufferViewIndex];
  if (!bufferView) {
    throw new Error(`KHR_gaussian_splatting: bufferView ${bufferViewIndex} is not defined.`);
  }
  const buffer = gltfData.buffers[bufferView.buffer];
  if (!buffer) {
    throw new Error(
      `KHR_gaussian_splatting: buffer ${bufferView.buffer} is not loaded for SPZ2 payload.`
    );
  }
  const byteOffset = buffer.byteOffset + (bufferView.byteOffset || 0);
  return new Uint8Array(buffer.arrayBuffer, byteOffset, bufferView.byteLength).slice();
}

/** Returns normalized Gaussian splat primitive descriptors without mutating the glTF. */
export function getGaussianSplatPrimitives(
  gltf: GLTF | GLTFWithBuffers
): GLTFGaussianSplatPrimitive[] {
  const json: GLTF = 'json' in gltf ? (gltf as GLTFWithBuffers).json : (gltf as GLTF);
  const descriptors: GLTFGaussianSplatPrimitive[] = [];
  for (const [meshIndex, mesh] of (json.meshes || []).entries()) {
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const extension = primitive.extensions?.[name] as GLTF_KHR_gaussian_splatting | undefined;
      if (!extension) continue;
      const compressedBufferView =
        extension.extensions?.[SPZ_COMPRESSION_EXTENSION_NAME]?.bufferView;
      descriptors.push({
        meshIndex,
        primitiveIndex,
        attributes: {...primitive.attributes},
        extension,
        compressedBufferView
      });
    }
  }
  return descriptors;
}

/** Validates one Gaussian splat primitive against the base extension invariants. */
function validateGaussianSplatPrimitive(
  gltf: GLTF,
  primitive: GLTFMeshPrimitive,
  extension: GLTF_KHR_gaussian_splatting,
  meshIndex: number,
  primitiveIndex: number,
  iterator: GLTFIterator
): void {
  if ((primitive.mode ?? 4) !== 0) {
    throw new Error(
      `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} must use POINTS mode.`
    );
  }
  if (typeof extension.kernel !== 'string' || extension.kernel.length === 0) {
    throw new Error(
      `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} is missing kernel.`
    );
  }
  if (typeof extension.colorSpace !== 'string' || extension.colorSpace.length === 0) {
    throw new Error(
      `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} is missing colorSpace.`
    );
  }

  const compressedBufferView = extension.extensions?.[SPZ_COMPRESSION_EXTENSION_NAME]?.bufferView;
  if (compressedBufferView !== undefined) {
    if (
      !Number.isInteger(compressedBufferView) ||
      compressedBufferView < 0 ||
      compressedBufferView >= (gltf.bufferViews || []).length
    ) {
      throw new Error(
        `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} has an invalid SPZ bufferView.`
      );
    }
  } else {
    for (const attributeName of REQUIRED_ATTRIBUTES) {
      if (primitive.attributes[attributeName] === undefined) {
        throw new Error(
          `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} is missing ${attributeName}.`
        );
      }
    }
  }

  for (const [attributeName, accessorIndex] of Object.entries(primitive.attributes)) {
    if (
      !Number.isInteger(accessorIndex) ||
      accessorIndex < 0 ||
      accessorIndex >= (gltf.accessors || []).length
    ) {
      throw new Error(
        `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} has invalid accessor ${attributeName}.`
      );
    }
  }

  validateGaussianValues(gltf, primitive, iterator, meshIndex, primitiveIndex);

  for (let degree = 1; degree <= 3; degree++) {
    const coefficientCount = degree * 2 + 1;
    const present = Array.from(
      {length: coefficientCount},
      (_, coefficientIndex) =>
        primitive.attributes[
          `KHR_gaussian_splatting:SH_DEGREE_${degree}_COEF_${coefficientIndex}`
        ] !== undefined
    );
    if (present.some(Boolean) && !present.every(Boolean)) {
      throw new Error(
        `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} has incomplete SH degree ${degree}.`
      );
    }
    if (present.some(Boolean) && degree > 1) {
      const lowerDegree = degree - 1;
      const lowerCount = lowerDegree * 2 + 1;
      for (let coefficientIndex = 0; coefficientIndex < lowerCount; coefficientIndex++) {
        if (
          primitive.attributes[
            `KHR_gaussian_splatting:SH_DEGREE_${lowerDegree}_COEF_${coefficientIndex}`
          ] === undefined
        ) {
          throw new Error(
            `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} skips SH degree ${lowerDegree}.`
          );
        }
      }
    }
  }
}

/** Checks decoded scale and opacity ranges when the referenced buffers are available. */
function validateGaussianValues(
  gltf: GLTF,
  primitive: GLTFMeshPrimitive,
  iterator: GLTFIterator,
  meshIndex: number,
  primitiveIndex: number
): void {
  const scaleAccessor = primitive.attributes['KHR_gaussian_splatting:SCALE'];
  const opacityAccessor = primitive.attributes['KHR_gaussian_splatting:OPACITY'];
  for (const [attributeName, accessorIndex, predicate] of [
    ['KHR_gaussian_splatting:SCALE', scaleAccessor, (value: number) => value >= 0],
    ['KHR_gaussian_splatting:OPACITY', opacityAccessor, (value: number) => value >= 0 && value <= 1]
  ] as const) {
    if (accessorIndex === undefined || !isAccessorLoaded(gltf, iterator, accessorIndex)) continue;
    const values = iterator.getTypedArrayForAccessor(accessorIndex) as ArrayLike<number>;
    for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
      if (!predicate(Number(values[valueIndex]))) {
        throw new Error(
          `KHR_gaussian_splatting: mesh ${meshIndex} primitive ${primitiveIndex} has an invalid ${attributeName} value.`
        );
      }
    }
  }
}

/** Returns whether an accessor's source buffer has been resolved by the loader. */
function isAccessorLoaded(gltf: GLTF, iterator: GLTFIterator, accessorIndex: number): boolean {
  const accessor = gltf.accessors?.[accessorIndex];
  const bufferView =
    accessor?.bufferView === undefined ? undefined : gltf.bufferViews?.[accessor.bufferView];
  return Boolean(bufferView && iterator.gltf.buffers[bufferView.buffer]);
}
