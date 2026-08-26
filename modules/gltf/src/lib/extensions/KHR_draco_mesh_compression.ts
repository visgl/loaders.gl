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

import {GLTFIterator, GLTFMeshPrimitiveIterator} from '../api/gltf-iterator';
import {GLTFScenegraph} from '../api/gltf-scenegraph';
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
      if (primitive.getExtension(KHR_DRACO_MESH_COMPRESSION)) {
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
      if (primitive.getExtension(KHR_DRACO_MESH_COMPRESSION)) {
        promises.push(decompressPrimitive(iterator, primitive, options, context));
      }
    }
  }

  // Decompress meshes in parallel
  await Promise.all(promises);

  // We have now decompressed all primitives, so remove the top-level extension
  iterator.removeExtension(KHR_DRACO_MESH_COMPRESSION);
}

export function encode(gltfData, options: GLTFLoaderOptions = {}): void {
  const scenegraph = new GLTFScenegraph(gltfData);

  for (const mesh of scenegraph.json.meshes || []) {
    // eslint-disable-next-line camelcase
    // @ts-ignore
    compressMesh(mesh, options);
    // NOTE: Only add the extension if something was actually compressed
    scenegraph.addRequiredExtension(KHR_DRACO_MESH_COMPRESSION);
  }
}

// DECODE

// Unpacks one mesh primitive and removes the extension from the primitive
// DracoDecoder needs to be imported and registered by app
// Returns: Promise that resolves when all pending draco decoder jobs for this mesh complete

// TODO - Implement fallback behavior per KHR_DRACO_MESH_COMPRESSION spec

async function decompressPrimitive(
  iterator: GLTFIterator,
  primitive: GLTFMeshPrimitiveIterator,
  options: GLTFLoaderOptions,
  context: LoaderContext
): Promise<void> {
  const dracoExtension = primitive.getExtension<GLTF_KHR_draco_mesh_compression>(
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
  // TODO - parse does not yet deal well with byte offsets embedded in typed arrays. Copy buffer
  // TODO - remove when `parse` is fixed to handle `byteOffset`s
  const bufferCopy = sliceArrayBuffer(buffer.buffer, buffer.byteOffset); // , buffer.byteLength);

  const dracoOptions: DracoLoaderOptions = {...options};

  // TODO - remove hack: The entire tileset might be included, too expensive to serialize
  delete dracoOptions['3d-tiles'];
  const decodedData = (await parseFromContext(
    bufferCopy,
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
  primitive.data.attributes = decodedAttributes;
  if (decodedData.indices) {
    // @ts-ignore
    primitive.data.indices = getGLTFAccessor(decodedData.indices);
  }

  // Extension has been processed, delete it
  primitive.removeExtension(KHR_DRACO_MESH_COMPRESSION);

  checkPrimitive(primitive.data);
}

// ENCODE

// eslint-disable-next-line max-len
// Only TRIANGLES: 0x0004 and TRIANGLE_STRIP: 0x0005 are supported
function compressMesh(attributes, indices, mode: number = 4, options, context: LoaderContext) {
  if (!options.DracoWriter) {
    throw new Error('options.gltf.DracoWriter not provided');
  }

  // TODO - use DracoWriter using encode w/ registered DracoWriter...
  const compressedData = options.DracoWriter.encodeSync({attributes});

  // Draco compression may change the order and number of vertices in a mesh.
  // To satisfy the requirement that accessors properties be correct for both
  // compressed and uncompressed data, generators should create uncompressed
  // attributes and indices using data that has been decompressed from the Draco buffer,
  // rather than the original source data.
  // @ts-ignore TODO this needs to be fixed
  const decodedData = context?.parseSync?.({attributes});
  const fauxAccessors = options._addFauxAttributes(decodedData.attributes);

  const bufferViewIndex = options.addBufferView(compressedData);

  const glTFMesh = {
    primitives: [
      {
        attributes: fauxAccessors, // TODO - verify with spec
        mode, // GL.POINTS
        extensions: {
          [KHR_DRACO_MESH_COMPRESSION]: {
            bufferView: bufferViewIndex,
            attributes: fauxAccessors // TODO - verify with spec
          }
        }
      }
    ]
  };

  return glTFMesh;
}

// UTILS

function checkPrimitive(primitive: GLTFMeshPrimitive) {
  if (!primitive.attributes && Object.keys(primitive.attributes).length > 0) {
    throw new Error('glTF: Empty primitive detected: Draco decompression failure?');
  }
}
