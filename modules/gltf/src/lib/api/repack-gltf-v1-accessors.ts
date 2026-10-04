// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {padToNBytes} from '@loaders.gl/loader-utils';
import type {GLTF, GLTFWithBuffers, GLTFAccessor} from '../types/gltf-types';
import {appendGLTFV1BufferData, type GLTFV1BufferAppend} from './append-gltf-v1-buffer-data';

/** Accessors retain legacy strides until their binary conversion succeeds. */
type LegacyAccessor = GLTFAccessor & {
  /** Legacy element distance in bytes. */
  byteStride?: number;
};

/** Consumer role and interpretation used to separate shared source accessors. */
export type GLTFV1AccessorConversion = {
  /** Core consumer category. */
  readonly usage: 'vertex' | 'indices' | 'animation' | 'inverseBind' | 'unused';
  /** Required numeric interpretation. */
  readonly mode: 'copy' | 'joints' | 'weights' | 'unit' | 'signed';
  /** Standard semantic requiring this interpretation, when relevant. */
  readonly semantic?: string;
  /** Whether opaque extension consumers prevent interpreting or replacing source data. */
  readonly hasOpaqueConsumer?: boolean;
};

/** Validated legacy data span, with unpadded matrix columns. */
export type GLTFV1AccessorSource = {
  /** Buffer receiving the converted payload. */
  readonly bufferIndex: number;
  /** Source accessor. */
  readonly accessor: LegacyAccessor;
  /** Borrowed source bytes. */
  readonly data: DataView;
  /** Absolute start in the borrowed array buffer. */
  readonly byteOffset: number;
  /** Distance between source elements. */
  readonly byteStride: number;
  /** Source component width. */
  readonly componentSize: number;
  /** Rows per column (or vector). */
  readonly rows: number;
  /** One for scalar/vector accessors. */
  readonly columns: number;
};

/** Cached dense reader reporting invalid or unavailable payloads before semantic validation. */
export type GLTFV1AccessorReader = (
  accessorIndex: number,
  label: string
) => GLTFV1AccessorSource | null;

/** Supported component widths. */
const COMPONENT_SIZES: Record<number, number> = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4
};
/** Scalar/vector/matrix dimensions, avoiding untrusted property lookups. */
const DIMENSIONS: Record<string, readonly [number, number]> = {
  SCALAR: [1, 1],
  VEC2: [2, 1],
  VEC3: [3, 1],
  VEC4: [4, 1],
  MAT2: [2, 2],
  MAT3: [3, 3],
  MAT4: [4, 4]
};

