/* eslint-disable camelcase */
import type {GLTF, GLTFBufferView, GLTF_EXT_meshopt_compression} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import GLTFScenegraph from '../api/gltf-scenegraph';
import {isMeshoptSupported, meshoptDecodeGltfBuffer} from '../../meshopt/meshopt-decoder';

// @ts-ignore
// eslint-disable-next-line
const DEFAULT_MESHOPT_OPTIONS = {
  byteOffset: 0,
  filter: 'NONE'
};

/** Extension name */
const EXT_MESHOPT_COMPRESSION = 'EXT_meshopt_compression';

export const name = EXT_MESHOPT_COMPRESSION;

export function preprocess(gltfData: {json: GLTF}) {
  const scenegraph = new GLTFScenegraph(gltfData);
  if (
    scenegraph.getRequiredExtensions().includes(EXT_MESHOPT_COMPRESSION) &&
    !isMeshoptSupported()
  ) {
    throw new Error(`gltf: Required extension ${EXT_MESHOPT_COMPRESSION} not supported by browser`);
  }
}

export async function decode(gltfData: {json: GLTF}, options: GLTFLoaderOptions) {
  const scenegraph = new GLTFScenegraph(gltfData);

  if (!options?.gltf?.decompressMeshes) {
    return;
  }

  const promises: Promise<any>[] = [];
  for (const bufferViewIndex of gltfData.json.bufferViews || []) {
    promises.push(decodeMeshoptBufferView(scenegraph, bufferViewIndex));
  }

  // Decompress meshes in parallel
  await Promise.all(promises);

  // We have now decompressed all primitives, so remove the top-level extensions
  scenegraph.removeExtension(EXT_MESHOPT_COMPRESSION);
}

/** Decode one meshopt buffer view */
async function decodeMeshoptBufferView(
  scenegraph: GLTFScenegraph,
  bufferView: GLTFBufferView
): Promise<ArrayBuffer | null> {
  const meshoptExtension = scenegraph.getObjectExtension<GLTF_EXT_meshopt_compression>(
    bufferView,
    EXT_MESHOPT_COMPRESSION
  );
  if (meshoptExtension) {
    const buffer = bufferView.buffer;

    const {
      byteOffset = 0,
      byteLength = 0,
      byteStride,
      count,
      mode,
      filter = 'NONE'
    } = meshoptExtension;

    // @ts-expect-error TODO - fix buffer handling
    const source = new Uint8Array(buffer, byteOffset, byteLength);
    const result = new ArrayBuffer(count * byteStride);
    await meshoptDecodeGltfBuffer(new Uint8Array(result), count, byteStride, source, mode, filter);
    return result;
  }

  return null;
}
