// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF} from '../types/gltf-types';
import type {GLTFAnimationSampler} from '../types/gltf-json-schema';

/** Convert dictionary or hybrid array animation references without losing malformed source references. */
export function convertGLTFV1Animations(
  json: GLTF,
  resolveReference: (reference: string, collection: 'accessor' | 'node') => number,
  reportUnsupported: (feature: string) => void
): void {
  for (const [animationIndex, animation] of (json.animations || []).entries()) {
    const legacy = animation as typeof animation & {parameters?: Record<string, unknown>};
    const parameters = legacy.parameters || {};
    const samplerIndices = new Map<string, number>();
    const legacySamplers = animation.samplers as
      | GLTFAnimationSampler[]
      | Record<string, GLTFAnimationSampler>;
    const samplerEntries: Array<readonly [string, GLTFAnimationSampler]> = Array.isArray(
      legacySamplers
    )
      ? legacySamplers.map((sampler, samplerIndex) => [String(samplerIndex), sampler] as const)
      : Object.entries(legacySamplers || {});
    animation.samplers = samplerEntries.map(([samplerId, sampler], samplerIndex) => {
      samplerIndices.set(samplerId, samplerIndex);
      for (const field of ['input', 'output'] as const) {
        const reference = sampler[field];
        const accessorId = Object.hasOwn(parameters, reference) ? parameters[reference] : reference;
        sampler[field] = convertReference(accessorId, 'accessor', `sampler ${samplerId} ${field}`);
      }
      sampler.interpolation ??= 'LINEAR';
      return sampler;
    });
    delete legacy.parameters;
    for (const [channelIndex, channel] of (animation.channels || []).entries()) {
      if (typeof channel.sampler === 'string') {
        const samplerIndex = samplerIndices.get(channel.sampler);
        if (samplerIndex === undefined)
          reportUnsupported(
            `animation ${animationIndex} channel ${channelIndex} unresolved sampler ${channel.sampler}`
          );
        else channel.sampler = samplerIndex;
      }
      const target = channel.target as typeof channel.target & {id?: string | number};
      if (target?.id !== undefined) {
        target.node = convertReference(target.id, 'node', `channel ${channelIndex} target`);
        delete target.id;
      } else if (typeof target?.node === 'string') {
        target.node = convertReference(target.node, 'node', `channel ${channelIndex} target`);
      }
    }

    /** Resolve known references, preserving invalid originals for best-effort diagnostics. */
    function convertReference(
      reference: unknown,
      collection: 'accessor' | 'node',
      label: string
    ): number {
      try {
        const index =
          typeof reference === 'string' ? resolveReference(reference, collection) : reference;
        const values = collection === 'accessor' ? json.accessors : json.nodes;
        if (
          typeof index === 'number' &&
          Number.isSafeInteger(index) &&
          index >= 0 &&
          values?.[index]
        )
          return index;
      } catch {
        // The report decides whether unresolved references abort conversion.
      }
      reportUnsupported(`animation ${animationIndex} ${label} unresolved ${collection} reference`);
      return reference as number;
    }
  }
}