/** Split consumers before moving strides so incompatible numeric meanings never share metadata. */
export function prepareGLTFV1AccessorConversions(
  json: GLTF
): Map<number, GLTFV1AccessorConversion> {
  const accessors = (json.accessors || []) as LegacyAccessor[];
  const variants = new Map<number, Map<string, number>>();
  const conversions = new Map<number, GLTFV1AccessorConversion>();
  const hasOpaqueConsumers = hasOpaqueAttributeConsumers(json);
  /** Reuse the same source/interpretation pair and clone only distinct consumers. */
  const bindAccessor = (sourceIndex: number, conversion: GLTFV1AccessorConversion): number => {
    if (
      !Number.isSafeInteger(sourceIndex) ||
      sourceIndex < 0 ||
      !Object.hasOwn(accessors, sourceIndex)
    )
      return sourceIndex;
    const source = accessors[sourceIndex];
    if (!source) return sourceIndex;
    const bindings = variants.get(sourceIndex) || new Map<string, number>();
    const key = `${conversion.usage}:${conversion.mode}:${['unit', 'signed'].includes(conversion.mode) ? conversion.semantic?.split('_')[0] : ''}:${conversion.hasOpaqueConsumer ? 'opaque' : ''}`;
    let accessorIndex = bindings.get(key);
    if (accessorIndex === undefined) {
      accessorIndex = bindings.size ? accessors.length : sourceIndex;
      if (bindings.size) accessors.push({...source});
      bindings.set(key, accessorIndex);
      conversions.set(accessorIndex, conversion);
      variants.set(sourceIndex, bindings);
    }
    return accessorIndex;
  };
  for (const mesh of json.meshes || [])
    for (const primitive of mesh.primitives) {
      for (const [semantic, accessorIndex] of Object.entries(primitive.attributes)) {
        const accessor = accessors[accessorIndex];
        const mode = /^JOINTS_\d+$/.test(semantic)
          ? 'joints'
          : /^(COLOR|WEIGHTS|TEXCOORD)_\d+$/.test(semantic) &&
              accessor &&
              [5120, 5122].includes(accessor.componentType)
            ? 'signed'
            : /^(COLOR|WEIGHTS|TEXCOORD)_\d+$/.test(semantic) &&
                accessor &&
                [5121, 5123].includes(accessor.componentType) &&
                !accessor.normalized
              ? 'unit'
              : /^WEIGHTS_\d+$/.test(semantic)
                ? 'weights'
                : 'copy';
        primitive.attributes[semantic] = bindAccessor(accessorIndex, {
          usage: 'vertex',
          mode,
          semantic,
          ...(mode === 'signed' ? {hasOpaqueConsumer: hasOpaqueConsumers} : {})
        });
      }
      if (primitive.indices !== undefined)
        primitive.indices = bindAccessor(primitive.indices, {
          usage: 'indices',
          mode: 'copy',
          hasOpaqueConsumer: primitive.extensions !== undefined
        });
    }
  for (const animation of json.animations || [])
    for (const sampler of animation.samplers) {
      sampler.input = bindAccessor(sampler.input, {usage: 'animation', mode: 'copy'});
      sampler.output = bindAccessor(sampler.output, {usage: 'animation', mode: 'copy'});
    }
  for (const skin of json.skins || [])
    if (skin.inverseBindMatrices !== undefined) {
      skin.inverseBindMatrices = bindAccessor(skin.inverseBindMatrices, {
        usage: 'inverseBind',
        mode: 'copy'
      });
    }
  for (let accessorIndex = 0; accessorIndex < accessors.length; accessorIndex++) {
    if (!conversions.has(accessorIndex))
      conversions.set(accessorIndex, {usage: 'unused', mode: 'copy'});
  }
  return conversions;
}

