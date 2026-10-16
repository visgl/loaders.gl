// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {
  GLTF_KHR_audio_emitter,
  GLTFKHRAudioAttachment,
  GLTFAudioClip,
  GLTFAudioEmitter
} from '../types/gltf-khr-audio-emitter-schema';
import {resolveUrl} from '../gltf-utils/resolve-url';

/** Name of the draft audio emitter extension. */
export const name = 'KHR_audio_emitter';

/** Resolves audio references and optionally loads encoded clips, without creating playback objects. */
export async function decode(
  gltfData: GLTFWithBuffers,
  options: GLTFLoaderOptions,
  context?: LoaderContext
): Promise<void> {
  const extension = gltfData.json.extensions?.[name] as GLTF_KHR_audio_emitter | undefined;
  const clips: GLTFAudioClip[] = (extension?.audio || []).map(audio => ({audio}));
  const sources = extension?.sources || [];
  const emitters = extension?.emitters || [];
  for (const source of sources) {
    if (source.audio !== undefined) getReference(clips, source.audio, 'audio');
  }
  for (const emitter of emitters) {
    if (emitter.type !== 'global' && emitter.type !== 'positional') {
      throw new Error(`${name}: invalid emitter type ${emitter.type}.`);
    }
    if (emitter.type === 'global' && emitter.positional !== undefined) {
      throw new Error(`${name}: global emitters cannot have positional settings.`);
    }
    for (const sourceIndex of emitter.sources || []) getReference(sources, sourceIndex, 'source');
  }
  const descriptors: GLTFAudioEmitter[] = [];
  for (const attachmentType of ['nodes', 'scenes'] as const) {
    for (const [attachmentIndex, object] of (gltfData.json[attachmentType] || []).entries()) {
      const attachment = object.extensions?.[name] as GLTFKHRAudioAttachment | undefined;
      if (!attachment) continue;
      if (!Array.isArray(attachment.emitters) || !attachment.emitters.length) {
        throw new Error(`${name}: ${attachmentType} ${attachmentIndex} requires emitters.`);
      }
      for (const emitterIndex of attachment.emitters) {
        const emitter = getReference(emitters, emitterIndex, 'emitter');
        if (attachmentType === 'scenes' && emitter.type !== 'global') {
          throw new Error(`${name}: scenes may only reference global emitters.`);
        }
        descriptors.push({
          emitterIndex,
          nodeIndex: attachmentType === 'nodes' ? attachmentIndex : null,
          sceneIndex: attachmentType === 'scenes' ? attachmentIndex : null,
          emitter,
          sources: (emitter.sources || []).map(sourceIndex => {
            const source = sources[sourceIndex];
            return {
              sourceIndex,
              source,
              clip: source.audio === undefined ? undefined : clips[source.audio]
            };
          })
        });
      }
    }
  }
  if (!extension) return;
  // Validate resource declarations before performing external requests.
  for (const clip of clips) validateClip(gltfData, clip);
  if (options.gltf?.loadAudio !== false) {
    await Promise.all(clips.map(clip => loadClip(gltfData, clip, options, context)));
  }
  gltfData.audioClips = clips;
  gltfData.audioEmitters = descriptors;
}

/** Looks up a nonnegative integral extension index with an actionable error. */
function getReference<Value>(values: Value[], index: number, kind: string): Value {
  if (!Number.isInteger(index) || index < 0 || !values[index]) {
    throw new Error(`${name}: invalid ${kind} index ${index}.`);
  }
  return values[index];
}

/** Checks resource declarations even when resource loading is disabled. */
function validateClip(gltfData: GLTFWithBuffers, clip: GLTFAudioClip): void {
  const {audio} = clip;
  if (audio.bufferView !== undefined) {
    getReference(gltfData.json.bufferViews || [], audio.bufferView, 'bufferView');
    if (!audio.mimeType) throw new Error(`${name}: buffer-view audio requires mimeType.`);
  } else if (!audio.uri) {
    throw new Error(`${name}: audio requires a uri or bufferView.`);
  }
}

/** Loads encoded bytes through the loader context or a bounded embedded buffer view. */
async function loadClip(
  gltfData: GLTFWithBuffers,
  clip: GLTFAudioClip,
  options: GLTFLoaderOptions,
  context?: LoaderContext
): Promise<void> {
  const {audio} = clip;
  if (audio.bufferView !== undefined) {
    const bufferView = gltfData.json.bufferViews![audio.bufferView];
    const buffer = gltfData.buffers[bufferView.buffer];
    if (!buffer) {
      if (options.gltf?.loadBuffers === false) return;
      throw new Error(`${name}: audio buffer ${bufferView.buffer} is not loaded.`);
    }
    const byteOffset = bufferView.byteOffset ?? 0;
    const byteLength = bufferView.byteLength;
    if (
      !Number.isSafeInteger(byteOffset) ||
      byteOffset < 0 ||
      !Number.isSafeInteger(byteLength) ||
      byteLength < 0 ||
      byteOffset + byteLength > buffer.byteLength ||
      buffer.byteOffset + byteOffset + byteLength > buffer.arrayBuffer.byteLength
    ) {
      throw new Error(`${name}: audio bufferView exceeds its buffer.`);
    }
    clip.data = new Uint8Array(buffer.arrayBuffer, buffer.byteOffset + byteOffset, byteLength);
    return;
  }
  if (!context?.fetch) throw new Error(`${name}: a loader context is required to load audio.`);
  const url = resolveUrl(audio.uri!, options, context);
  const response = await context.fetch(url);
  if (!response.ok) throw new Error(`${name}: failed to load audio ${url} (${response.status}).`);
  clip.url = url;
  clip.data = new Uint8Array(await response.arrayBuffer());
}
