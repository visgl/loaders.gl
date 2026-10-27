// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {z} from 'zod';

const indexSchema = z.number().int().nonnegative();
const propertyShape = {
  /** Optional object name. */
  name: z.string().optional(),
  /** Nested extension declarations. */
  extensions: z.record(z.string(), z.unknown()).optional(),
  /** Application-specific data. */
  extras: z.unknown().optional()
};

/** Permissive schema for encoded draft KHR audio data. */
export const GLTFKHRAudioDataSchema = z.looseObject({
  ...propertyShape,
  /** External or data URI. */
  uri: z.string().optional(),
  /** Embedded buffer-view index, taking precedence over uri. */
  bufferView: indexSchema.optional(),
  /** Declared encoded media type. */
  mimeType: z.string().optional()
});

/** Permissive schema for a draft KHR audio source, including placeholder sources. */
export const GLTFKHRAudioSourceSchema = z.looseObject({
  ...propertyShape,
  /** Optional audio resource index. */
  audio: indexSchema.optional(),
  /** Linear source gain. */
  gain: z.number().optional(),
  /** Pitch and speed multiplier. */
  playbackRate: z.number().optional(),
  /** Whether playback repeats. */
  loop: z.boolean().optional(),
  /** Application playback intent. */
  autoplay: z.boolean().optional()
});

/** Permissive schema for draft KHR positional audio settings, using radians. */
export const GLTFKHRAudioPositionalSchema = z.looseObject({
  ...propertyShape,
  /** Emitter shape, including extension-defined shapes. */
  shapeType: z.string().optional(),
  /** Inner cone diameter in radians. */
  coneInnerAngle: z.number().optional(),
  /** Outer cone diameter in radians. */
  coneOuterAngle: z.number().optional(),
  /** Gain outside the outer cone. */
  coneOuterGain: z.number().optional(),
  /** Distance attenuation model, including future model names. */
  distanceModel: z.string().optional(),
  /** Maximum attenuation distance. */
  maxDistance: z.number().optional(),
  /** Reference distance in meters. */
  refDistance: z.number().optional(),
  /** Attenuation rate. */
  rolloffFactor: z.number().optional()
});

/** Permissive schema for a draft KHR audio emitter. */
export const GLTFKHRAudioEmitterSchema = z.looseObject({
  ...propertyShape,
  /** Emitter kind, retaining future extension-defined kinds. */
  type: z.string(),
  /** Linear emitter gain. */
  gain: z.number().optional(),
  /** Source indices; omitted or empty for placeholder emitters. */
  sources: z.array(indexSchema).optional(),
  /** Spatialization settings. */
  positional: GLTFKHRAudioPositionalSchema.optional()
});

/** Permissive document-level schema for the KHR_audio_emitter draft. */
export const GLTFKHRAudioEmitterExtensionSchema = z.looseObject({
  ...propertyShape,
  /** Encoded resource declarations. */
  audio: z.array(GLTFKHRAudioDataSchema).optional(),
  /** Playback source declarations. */
  sources: z.array(GLTFKHRAudioSourceSchema).optional(),
  /** Shared emitter declarations. */
  emitters: z.array(GLTFKHRAudioEmitterSchema).optional()
});

/** Permissive node or scene attachment schema for the KHR_audio_emitter draft. */
export const GLTFKHRAudioAttachmentSchema = z.looseObject({
  ...propertyShape,
  /** Attached emitter indices. */
  emitters: z.array(indexSchema).min(1)
});

const mpegPropertyShape = {
  /** Nested extension declarations. */
  extensions: propertyShape.extensions,
  /** Application-specific data. */
  extras: propertyShape.extras
};

/** Permissive schema for an MPEG spatial audio source and timed accessor references. */
export const GLTFSpatialAudioSourceSchema = z.looseObject({
  ...mpegPropertyShape,
  /** Scene-wide source identifier. */
  id: z.number().int(),
  /** Source kind, retaining future extension-defined kinds. */
  type: z.string(),
  /** Source level adjustment in decibels. */
  pregain: z.number().optional(),
  /** Playback speed multiplier. */
  playbackSpeed: z.number().optional(),
  /** Attenuation function, including custom functions. */
  attenuation: z.string().optional(),
  /** Parameters for the attenuation function. */
  attenuationParameters: z.array(z.number()).optional(),
  /** Reference distance in meters. */
  referenceDistance: z.number().optional(),
  /** Accessors describing decoded audio data. */
  accessors: z.array(indexSchema).min(1),
  /** Reverb units receiving this source's signal. */
  reverbFeed: z.array(z.number().int()).optional(),
  /** Per-feed gain in decibels. */
  reverbFeedGain: z.array(z.number()).optional()
});

/** Permissive schema for frequency-dependent MPEG reverberation parameters. */
export const GLTFSpatialAudioReverbPropertySchema = z.looseObject({
  ...mpegPropertyShape,
  /** Frequency in hertz. */
  frequency: z.number(),
  /** Reverberation decay time in seconds. */
  RT60: z.number(),
  /** Diffuse-to-source ratio in decibels. */
  DSR: z.number()
});

/** Permissive schema for an MPEG reverberation unit. */
export const GLTFSpatialAudioReverbSchema = z.looseObject({
  ...mpegPropertyShape,
  /** Scene-wide reverb identifier. */
  id: z.number().int(),
  /** Whether the renderer may bypass this unit. */
  bypass: z.boolean().optional(),
  /** Frequency-dependent reverberation parameters. */
  properties: z.array(GLTFSpatialAudioReverbPropertySchema).min(1),
  /** Delay before late reverberation in seconds. */
  predelay: z.number().optional()
});

/** Permissive schema for an MPEG spatial audio listener. */
export const GLTFSpatialAudioListenerSchema = z.looseObject({
  ...mpegPropertyShape,
  /** Scene-wide listener identifier. */
  id: z.number().int()
});

/** Permissive root or node schema for MPEG_audio_spatial. */
export const GLTFMPEGAudioSpatialSchema = z.looseObject({
  ...mpegPropertyShape,
  /** Audio sources at this attachment. */
  sources: z.array(GLTFSpatialAudioSourceSchema).optional(),
  /** Audio output listener. */
  listener: GLTFSpatialAudioListenerSchema.optional(),
  /** Reverb units at this attachment. */
  reverbs: z.array(GLTFSpatialAudioReverbSchema).optional()
});
