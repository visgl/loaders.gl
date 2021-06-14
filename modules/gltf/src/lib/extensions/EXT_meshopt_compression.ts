import type {GLTFParseOptions} from '../parsers/parse-gltf';
import {DracoLoader} from '@loaders.gl/draco';
import {sliceArrayBuffer} from '@loaders.gl/loader-utils';
import GLTFScenegraph from '../api/gltf-scenegraph';
import {EXT_MESHOPT_COMPRESSION} from '../gltf-utils/gltf-constants';
import {isMeshoptSupported, meshoptDecodeGltfBuffer} from '../../meshopt/meshopt-decoder';

type GLTF_EXT_meshopt_compression = {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  byteStride: number;
  count: number;
  mode: 'ATTRIBUTES' | 'TRIANGLES' | 'INDICES';
  filter?: 'NONE' | 'OCTAHEDRAL' | 'QUATERNION' | 'EXPONENTIAL';
};

const DEFAULT_MESHOPT_OPTIONS = {
  byteOffset: 0,
  filter: 'NONE'
};

// Note: We have a "soft dependency" on DracoWriter to avoid bundling it when not needed
export async function decode(gltfData, options: GLTFParseOptions, context) {
  if (!options.decompressMeshes || !isMeshoptSupported()) {
    return;
  }

  const promises: Promise<any>[] = [];
  for (const bufferViewIndex of gltfData.json.bufferViews || []) {
    promises.push(decodeMeshoptBufferView(gltfData.json, bufferViewIndex));
  }

  // Decompress meshes in parallel
  await Promise.all(promises);

  // We have now decompressed all primitives, so remove the top-level extensions
  const scenegraph = new GLTFScenegraph(gltfData);
  scenegraph.removeExtension(EXT_MESHOPT_COMPRESSION);
}

export function encode(gltfData, options = {}) {
  // const scenegraph = new GLTFScenegraph(gltfData);
}

/** Decode one meshopt buffer view */
async function decodeMeshoptBufferView(json, index: number): Promise<ArrayBuffer | null> {
  const bufferView = json.bufferViews[index];

  const meshoptExtension =
    bufferView.extensions &&
    (bufferView.extensions[EXT_MESHOPT_COMPRESSION] as GLTF_EXT_meshopt_compression);
  if (meshoptExtension) {
    const buffer = json.buffers[meshoptExtension.buffer];

    const {
      byteOffset = 0,
      byteLength = 0,
      byteStride,
      count,
      mode,
      filter = 'NONE'
    } = meshoptExtension;
    const source = new Uint8Array(buffer, byteOffset, byteLength);
    const result = new ArrayBuffer(count * byteStride);
    await meshoptDecodeGltfBuffer(new Uint8Array(result), count, byteStride, source, mode, filter);
    return result;
  }

  return null;
}
