// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {GLTF} from '../types/gltf-json-schema';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {
  GLTF_MPEG_audio_spatial,
  GLTFSpatialAudio
} from '../types/gltf-mpeg-audio-spatial-schema';

/** Registered MPEG spatial audio extension name. */
export const name = 'MPEG_audio_spatial';

/** Collects root and node audio declarations without loading media or changing source JSON. */
export function getSpatialAudio(gltf: GLTF | GLTFWithBuffers): GLTFSpatialAudio[] {
  const json: GLTF = ('asset' in gltf ? gltf : gltf.json) as GLTF;
  const descriptors: GLTFSpatialAudio[] = [];
  const extension = json.extensions?.[name] as GLTF_MPEG_audio_spatial | undefined;
  if (extension) descriptors.push({nodeIndex: null, extension});
  for (const [nodeIndex, node] of (json.nodes || []).entries()) {
    const nodeExtension = node.extensions?.[name] as GLTF_MPEG_audio_spatial | undefined;
    if (nodeExtension) descriptors.push({nodeIndex, extension: nodeExtension});
  }
  return descriptors;
}

/** Validates audio accessor references and exposes lazy descriptors for an audio renderer. */
export async function decode(gltfData: GLTFWithBuffers): Promise<void> {
  const descriptors = getSpatialAudio(gltfData);
  for (const {extension, nodeIndex} of descriptors) {
    const location = nodeIndex === null ? 'root' : `node ${nodeIndex}`;
    for (const source of extension.sources || []) {
      if (!Array.isArray(source.accessors) || source.accessors.length === 0) {
        throw new Error(`${name}: ${location} source ${source.id} requires audio accessors.`);
      }
      for (const accessorIndex of source.accessors) {
        if (
          !Number.isInteger(accessorIndex) ||
          accessorIndex < 0 ||
          !gltfData.json.accessors?.[accessorIndex]
        ) {
          throw new Error(
            `${name}: ${location} source ${source.id} has invalid accessor ${accessorIndex}.`
          );
        }
      }
      if (
        source.reverbFeedGain &&
        source.reverbFeedGain.length !== (source.reverbFeed?.length || 0)
      ) {
        throw new Error(
          `${name}: ${location} source ${source.id} has mismatched reverb feed gains.`
        );
      }
    }
  }
  if (descriptors.length) gltfData.spatialAudio = descriptors;
}
