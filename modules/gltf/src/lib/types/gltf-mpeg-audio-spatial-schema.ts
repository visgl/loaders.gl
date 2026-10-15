// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {z} from 'zod';
import type {
  GLTFSpatialAudioSourceSchema,
  GLTFSpatialAudioReverbPropertySchema,
  GLTFSpatialAudioReverbSchema,
  GLTFSpatialAudioListenerSchema,
  GLTFMPEGAudioSpatialSchema
} from './gltf-audio-extension-schemas';

/** MPEG source declaration with serialized accessor indices and additional properties. */
export type GLTFSpatialAudioSource = z.infer<typeof GLTFSpatialAudioSourceSchema>;
/** Frequency-dependent MPEG reverberation parameters. */
export type GLTFSpatialAudioReverbProperty = z.infer<typeof GLTFSpatialAudioReverbPropertySchema>;
/** MPEG reverberation unit declaration. */
export type GLTFSpatialAudioReverb = z.infer<typeof GLTFSpatialAudioReverbSchema>;
/** MPEG listener declaration, usually attached to a camera node. */
export type GLTFSpatialAudioListener = z.infer<typeof GLTFSpatialAudioListenerSchema>;
/** MPEG_audio_spatial declaration supported at document root and on nodes. */
export type GLTF_MPEG_audio_spatial = z.infer<typeof GLTFMPEGAudioSpatialSchema>;

/** Lazy spatial audio descriptor retaining its scene attachment. */
export type GLTFSpatialAudio = {
  /** Node index, or null for a document-level declaration. */
  nodeIndex: number | null;
  /** Original declaration, including source accessor indices and renderer parameters. */
  extension: GLTF_MPEG_audio_spatial;
};
