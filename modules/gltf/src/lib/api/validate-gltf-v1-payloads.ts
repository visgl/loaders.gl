// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';
import {
  validateGLTFV1AccessorSource,
  readGLTFV1AccessorComponent,
  type GLTFV1AccessorSource
} from './repack-gltf-v1-accessors';

/** Validated dense accessor reader shared by bounds, animation, and skin checks. */
type ReadAccessor = (accessorIndex: number, label: string) => GLTFV1AccessorSource | null;

/** Validate supported core payload semantics and repair required bounds without changing source bytes. */
export function validateGLTFV1Payloads(
  gltf: GLTFWithBuffers,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): void {
  const cache = new Map<number, GLTFV1AccessorSource | string>();
  const failed = new Set<number>();
  const plans: Array<() => void> = [];
  /** Validate spans once, reporting unavailable or opaque bytes before any semantic read. */
  const readAccessor: ReadAccessor = (accessorIndex, label) => {
    let source = cache.get(accessorIndex);
    if (source === undefined) {
      source = validateGLTFV1AccessorSource(gltf, accessorIndex);
      cache.set(accessorIndex, source);
    }
    if (typeof source === 'string') {
      if (!failed.has(accessorIndex)) {
        failed.add(accessorIndex);
        reportUnsupported(`${label}: ${source}`);
      }
      return null;
    }
    return source;
  };
  const positions = new Set<number>();
  for (const mesh of gltf.json.meshes || [])
    for (const primitive of mesh.primitives)
      if (primitive.attributes.POSITION !== undefined) positions.add(primitive.attributes.POSITION);
  for (const accessorIndex of positions) {
    const source = readAccessor(accessorIndex, `POSITION accessor ${accessorIndex}`);
    if (!source) continue;
    if (!isFloatAccessor(source, 'VEC3')) {
      reportUnsupported(`POSITION accessor ${accessorIndex} requires unnormalized FLOAT VEC3 data`);
      continue;
    }
    planBounds(source, accessorIndex);
  }
  validateAnimations();
  validateSkinInfluences(gltf, readAccessor, reportUnsupported);
  for (const apply of plans) apply();

  /** Calculate finite raw extrema, committing only after all strict checks pass. */
  function planBounds(source: GLTFV1AccessorSource, accessorIndex: number): boolean {
    const minimum = new Array<number>(source.rows).fill(Infinity);
    const maximum = new Array<number>(source.rows).fill(-Infinity);
    for (let elementIndex = 0; elementIndex < source.accessor.count; elementIndex++)
      for (let componentIndex = 0; componentIndex < source.rows; componentIndex++) {
        const value = readGLTFV1AccessorComponent(source, elementIndex, componentIndex);
        if (!Number.isFinite(value)) {
          reportUnsupported(
            `accessor ${accessorIndex} non-finite values cannot supply required bounds`
          );
          return false;
        }
        minimum[componentIndex] = Math.min(minimum[componentIndex], value);
        maximum[componentIndex] = Math.max(maximum[componentIndex], value);
      }
    if (
      JSON.stringify(source.accessor.min) !== JSON.stringify(minimum) ||
      JSON.stringify(source.accessor.max) !== JSON.stringify(maximum)
    )
      plans.push(() => {
        source.accessor.min = minimum;
        source.accessor.max = maximum;
        reportNote(`Calculated required bounds for accessor ${accessorIndex}.`);
      });
    return true;
  }

  /** Check compatible TRS keyframes without sorting, resampling, or fabricating interpolation tangents. */
  function validateAnimations(): void {
    const checkedTimes = new Set<number>();
    const checkedOutputs = new Set<string>();
    for (const [animationIndex, animation] of (gltf.json.animations || []).entries()) {
      const targets = new Set<string>();
      if (!animation.samplers.length || !animation.channels?.length)
        reportUnsupported(`animation ${animationIndex} requires samplers and channels`);
      for (const [samplerIndex, sampler] of animation.samplers.entries()) {
        const label = `animation ${animationIndex} sampler ${samplerIndex}`;
        if (!['LINEAR', 'STEP'].includes(sampler.interpolation ?? 'LINEAR'))
          reportUnsupported(`${label} unsupported interpolation ${sampler.interpolation}`);
        if (!checkedTimes.has(sampler.input)) {
          checkedTimes.add(sampler.input);
          const source = readAccessor(sampler.input, `${label} input`);
          if (source) {
            if (!isFloatAccessor(source, 'SCALAR'))
              reportUnsupported(`${label} time input requires unnormalized FLOAT SCALAR data`);
            else {
              let previous = -Infinity;
              let valid = true;
              for (let elementIndex = 0; elementIndex < source.accessor.count; elementIndex++) {
                const time = readGLTFV1AccessorComponent(source, elementIndex, 0);
                if (!Number.isFinite(time) || time < 0 || time <= previous) valid = false;
                previous = time;
              }
              if (!valid)
                reportUnsupported(
                  `${label} times must be finite, nonnegative, and strictly increasing`
                );
              else planBounds(source, sampler.input);
            }
          }
        }
      }
      for (const [channelIndex, channel] of (animation.channels || []).entries()) {
        const label = `animation ${animationIndex} channel ${channelIndex}`;
        const sampler = Number.isSafeInteger(channel.sampler)
          ? animation.samplers[channel.sampler]
          : undefined;
        const target = channel.target;
        const node = Number.isSafeInteger(target?.node)
          ? gltf.json.nodes?.[target.node as number]
          : undefined;
        if (!sampler || !node || !['translation', 'rotation', 'scale'].includes(target?.path)) {
          reportUnsupported(`${label} invalid sampler, node, or TRS target`);
          continue;
        }
        if (node.matrix !== undefined)
          reportUnsupported(`${label} matrix node requires TRS decomposition`);
        const targetKey = `${target.node}:${target.path}`;
        if (targets.has(targetKey)) reportUnsupported(`${label} duplicate node/path target`);
        targets.add(targetKey);
        if (!['LINEAR', 'STEP'].includes(sampler.interpolation ?? 'LINEAR')) continue;
        const input = gltf.json.accessors?.[sampler.input];
        const output = readAccessor(sampler.output, `${label} output`);
        if (!output) continue;
        if (
          !isFloatAccessor(output, target.path === 'rotation' ? 'VEC4' : 'VEC3') ||
          output.accessor.count !== input?.count
        ) {
          reportUnsupported(
            `${label} output shape, type, or count does not match its target and keys`
          );
          continue;
        }
        const outputKey = `${sampler.output}:${target.path}`;
        if (checkedOutputs.has(outputKey)) continue;
        checkedOutputs.add(outputKey);
        for (let elementIndex = 0; elementIndex < output.accessor.count; elementIndex++) {
          const values = Array.from({length: output.rows}, (_, componentIndex) =>
            readGLTFV1AccessorComponent(output, elementIndex, componentIndex)
          );
          if (
            values.some(value => !Number.isFinite(value)) ||
            (target.path === 'rotation' && Math.abs(Math.hypot(...values) - 1) > 1e-5)
          ) {
            reportUnsupported(
              `${label} output requires finite values and unit rotation quaternions`
            );
            break;
          }
        }
      }
    }
  }
}

