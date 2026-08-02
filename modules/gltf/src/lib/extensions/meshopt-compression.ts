/* eslint-disable camelcase */
import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {
  GLTF,
  GLTFBufferView,
  GLTF_EXT_meshopt_compression,
  GLTF_KHR_meshopt_compression
} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import {GLTFScenegraph} from '../api/gltf-scenegraph';
import {meshoptDecodeGltfBuffer} from '../../meshopt/meshopt-decoder';

/** Names of the compatible meshopt buffer-view compression extensions. */
export type MeshoptCompressionExtensionName = 'KHR_meshopt_compression' | 'EXT_meshopt_compression';

/**
 * Decompresses every buffer view that uses one meshopt extension.
 *
 * The Khronos and vendor extensions share their buffer-view layout, but the Khronos extension
 * additionally permits version 1 attribute streams and the `COLOR` filter. A buffer view or
 * fallback buffer cannot opt into both extensions because the specifications define them as
 * mutually exclusive.
 *
 * @param gltfData Parsed glTF JSON and its resolved buffers.
 * @param options glTF loader options controlling buffer loading and mesh decompression.
 * @param extensionName Meshopt extension to process.
 */
export async function decodeMeshoptCompression(
  gltfData: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  extensionName: MeshoptCompressionExtensionName
): Promise<void> {
  if (!options.gltf?.decompressMeshes || !options.gltf.loadBuffers) {
    return;
  }

  validateMeshoptCompressionExclusivity(gltfData.json);

  const scenegraph = new GLTFScenegraph(gltfData);
  const promises = (gltfData.json.bufferViews || []).map(bufferView =>
    decodeMeshoptBufferView(scenegraph, bufferView, extensionName)
  );

  await Promise.all(promises);
  for (const buffer of gltfData.json.buffers || []) {
    scenegraph.removeObjectExtension(buffer, extensionName);
  }
  scenegraph.removeExtension(extensionName);
}

/**
 * Enforces the KHR/EXT capability invariant before any compressed bytes are decoded.
 *
 * @param gltf Parsed glTF document.
 */
export function validateMeshoptCompressionExclusivity(gltf: GLTF): void {
  const bufferViews = gltf.bufferViews || [];
  for (let bufferViewIndex = 0; bufferViewIndex < bufferViews.length; bufferViewIndex++) {
    const extensions = bufferViews[bufferViewIndex].extensions;
    if (extensions?.KHR_meshopt_compression && extensions.EXT_meshopt_compression) {
      throw new Error(
        `glTF bufferView ${bufferViewIndex} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`
      );
    }
  }

  const buffers = gltf.buffers || [];
  for (let bufferIndex = 0; bufferIndex < buffers.length; bufferIndex++) {
    const extensions = buffers[bufferIndex].extensions;
    if (extensions?.KHR_meshopt_compression && extensions.EXT_meshopt_compression) {
      throw new Error(
        `glTF buffer ${bufferIndex} cannot use both KHR_meshopt_compression and EXT_meshopt_compression.`
      );
    }
  }
}

/** Decodes one meshopt-compressed buffer view and removes the processed extension object. */
async function decodeMeshoptBufferView(
  scenegraph: GLTFScenegraph,
  bufferView: GLTFBufferView,
  extensionName: MeshoptCompressionExtensionName
): Promise<void> {
  const meshoptExtension = scenegraph.getObjectExtension<
    GLTF_KHR_meshopt_compression | GLTF_EXT_meshopt_compression
  >(bufferView, extensionName);

  if (!meshoptExtension) {
    return;
  }

  const {
    byteOffset = 0,
    byteLength,
    byteStride,
    count,
    mode,
    filter = 'NONE',
    buffer: sourceBufferIndex
  } = meshoptExtension;
  const sourceBuffer = scenegraph.gltf.buffers[sourceBufferIndex];
  const targetBuffer = scenegraph.gltf.buffers[bufferView.buffer];
  const source = new Uint8Array(
    sourceBuffer.arrayBuffer,
    sourceBuffer.byteOffset + byteOffset,
    byteLength
  );
  const target = new Uint8Array(
    targetBuffer.arrayBuffer,
    targetBuffer.byteOffset + (bufferView.byteOffset || 0),
    bufferView.byteLength
  );

  await meshoptDecodeGltfBuffer(target, count, byteStride, source, mode, filter);
  scenegraph.removeObjectExtension(bufferView, extensionName);
}
