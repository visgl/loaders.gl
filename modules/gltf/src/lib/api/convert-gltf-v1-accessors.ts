// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTF, GLTFAccessor, GLTFBufferView} from '../types/gltf-types';

/** The core use of an accessor after its references have been normalized. */
type AccessorUsage = 'vertex' | 'indices' | 'animation' | 'inverseBind' | 'unused' | 'mixed';

/** A glTF 1 accessor carries its own stride rather than a buffer-view stride. */
type LegacyAccessor = GLTFAccessor & {
  /** Byte distance between elements; zero or absence means tightly packed. */
  byteStride?: number;
};

/** Byte widths of component types usable in stable glTF 2. */
const COMPONENT_BYTE_LENGTHS: Record<number, number> = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4
};

/** Component counts of core scalar, vector, and matrix accessor types. */
const ELEMENT_COMPONENT_COUNTS: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

/**
 * Move legacy strides to compatible buffer views without modifying binary payloads.
 * Views are split by usage and stride so packed and interleaved accessors cannot affect each other.
 * Layouts requiring binary repacking remain intact and are queued until their buffers load.
 */
export function convertGLTFV1AccessorStrides(
  json: GLTF,
  queueRepacking: (accessorIndex: number) => void
): void {
  const accessors = (json.accessors || []) as LegacyAccessor[];
  const bufferViews = json.bufferViews || [];
  const usages = collectAccessorUsages(json);
  const convertedViews = new Map<string, number>();

  for (const [accessorIndex, accessor] of accessors.entries()) {
    const bufferViewIndex = accessor.bufferView;
    if (bufferViewIndex === undefined && !accessor.byteStride) {
      delete accessor.byteStride;
      continue;
    }
    const bufferView = bufferViews[bufferViewIndex as number];
    const usage = usages.get(accessorIndex) || 'unused';
    const elementByteLength = getLegacyElementByteLength(accessor);
    const byteStride =
      accessor.byteStride === 0 ? elementByteLength : (accessor.byteStride ?? elementByteLength);
    const byteOffset = accessor.byteOffset ?? 0;
    const bufferViewByteOffset = bufferView?.byteOffset ?? 0;
    const componentByteLength =
      typeof accessor.componentType === 'number' &&
      Object.hasOwn(COMPONENT_BYTE_LENGTHS, accessor.componentType)
        ? COMPONENT_BYTE_LENGTHS[accessor.componentType]
        : 0;
    const isVertex = usage === 'vertex';
    const hasCompatibleStride = isVertex
      ? byteStride >= elementByteLength &&
        byteStride >= 4 &&
        byteStride <= 252 &&
        byteStride % 4 === 0 &&
        byteOffset % 4 === 0 &&
        (bufferViewByteOffset + byteOffset) % 4 === 0
      : byteStride === elementByteLength;

    if (
      !bufferView ||
      !elementByteLength ||
      usage === 'mixed' ||
      !Number.isInteger(byteStride) ||
      !hasCompatibleStride ||
      (isVertex && byteStride > bufferView.byteLength) ||
      !Number.isInteger(accessor.count) ||
      accessor.count < 1 ||
      !Number.isInteger(byteOffset) ||
      byteOffset < 0 ||
      !Number.isInteger(bufferViewByteOffset) ||
      bufferViewByteOffset < 0 ||
      byteOffset % componentByteLength !== 0 ||
      (bufferViewByteOffset + byteOffset) % componentByteLength !== 0 ||
      (accessor.type.startsWith('MAT') && (bufferViewByteOffset + byteOffset) % 4 !== 0) ||
      !Number.isInteger(bufferView.byteLength) ||
      byteOffset + (accessor.count - 1) * byteStride + elementByteLength > bufferView.byteLength
    ) {
      queueRepacking(accessorIndex);
      continue;
    }

    // Keep image/extension views unchanged; accessors with different roles get separate views.
    const viewKey = `${bufferViewIndex}:${usage}:${isVertex ? byteStride : 0}`;
    let convertedViewIndex = convertedViews.get(viewKey);
    if (convertedViewIndex === undefined) {
      const convertedView: GLTFBufferView & {id?: string} = {...bufferView};
      delete convertedView.id;
      delete convertedView.byteStride;
      delete convertedView.target;
      if (isVertex) {
        convertedView.byteStride = byteStride;
        convertedView.target = 34962;
      } else if (usage === 'indices') {
        convertedView.target = 34963;
      }
      convertedViewIndex = bufferViews.length;
      bufferViews.push(convertedView);
      convertedViews.set(viewKey, convertedViewIndex);
    }
    accessor.bufferView = convertedViewIndex;
    delete accessor.byteStride;
  }
}

/** Track core accessor consumers so strides are only emitted for vertex attributes. */
function collectAccessorUsages(json: GLTF): Map<number, AccessorUsage> {
  const usages = new Map<number, AccessorUsage>();
  /** Record one use, preserving a diagnostic marker when consumers have incompatible roles. */
  const addUsage = (accessorIndex: number | undefined, usage: AccessorUsage): void => {
    if (accessorIndex === undefined) return;
    const previousUsage = usages.get(accessorIndex);
    usages.set(accessorIndex, previousUsage && previousUsage !== usage ? 'mixed' : usage);
  };
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives) {
      for (const accessorIndex of Object.values(primitive.attributes)) {
        addUsage(accessorIndex, 'vertex');
      }
      addUsage(primitive.indices, 'indices');
    }
  }
  for (const animation of json.animations || []) {
    for (const sampler of animation.samplers) {
      addUsage(sampler.input, 'animation');
      addUsage(sampler.output, 'animation');
    }
  }
  for (const skin of json.skins || []) {
    addUsage(skin.inverseBindMatrices, 'inverseBind');
  }
  return usages;
}

/** Return the legacy element width, excluding matrix layouts that require glTF 2 padding. */
function getLegacyElementByteLength(accessor: GLTFAccessor): number {
  const componentByteLength =
    typeof accessor.componentType === 'number' &&
    Object.hasOwn(COMPONENT_BYTE_LENGTHS, accessor.componentType)
      ? COMPONENT_BYTE_LENGTHS[accessor.componentType]
      : 0;
  const componentCount = Object.hasOwn(ELEMENT_COMPONENT_COUNTS, accessor.type)
    ? ELEMENT_COMPONENT_COUNTS[accessor.type]
    : 0;
  if (!componentByteLength || !componentCount) return 0;
  const columnComponentCount = accessor.type === 'MAT2' ? 2 : accessor.type === 'MAT3' ? 3 : 4;
  if (accessor.type.startsWith('MAT') && (columnComponentCount * componentByteLength) % 4 !== 0) {
    return 0;
  }
  return (componentByteLength || 0) * componentCount;
}
