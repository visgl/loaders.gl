// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTFWithBuffers} from '../types/gltf-types';
import {
  readGLTFV1AccessorComponent,
  type GLTFV1AccessorReader,
  type GLTFV1AccessorSource
} from './repack-gltf-v1-accessors';

/** Validate core attribute values, topology, vertex counts, and indices without repairing geometry. */
export function validateGLTFV1Geometry(
  gltf: GLTFWithBuffers,
  readAccessor: GLTFV1AccessorReader,
  reportUnsupported: (feature: string) => void
): void {
  const maximumIndices = new Map<number, number>();
  const checkedAttributes = new Set<string>();
  for (const [meshIndex, mesh] of (gltf.json.meshes || []).entries())
    for (const [primitiveIndex, primitive] of mesh.primitives.entries()) {
      const label = `mesh ${meshIndex} primitive ${primitiveIndex}`;
      for (const category of ['TEXCOORD', 'COLOR', 'JOINTS', 'WEIGHTS']) {
        const sets = Object.keys(primitive.attributes)
          .filter(semantic => semantic.startsWith(`${category}_`))
          .map(semantic => Number(semantic.slice(category.length + 1)))
          .sort((first, second) => first - second);
        if (sets.some((setIndex, index) => setIndex !== index))
          reportUnsupported(`${label} ${category} sets must be contiguous starting at zero`);
      }
      for (const [semantic, accessorIndex] of Object.entries(primitive.attributes)) {
        const category = semantic.split('_')[0];
        if (!['NORMAL', 'TANGENT', 'COLOR', 'TEXCOORD', 'JOINTS', 'WEIGHTS'].includes(category))
          continue;
        const key = `${category}:${accessorIndex}`;
        if (checkedAttributes.has(key)) continue;
        checkedAttributes.add(key);
        const source = readAccessor(accessorIndex, `${semantic} accessor ${accessorIndex}`);
        if (source)
          validateAttribute(
            source,
            category,
            `${semantic} accessor ${accessorIndex}`,
            reportUnsupported
          );
      }
      const counts = Object.values(primitive.attributes).map(accessorIndex => {
        const accessor = Number.isSafeInteger(accessorIndex)
          ? gltf.json.accessors?.[accessorIndex]
          : undefined;
        return accessor?.count;
      });
      if (
        !counts.length ||
        counts.some(count => !Number.isSafeInteger(count) || (count as number) < 1)
      ) {
        reportUnsupported(`${label} requires valid vertex attribute accessors`);
        continue;
      }
      if (counts.some(count => count !== counts[0]))
        reportUnsupported(`${label} vertex attribute counts do not match`);
      const drawCount =
        primitive.indices === undefined
          ? counts[0]
          : gltf.json.accessors?.[primitive.indices]?.count;
      const mode = primitive.mode === undefined ? 4 : primitive.mode;
      if (!Number.isInteger(mode) || mode < 0 || mode > 6)
        reportUnsupported(`${label} requires a primitive mode in [0, 6]`);
      else if (!primitive.extensions || !Object.keys(primitive.extensions).length) {
        if (
          !Number.isSafeInteger(drawCount) ||
          (drawCount as number) < 1 ||
          (mode === 1 && (drawCount as number) % 2 !== 0) ||
          ([2, 3].includes(mode) && (drawCount as number) < 2) ||
          (mode === 4 && (drawCount as number) % 3 !== 0) ||
          ([5, 6].includes(mode) && (drawCount as number) < 3)
        )
          reportUnsupported(
            `${label} draw count ${drawCount} is incompatible with primitive mode ${mode}`
          );
      }
      if (primitive.indices === undefined) continue;
      const source = readAccessor(primitive.indices, `${label} indices`);
      if (!source) continue;
      if (
        source.accessor.type !== 'SCALAR' ||
        ![5121, 5123, 5125].includes(source.accessor.componentType) ||
        source.accessor.normalized
      ) {
        reportUnsupported(`${label} indices require unnormalized unsigned SCALAR data`);
        continue;
      }
      let maximum = maximumIndices.get(primitive.indices);
      if (maximum === undefined) {
        maximum = 0;
        for (let elementIndex = 0; elementIndex < source.accessor.count; elementIndex++)
          maximum = Math.max(maximum, readGLTFV1AccessorComponent(source, elementIndex, 0));
        maximumIndices.set(primitive.indices, maximum);
      }
      if (counts.some(count => maximum! >= (count as number)))
        reportUnsupported(`${label} index ${maximum} is outside its vertex attribute counts`);
    }
}

/** Check standard dense attribute metadata and finite values, retaining invalid data for diagnostics. */
function validateAttribute(
  source: GLTFV1AccessorSource,
  category: string,
  label: string,
  reportUnsupported: (feature: string) => void
): void {
  const accessor = source.accessor;
  const isFloat = accessor.componentType === 5126 && !accessor.normalized;
  const isUnitInteger =
    [5121, 5123].includes(accessor.componentType) && accessor.normalized === true;
  const validNormalization =
    accessor.normalized === undefined || typeof accessor.normalized === 'boolean';
  const validType =
    category === 'NORMAL'
      ? accessor.type === 'VEC3' && isFloat
      : category === 'TANGENT'
        ? accessor.type === 'VEC4' && isFloat
        : category === 'JOINTS'
          ? accessor.type === 'VEC4' &&
            [5121, 5123].includes(accessor.componentType) &&
            !accessor.normalized
          : category === 'COLOR'
            ? ['VEC3', 'VEC4'].includes(accessor.type) && (isFloat || isUnitInteger)
            : accessor.type === (category === 'TEXCOORD' ? 'VEC2' : 'VEC4') &&
              (isFloat || isUnitInteger);
  if (!validNormalization || !validType) {
    reportUnsupported(
      `${label} has incompatible core attribute shape, component type, or normalization`
    );
    return;
  }
  for (let elementIndex = 0; elementIndex < accessor.count; elementIndex++) {
    const values = Array.from({length: source.rows}, (_, componentIndex) =>
      readGLTFV1AccessorComponent(source, elementIndex, componentIndex)
    );
    if (
      values.some(value => !Number.isFinite(value)) ||
      (['NORMAL', 'TANGENT'].includes(category) &&
        Math.abs(Math.hypot(...values.slice(0, 3)) - 1) > 1e-5) ||
      (category === 'TANGENT' && values[3] !== 1 && values[3] !== -1) ||
      (['COLOR', 'WEIGHTS'].includes(category) &&
        isFloat &&
        values.some(value => value < 0 || value > 1))
    ) {
      reportUnsupported(
        `${label} requires finite core values, unit directions, tangent handedness ±1, and colors/weights in [0, 1]`
      );
      return;
    }
  }
}
