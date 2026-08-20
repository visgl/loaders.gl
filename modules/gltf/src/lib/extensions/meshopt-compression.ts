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

/**
 * Exact extension identifiers accepted by the shared meshopt decoder.
 *
 * The two extensions deliberately remain separate capabilities even though their JSON layouts are
 * compatible: KHR adds version 1 attribute streams and the `COLOR` filter, while existing EXT
 * assets continue to require the EXT identifier.
 */
export type MeshoptCompressionExtensionName = 'KHR_meshopt_compression' | 'EXT_meshopt_compression';

/**
 * Decompresses every buffer view that uses one meshopt extension.
 *
 * The Khronos and vendor extensions share their buffer-view layout, but the Khronos extension
 * additionally permits version 1 attribute streams and the `COLOR` filter. A buffer view or
 * fallback buffer cannot opt into both extensions because the specifications define them as
 * mutually exclusive. The extension object identifies the compressed source range; the parent
 * buffer view identifies the destination range that will contain `count * byteStride`
 * decompressed bytes.
 *
 * Extension objects, fallback-buffer markers, and top-level `extensionsUsed` and
 * `extensionsRequired` declarations are removed only after every matching buffer view decodes
 * successfully. Source buffers containing compressed bytes remain in `gltfData.buffers`; the
 * loader does not compact or renumber buffers.
 *
 * @param gltfData Parsed glTF JSON and its resolved buffers.
 * @param options glTF loader options controlling buffer loading and mesh decompression.
 * @param extensionName Meshopt extension to process.
 * @returns A promise that resolves after all matching buffer views are decoded and their extension
 * declarations are removed.
 * @throws If KHR and EXT declarations are mixed on the same buffer view or buffer, or if a
 * compressed stream cannot be decoded.
 */
export async function decodeMeshoptCompression(
  gltfData: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  extensionName: MeshoptCompressionExtensionName
): Promise<void> {
  // Meshopt needs both the compressed source and the parent buffer view's destination buffer.
  if (!options.gltf?.decompressMeshes || !options.gltf.loadBuffers) {
    return;
  }

  validateMeshoptCompressionExclusivity(gltfData.json);

  const scenegraph = new GLTFScenegraph(gltfData);
  const bufferViews = gltfData.json.bufferViews || [];
  const promises = bufferViews.map((bufferView) =>
    decodeMeshoptBufferView(scenegraph, bufferView, extensionName)
  );

  await Promise.all(promises);

  // Preserve compressed source buffers, but remove capability markers after successful decoding.
  for (const bufferView of bufferViews) {
    scenegraph.removeObjectExtension(bufferView, extensionName);
  }
  for (const buffer of gltfData.json.buffers || []) {
    scenegraph.removeObjectExtension(buffer, extensionName);
  }
  scenegraph.removeExtension(extensionName);
}

/**
 * Enforces the KHR/EXT capability invariant before any compressed bytes are decoded.
 *
 * Khronos specifies the two extension identifiers as mutually exclusive on both compressed buffer
 * views and fallback buffers. Validating the whole document before decoding prevents traversal
 * order from turning an invalid mixed declaration into partially decoded output.
 *
 * @param gltf Parsed glTF document.
 * @throws If one buffer view or buffer declares both `KHR_meshopt_compression` and
 * `EXT_meshopt_compression`.
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

/**
 * Decodes one meshopt-compressed buffer view.
 *
 * The extension's `buffer` and byte range select compressed source bytes. The parent buffer view's
 * `buffer`, `byteOffset`, and `byteLength` select the destination. Buffer-level byte offsets from
 * `GLTFWithBuffers` are included in both ranges so sliced GLB buffers remain valid.
 *
 * This helper deliberately leaves the extension object in place. The caller removes all processed
 * declarations together only after every parallel decode succeeds.
 *
 * @param scenegraph Mutable scenegraph containing parsed JSON and resolved buffers.
 * @param bufferView Parent buffer view that describes the decompressed destination range.
 * @param extensionName Exact meshopt extension identifier to process.
 * @returns A promise that resolves when the buffer view has been decoded, or immediately when the
 * buffer view does not declare `extensionName`.
 * @throws If the compressed bitstream is malformed or incompatible with its declared mode,
 * filter, count, or byte stride.
 */
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
}