/** Repack safe source spans and convert standard attributes after linked buffers become available. */
export function repackGLTFV1Accessors(
  gltf: GLTFWithBuffers,
  conversions: Map<number, GLTFV1AccessorConversion>,
  pending: Set<number>,
  reportUnsupported: (feature: string) => void,
  reportNote: (message: string) => void
): void {
  const plans: GLTFV1BufferAppend[] = [];
  const metadataUpdates: Array<() => void> = [];
  for (const [accessorIndex, conversion] of conversions) {
    const accessor = gltf.json.accessors![accessorIndex];
    const isInfluence =
      conversion.mode === 'joints' ||
      conversion.mode === 'weights' ||
      conversion.semantic?.startsWith('WEIGHTS_');
    const padInfluences = Boolean(
      isInfluence && ['SCALAR', 'VEC2', 'VEC3'].includes(accessor.type)
    );
    const convertWeights =
      conversion.mode === 'weights' &&
      (accessor.type !== 'VEC4' ||
        ![5121, 5123, 5126].includes(accessor.componentType) ||
        (accessor.componentType === 5126 && accessor.normalized));
    const convertSigned = conversion.mode === 'signed';
    const convertJoints =
      conversion.mode === 'joints' &&
      (![5121, 5123].includes(accessor.componentType) ||
        accessor.normalized ||
        accessor.type !== 'VEC4');
    if (
      !pending.has(accessorIndex) &&
      !convertJoints &&
      !convertWeights &&
      !convertSigned &&
      !padInfluences &&
      conversion.usage !== 'indices' &&
      conversion.mode !== 'unit'
    )
      continue;
    const source = validateGLTFV1AccessorSource(gltf, accessorIndex);
    if (typeof source === 'string') {
      reportUnsupported(`accessor ${accessorIndex} layout requires binary repacking: ${source}`);
      continue;
    }
    if (isInfluence && !['SCALAR', 'VEC2', 'VEC3', 'VEC4'].includes(accessor.type)) {
      reportUnsupported(`accessor ${accessorIndex} skin influences require scalar/vector data`);
      continue;
    }
    if (
      conversion.mode === 'weights' &&
      (![5121, 5123, 5126].includes(accessor.componentType) ||
        (accessor.componentType === 5126 && accessor.normalized) ||
        (accessor.componentType !== 5126 && !accessor.normalized))
    ) {
      reportUnsupported(
        `accessor ${accessorIndex} weights require FLOAT or normalized unsigned data`
      );
      continue;
    }
    let componentType = accessor.componentType;
    let normalized = accessor.normalized;
    if (convertSigned) {
      if (conversion.hasOpaqueConsumer) {
        reportUnsupported(
          `accessor ${accessorIndex} signed conversion cannot interpret opaque extension consumers`
        );
        continue;
      }
      const supportedTypes = conversion.semantic?.startsWith('COLOR_')
        ? ['VEC3', 'VEC4']
        : conversion.semantic?.startsWith('WEIGHTS_')
          ? ['SCALAR', 'VEC2', 'VEC3', 'VEC4']
          : ['VEC2'];
      if (
        !supportedTypes.includes(accessor.type) ||
        (normalized !== undefined && typeof normalized !== 'boolean')
      ) {
        reportUnsupported(
          `accessor ${accessorIndex} signed ${conversion.semantic} has incompatible shape or normalization`
        );
        continue;
      }
      let valid = true;
      for (let elementIndex = 0; elementIndex < accessor.count; elementIndex++)
        for (let componentIndex = 0; componentIndex < source.rows; componentIndex++) {
          const value = readSignedAttributeComponent(source, elementIndex, componentIndex);
          if (!conversion.semantic?.startsWith('TEXCOORD_') && (value < 0 || value > 1))
            valid = false;
        }
      if (!valid) {
        reportUnsupported(
          `accessor ${accessorIndex} signed ${conversion.semantic} values must remain in [0, 1]`
        );
        continue;
      }
      componentType = 5126;
      normalized = false;
    }
    if (conversion.usage === 'indices') {
      if (accessor.type !== 'SCALAR' || ![5121, 5123, 5125].includes(componentType) || normalized) {
        reportUnsupported(
          `index accessor ${accessorIndex} requires unnormalized unsigned SCALAR data`
        );
        continue;
      }
      let maximum = 0;
      for (let elementIndex = 0; elementIndex < accessor.count; elementIndex++)
        maximum = Math.max(maximum, readGLTFV1AccessorComponent(source, elementIndex, 0));
      const sentinel = componentType === 5121 ? 255 : componentType === 5123 ? 65535 : 4294967295;
      if (maximum === sentinel) {
        if (conversion.hasOpaqueConsumer) {
          reportUnsupported(
            `index accessor ${accessorIndex} cannot widen opaque primitive extension semantics`
          );
          continue;
        }
        if (componentType === 5125) {
          reportUnsupported(
            `index accessor ${accessorIndex} contains the unrepresentable uint32 restart value`
          );
          continue;
        }
        componentType = componentType === 5121 ? 5123 : 5125;
      }
      if (!pending.has(accessorIndex) && componentType === accessor.componentType) continue;
    }
    if (convertJoints || conversion.mode === 'unit') {
      if (convertJoints && accessor.normalized) {
        reportUnsupported(
          `accessor ${accessorIndex} joint indices require unnormalized scalar/vector data`
        );
        continue;
      }
      if (conversion.mode === 'unit') {
        const supportedTypes = conversion.semantic?.startsWith('COLOR_')
          ? ['VEC3', 'VEC4']
          : conversion.semantic?.startsWith('WEIGHTS_')
            ? ['SCALAR', 'VEC2', 'VEC3', 'VEC4']
            : ['VEC2'];
        if (!supportedTypes.includes(accessor.type)) {
          reportUnsupported(
            `accessor ${accessorIndex} integer ${conversion.semantic} has an incompatible shape`
          );
          continue;
        }
      }
      let maximum = 0;
      let valid = true;
      for (let elementIndex = 0; elementIndex < accessor.count; elementIndex++)
        for (
          let componentIndex = 0;
          componentIndex < source.rows * source.columns;
          componentIndex++
        ) {
          const value = readGLTFV1AccessorComponent(source, elementIndex, componentIndex);
          if (!Number.isInteger(value) || value < 0 || (convertJoints && value > 65535))
            valid = false;
          maximum = Math.max(maximum, value);
        }
      if (!valid) {
        reportUnsupported(
          `accessor ${accessorIndex} joint indices require finite integers in [0, 65535]`
        );
        continue;
      }
      if (convertJoints) {
        componentType = maximum <= 255 ? 5121 : 5123;
        normalized = false;
      } else if (maximum <= 1) {
        // glTF 1 has no normalized flag: preserve literal 0/1 shader inputs as FLOATs.
        componentType = 5126;
        normalized = false;
      } else {
        reportUnsupported(
          `accessor ${accessorIndex} ambiguous integer attribute normalization; best effort assumes normalized unsigned values`
        );
        normalized = true;
        if (!pending.has(accessorIndex) && !padInfluences) {
          metadataUpdates.push(() => {
            accessor.normalized = true;
          });
          continue;
        }
      }
    }
    const targetRows = padInfluences ? 4 : source.rows;
    const componentSize = COMPONENT_SIZES[componentType];
    const columnSize =
      source.columns > 1 ? padToNBytes(source.rows * componentSize, 4) : targetRows * componentSize;
    const elementSize = columnSize * source.columns;
    const byteStride = conversion.usage === 'vertex' ? padToNBytes(elementSize, 4) : elementSize;
    const bytes = new ArrayBuffer(accessor.count * byteStride);
    const outputBytes = new Uint8Array(bytes);
    const sourceBytes = new Uint8Array(source.data.buffer);
    const outputData = new DataView(bytes);
    for (let elementIndex = 0; elementIndex < accessor.count; elementIndex++) {
      for (let columnIndex = 0; columnIndex < source.columns; columnIndex++) {
        if (componentType === accessor.componentType) {
          const sourceOffset =
            source.byteOffset +
            elementIndex * source.byteStride +
            columnIndex * source.rows * source.componentSize;
          outputBytes.set(
            sourceBytes.subarray(sourceOffset, sourceOffset + source.rows * source.componentSize),
            elementIndex * byteStride + columnIndex * columnSize
          );
        } else
          for (let rowIndex = 0; rowIndex < source.rows; rowIndex++) {
            const value = (
              convertSigned ? readSignedAttributeComponent : readGLTFV1AccessorComponent
            )(source, elementIndex, columnIndex * source.rows + rowIndex);
            const outputOffset =
              elementIndex * byteStride + columnIndex * columnSize + rowIndex * componentSize;
            if (componentType === 5126) outputData.setFloat32(outputOffset, value, true);
            else if (componentType === 5121) outputData.setUint8(outputOffset, value);
            else if (componentType === 5125) outputData.setUint32(outputOffset, value, true);
            else outputData.setUint16(outputOffset, value, true);
          }
      }
    }
    plans.push({
      bufferIndex: source.bufferIndex,
      bytes,
      ...(conversion.usage === 'vertex'
        ? {byteStride, target: 34962}
        : conversion.usage === 'indices'
          ? {target: 34963}
          : {}),
      apply: bufferViewIndex => {
        if (convertSigned)
          reportNote(
            `Converted signed ${conversion.semantic} accessor ${accessorIndex} to FLOAT, preserving ${source.accessor.normalized ? 'explicitly normalized' : 'literal'} values.`
          );
        if (conversion.usage === 'indices' && componentType !== accessor.componentType)
          reportNote(
            `Widened index accessor ${accessorIndex} to preserve a glTF 1 index reserved by glTF 2.`
          );
        accessor.bufferView = bufferViewIndex;
        accessor.byteOffset = 0;
        delete (accessor as LegacyAccessor).byteStride;
        if (componentType !== accessor.componentType || padInfluences) {
          delete accessor.min;
          delete accessor.max;
        }
        accessor.componentType = componentType;
        if (padInfluences) accessor.type = 'VEC4';
        if (normalized) accessor.normalized = true;
        else delete accessor.normalized;
      }
    });
  }
  appendGLTFV1BufferData(gltf, plans);
  for (const update of metadataUpdates) update();
}