/** Core positions, timeline values, and TRS samples use unnormalized FLOAT accessors. */
function isFloatAccessor(source: GLTFV1AccessorSource, type: string): boolean {
  return (
    source.accessor.componentType === 5126 &&
    !source.accessor.normalized &&
    source.accessor.type === type
  );
}

/** Validate supplied influence sets against every resolved skin that instantiates their mesh. */
function validateSkinInfluences(
  gltf: GLTFWithBuffers,
  readAccessor: ReadAccessor,
  reportUnsupported: (feature: string) => void
): void {
  const checkedBindings = new Set<string>();
  for (const node of gltf.json.nodes || []) {
    const skin = gltf.json.skins?.[node.skin as number];
    const mesh = gltf.json.meshes?.[node.mesh as number];
    if (!Array.isArray(skin?.joints) || !skin.joints.length || !mesh) continue;
    const binding = `${node.mesh}:${node.skin}`;
    if (checkedBindings.has(binding)) continue;
    checkedBindings.add(binding);
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const label = `mesh ${node.mesh} primitive ${primitiveIndex} skin ${node.skin}`;
      const jointSets = Object.keys(primitive.attributes)
        .filter(name => /^JOINTS_\d+$/.test(name))
        .map(name => Number(name.slice(7)))
        .sort((first, second) => first - second);
      const weightSets = Object.keys(primitive.attributes)
        .filter(name => /^WEIGHTS_\d+$/.test(name))
        .map(name => Number(name.slice(8)))
        .sort((first, second) => first - second);
      if (!jointSets.length && !weightSets.length) continue;
      if (
        JSON.stringify(jointSets) !== JSON.stringify(weightSets) ||
        jointSets.some((setIndex, index) => setIndex !== index)
      ) {
        reportUnsupported(
          `${label} requires matching contiguous joint/weight sets starting at zero`
        );
        continue;
      }
      const count = gltf.json.accessors?.[primitive.attributes.POSITION]?.count;
      const sets = jointSets.map(setIndex => ({
        joints: readAccessor(
          primitive.attributes[`JOINTS_${setIndex}`],
          `${label} joint set ${setIndex}`
        ),
        weights: readAccessor(
          primitive.attributes[`WEIGHTS_${setIndex}`],
          `${label} weight set ${setIndex}`
        )
      }));
      if (sets.some(({joints, weights}) => !joints || !weights)) continue;
      if (
        sets.some(
          ({joints, weights}) =>
            joints!.accessor.type !== 'VEC4' ||
            weights!.accessor.type !== 'VEC4' ||
            ![5121, 5123].includes(joints!.accessor.componentType) ||
            joints!.accessor.normalized ||
            !(
              (weights!.accessor.componentType === 5126 && !weights!.accessor.normalized) ||
              ([5121, 5123].includes(weights!.accessor.componentType) &&
                weights!.accessor.normalized)
            ) ||
            joints!.accessor.count !== weights!.accessor.count ||
            (count !== undefined && joints!.accessor.count !== count) ||
            joints!.accessor.count !== sets[0].joints!.accessor.count
        )
      ) {
        reportUnsupported(`${label} incompatible influence accessor types or vertex counts`);
        continue;
      }
      for (let vertexIndex = 0; vertexIndex < sets[0].joints!.accessor.count; vertexIndex++) {
        let sum = 0;
        let nonzeroWeights = 0;
        let valid = true;
        const weightedJoints = new Set<number>();
        for (const {joints, weights} of sets) {
          const divisor = weights!.accessor.normalized
            ? weights!.accessor.componentType === 5121
              ? 255
              : 65535
            : 1;
          for (let componentIndex = 0; componentIndex < 4; componentIndex++) {
            const joint = readGLTFV1AccessorComponent(joints!, vertexIndex, componentIndex);
            const weight =
              readGLTFV1AccessorComponent(weights!, vertexIndex, componentIndex) / divisor;
            if (joint >= skin.joints.length || !Number.isFinite(weight) || weight < 0 || weight > 1)
              valid = false;
            if (weight > 0) {
              if (weightedJoints.has(joint)) valid = false;
              weightedJoints.add(joint);
              nonzeroWeights++;
            }
            sum += weight;
          }
        }
        if (!valid || Math.abs(sum - 1) > 2e-7 * Math.max(nonzeroWeights, 1)) {
          reportUnsupported(
            `${label} invalid palette index, repeated weighted joint, or weights not summing to one at vertex ${vertexIndex}`
          );
          break;
        }
      }
    }
  }
}
