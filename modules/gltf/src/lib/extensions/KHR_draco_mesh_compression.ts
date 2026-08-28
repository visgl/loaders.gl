// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
// Only TRIANGLES: 0x0004 and TRIANGLE_STRIP: 0x0005 are supported
/* eslint-disable camelcase */

import type {LoaderContext} from '@loaders.gl/loader-utils';
import {sliceArrayBuffer, parseFromContext} from '@loaders.gl/loader-utils';

import {DracoLoader, DracoLoaderOptions, type DracoMesh} from '@loaders.gl/draco';

import type {
  GLTFWithBuffers,
  GLTFAccessor,
  GLTFMeshPrimitive,
  GLTF_KHR_draco_mesh_compression
} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {GLTFIterator} from '../api/gltf-iterator';
import {getGLTFAccessors, getGLTFAccessor} from '../gltf-utils/gltf-attribute-utils';
import {getTypedArrayForBufferView} from '../gltf-utils/get-typed-array';

const KHR_DRACO_MESH_COMPRESSION = 'KHR_draco_mesh_compression';

/** Extension name */
export const name = KHR_DRACO_MESH_COMPRESSION;

export function preprocess(
  gltfData: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  context: LoaderContext
): void {
  const iterator = new GLTFIterator(gltfData);
  for (const mesh of iterator.meshes) {
    for (const primitive of iterator.getReferences(mesh).primitives) {
      if (iterator.getExtension(primitive, KHR_DRACO_MESH_COMPRESSION)) {
        // TODO - Remove fallback accessors to make sure we don't load unnecessary buffers
      }
    }
  }
}

export async function decode(
  gltfData: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  context: LoaderContext
): Promise<void> {
  if (!options?.gltf?.decompressMeshes) {
    return;
  }

  const iterator = new GLTFIterator(gltfData);
  const promises: Promise<void>[] = [];
  for (const mesh of iterator.meshes) {
    for (const primitive of iterator.getReferences(mesh).primitives) {
      if (iterator.getExtension(primitive, KHR_DRACO_MESH_COMPRESSION)) {
        promises.push(decompressPrimitive(iterator, primitive, options, context));
      }
    }
  }

  // Decompress meshes in parallel
  await Promise.all(promises);

  // We have now decompressed all primitives, so remove the top-level extension
  iterator.removeExtension(KHR_DRACO_MESH_COMPRESSION);
}

// DECODE

// Unpacks one mesh primitive and removes the extension from the primitive
// DracoDecoder needs to be imported and registered by app
// Returns: Promise that resolves when all pending draco decoder jobs for this mesh complete

// TODO - Implement fallback behavior per KHR_DRACO_MESH_COMPRESSION spec

async function decompressPrimitive(
  iterator: GLTFIterator,
  primitive: GLTFMeshPrimitive,
  options: GLTFLoaderOptions,
  context: LoaderContext
): Promise<void> {
  const dracoExtension = iterator.getExtension<GLTF_KHR_draco_mesh_compression>(
    primitive,
    KHR_DRACO_MESH_COMPRESSION
  );
  if (!dracoExtension) {
    return;
  }

  const buffer = getTypedArrayForBufferView(
    iterator.data,
    iterator.gltf.buffers,
    dracoExtension.bufferView
  );
  const compressedData = getExactArrayBuffer(buffer);

  const dracoOptions: DracoLoaderOptions = {
    ...options,
    draco: {
      ...options.draco,
      extraAttributes: dracoExtension.attributes
    }
  };

  // TODO - remove hack: The entire tileset might be included, too expensive to serialize
  delete dracoOptions['3d-tiles'];
  const decodedData = (await parseFromContext(
    compressedData,
    DracoLoader,
    dracoOptions,
    context
  )) as DracoMesh;

  const decodedAttributes: {[key: string]: GLTFAccessor} = getGLTFAccessors(decodedData.attributes);

  // Restore min/max values
  for (const [attributeName, decodedAttribute] of Object.entries(decodedAttributes)) {
    if (attributeName in primitive.attributes) {
      const accessorIndex: number = primitive.attributes[attributeName];
      const accessor = iterator.data.accessors?.[accessorIndex];
      if (accessor?.min && accessor?.max) {
        decodedAttribute.min = accessor.min;
        decodedAttribute.max = accessor.max;
      }
    }
  }

  // @ts-ignore
  primitive.attributes = decodedAttributes;
  if (decodedData.indices) {
    // @ts-ignore
    primitive.indices = getGLTFAccessor(decodedData.indices);
  }

  // Extension has been processed, delete it
  iterator.removeExtension(primitive, KHR_DRACO_MESH_COMPRESSION);

  checkPrimitive(primitive);
}

// UTILS

function checkPrimitive(primitive: GLTFMeshPrimitive): void {
  if (!primitive.attributes || Object.keys(primitive.attributes).length === 0) {
    throw new Error('glTF: Empty primitive detected: Draco decompression failure?');
  }
}

/** Returns an exact ArrayBuffer for a compressed buffer view, copying only when required. */
function getExactArrayBuffer(buffer: Uint8Array): ArrayBuffer {
  if (
    buffer.buffer instanceof ArrayBuffer &&
    buffer.byteOffset === 0 &&
    buffer.byteLength === buffer.buffer.byteLength
  ) {
    return buffer.buffer;
  }
  return sliceArrayBuffer(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