/** Decode only explicitly normalized signed integers; otherwise retain literal shader inputs. */
function readSignedAttributeComponent(
  source: GLTFV1AccessorSource,
  elementIndex: number,
  componentIndex: number
): number {
  const value = readGLTFV1AccessorComponent(source, elementIndex, componentIndex);
  return source.accessor.normalized === true
    ? Math.max(value / (source.accessor.componentType === 5120 ? 127 : 32767), -1)
    : value;
}

/** Unknown extension owners may reference source accessors outside the core consumer inventory. */
function hasOpaqueAttributeConsumers(json: GLTF): boolean {
  const pending: unknown[] = [json];
  const visited = new Set<object>();
  while (pending.length) {
    const object = pending.pop();
    if (!object || typeof object !== 'object' || visited.has(object)) continue;
    visited.add(object);
    for (const [field, value] of Object.entries(object)) {
      if (field === 'extras') continue;
      if (
        field === 'extensions' &&
        value &&
        typeof value === 'object' &&
        Object.keys(value).some(
          name => !['KHR_materials_unlit', 'KHR_materials_common'].includes(name)
        )
      )
        return true;
      pending.push(value);
    }
  }
  return false;
}

/** Validate logical and borrowed spans before reading any bytes; alignment can be repaired. */
export function validateGLTFV1AccessorSource(
  gltf: GLTFWithBuffers,
  accessorIndex: number
): GLTFV1AccessorSource | string {
  const accessor = gltf.json.accessors?.[accessorIndex] as LegacyAccessor | undefined;
  if (!accessor || !Number.isSafeInteger(accessorIndex) || accessorIndex < 0)
    return 'invalid accessor reference';
  const componentSize =
    typeof accessor.componentType === 'number' &&
    Object.hasOwn(COMPONENT_SIZES, accessor.componentType)
      ? COMPONENT_SIZES[accessor.componentType]
      : undefined;
  const dimensions =
    typeof accessor.type === 'string' && Object.hasOwn(DIMENSIONS, accessor.type)
      ? DIMENSIONS[accessor.type]
      : undefined;
  if (!componentSize || !dimensions || !Number.isSafeInteger(accessor.count) || accessor.count < 1)
    return 'invalid component type, shape, or count';
  const [rows, columns] = dimensions;
  const view = gltf.json.bufferViews?.[accessor.bufferView as number];
  const definition = gltf.json.buffers?.[view?.buffer as number];
  const loaded = gltf.buffers[view?.buffer as number];
  if (!view || !definition || !loaded) return 'requires a loaded accessor buffer';
  if (accessor.sparse || accessor.extensions || view.extensions)
    return 'sparse or extension-bearing data is unsupported';
  const elementSize = rows * columns * componentSize;
  const sourceStride = accessor.byteStride ?? view.byteStride ?? elementSize;
  const byteStride = sourceStride === 0 ? elementSize : sourceStride;
  const accessorOffset = accessor.byteOffset ?? 0;
  const viewOffset = view.byteOffset ?? 0;
  if (
    !(loaded.arrayBuffer instanceof ArrayBuffer) ||
    !Number.isSafeInteger(byteStride) ||
    byteStride < elementSize ||
    (accessor.byteStride !== undefined && accessor.byteStride > 255) ||
    !Number.isSafeInteger(accessorOffset) ||
    accessorOffset < 0 ||
    !Number.isSafeInteger(viewOffset) ||
    viewOffset < 0 ||
    !Number.isSafeInteger(view.byteLength) ||
    view.byteLength < 1 ||
    !Number.isSafeInteger(definition.byteLength) ||
    definition.byteLength < 1 ||
    viewOffset + view.byteLength > definition.byteLength ||
    accessorOffset + (accessor.count - 1) * byteStride + elementSize > view.byteLength ||
    !Number.isSafeInteger(loaded.byteOffset) ||
    loaded.byteOffset < 0 ||
    !Number.isSafeInteger(loaded.byteLength) ||
    loaded.byteLength < definition.byteLength ||
    loaded.byteOffset + loaded.byteLength > loaded.arrayBuffer.byteLength
  )
    return 'invalid source buffer span or stride';
  return {
    accessor,
    bufferIndex: view.buffer,
    componentSize,
    rows,
    columns,
    byteStride,
    data: new DataView(loaded.arrayBuffer),
    byteOffset: loaded.byteOffset + viewOffset + accessorOffset
  };
}

/** Read one little-endian raw component without requiring backing-buffer alignment. */
export function readGLTFV1AccessorComponent(
  source: GLTFV1AccessorSource,
  elementIndex: number,
  componentIndex: number
): number {
  const byteOffset =
    source.byteOffset + elementIndex * source.byteStride + componentIndex * source.componentSize;
  switch (source.accessor.componentType) {
    case 5120:
      return source.data.getInt8(byteOffset);
    case 5121:
      return source.data.getUint8(byteOffset);
    case 5122:
      return source.data.getInt16(byteOffset, true);
    case 5123:
      return source.data.getUint16(byteOffset, true);
    case 5125:
      return source.data.getUint32(byteOffset, true);
    default:
      return source.data.getFloat32(byteOffset, true);
  }
}
