// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {z} from 'zod';
import type {
  GLTFKHRAudioDataSchema,
  GLTFKHRAudioSourceSchema,
  GLTFKHRAudioPositionalSchema,
  GLTFKHRAudioEmitterSchema,
  GLTFKHRAudioEmitterExtensionSchema,
  GLTFKHRAudioAttachmentSchema
} from './gltf-audio-extension-schemas';

/** Encoded draft KHR audio resource, preserving additional properties. */
export type GLTFKHRAudioData = z.infer<typeof GLTFKHRAudioDataSchema>;
/** Draft KHR source playback settings and optional clip reference. */
export type GLTFKHRAudioSource = z.infer<typeof GLTFKHRAudioSourceSchema>;
/** Draft KHR positional emitter settings; angles are in radians. */
export type GLTFKHRAudioPositional = z.infer<typeof GLTFKHRAudioPositionalSchema>;
/** Draft KHR emitter declaration, including future extension-defined kinds. */
export type GLTFKHRAudioEmitter = z.infer<typeof GLTFKHRAudioEmitterSchema>;
/** Document-level KHR_audio_emitter draft declaration. */
export type GLTF_KHR_audio_emitter = z.infer<typeof GLTFKHRAudioEmitterExtensionSchema>;
/** Node or scene attachment in the KHR_audio_emitter draft. */
export type GLTFKHRAudioAttachment = z.infer<typeof GLTFKHRAudioAttachmentSchema>;

/** Encoded audio clip; the loader does not decode or play sound. */
export type GLTFAudioClip = {
  /** Original audio resource declaration. */
  audio: GLTFKHRAudioData;
  /** Encoded bytes when audio resource loading is enabled and the buffer is available. */
  data?: Uint8Array;
  /** Resolved URI for externally loaded clips. */
  url?: string;
};

/** Resolved source reference belonging to an emitter. */
export type GLTFAudioEmitterSource = {
  /** Index into the extension's sources array. */
  sourceIndex: number;
  /** Original playback settings. */
  source: GLTFKHRAudioSource;
  /** Shared encoded clip, absent for placeholder sources. */
  clip?: GLTFAudioClip;
};

/** One instance of a KHR emitter attached to a node or scene. */
export type GLTFAudioEmitter = {
  /** Index into the extension's emitters array. */
  emitterIndex: number;
  /** Attached node index, or null for a scene attachment. */
  nodeIndex: number | null;
  /** Attached scene index, or null for a node attachment. */
  sceneIndex: number | null;
  /** Original emitter declaration. */
  emitter: GLTFKHRAudioEmitter;
  /** Resolved sources sharing clips across emitter instances. */
  sources: GLTFAudioEmitterSource[];
};
