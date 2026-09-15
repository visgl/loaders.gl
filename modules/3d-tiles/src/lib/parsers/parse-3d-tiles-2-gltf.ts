// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {
  GLTF,
  GLTFAccessor,
  GLTFBoundingVolume,
  GLTFFile,
  GLTFNode,
  GLTFShape,
  GLTFWithBuffers
} from '@loaders.gl/gltf';
import {GLTFScenegraph} from '@loaders.gl/gltf';
import {Matrix4} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {CachedUriResolver} from '@loaders.gl/loader-utils';
import type {ParsedImplicitSubtree} from '@loaders.gl/tiles';
import type {
  Tile3DBoundingVolume,
  Tiles3DTileContentJSON,
  Tiles3DTileJSON,
  Tiles3DTilesetJSON
} from '../../types';
import {convertS2BoundingVolumetoOBB} from '../utils/obb/s2-corners-to-obb';

const TILESET_EXTENSION = '3DTILES_tileset';
const SUBTREE_EXTENSION = '3DTILES_subtree';
const IMPLICIT_TILING_EXTENSION = '3DTILES_implicit_tiling';
const VECTOR_EXTENSION = '3DTILES_tileset_vectors';

/** Internal, structured-cloneable description of one glTF package file. */
export type Tiles3DPackageFile = {
  name?: string;
  mimeType: string;
  uri?: string;
  originalUri?: string;
  data?: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
  bufferUri?: string;
};

/** Internal reference from a normalized tile content header into its owning glTF package. */
export type Tiles3DPackageResource = {
  fileIndex: number;
  files: Tiles3DPackageFile[];
};

/** Tests whether parsed glTF is a draft 3D Tiles 2.0 tileset. */
export function is3DTiles2Tileset(gltf: GLTFWithBuffers): boolean {
  return isRecord(gltf.json.extensions?.[TILESET_EXTENSION]);
}

/** Tests whether parsed glTF is a draft 3D Tiles 2.0 subtree resource. */
export function is3DTiles2Subtree(gltf: GLTFWithBuffers): boolean {
  return isRecord(gltf.json.extensions?.[SUBTREE_EXTENSION]);
}

/**
 * Parses a draft glTF subtree into the shared lazy implicit-tiling representation.
 *
 * @param gltf - Parsed subtree glTF container.
 * @param basePath - Base path used to resolve package references.
 * @param inheritedPackageFiles - Parent package records available to embedded subtree resources.
 * @returns Parsed subtree data and lazy package records.
 */
export function parse3DTiles2Subtree(
  gltf: GLTFWithBuffers,
  basePath: string,
  inheritedPackageFiles?: Tiles3DPackageFile[]
): ParsedImplicitSubtree {
  const extension = gltf.json.extensions?.[SUBTREE_EXTENSION] as DraftSubtreeExtension | undefined;
  if (!extension || !isRecord(extension.tileAvailability)) {
    throw new Error('3DTILES_subtree: tileAvailability is required');
  }
  if (!isRecord(extension.childSubtreeAvailability)) {
    throw new Error('3DTILES_subtree: childSubtreeAvailability is required');
  }
  const scenegraph = new GLTFScenegraph(gltf);
  const structuralMetadata = gltf.json.extensions?.['EXT_structural_metadata'] as
    | DraftStructuralMetadata
    | undefined;
  const propertyTables = structuralMetadata?.propertyTables;
  const tilePropertyRows = decodePropertyTableRows(
    structuralMetadata,
    extension.tileProperties,
    'tile'
  );
  const contentPropertyRows = decodePropertyTableRows(
    structuralMetadata,
    extension.contentProperties,
    'content'
  );
  return {
    tileAvailability: parseSubtreeAvailability(gltf, extension.tileAvailability, 'tile'),
    contentAvailability: extension.contentAvailability
      ? parseSubtreeAvailability(gltf, extension.contentAvailability, 'content')
      : undefined,
    childSubtreeAvailability: parseSubtreeAvailability(
      gltf,
      extension.childSubtreeAvailability,
      'child subtree'
    ),
    tileAttributes: parseSubtreeAttributes(scenegraph, extension.tileAttributes, 'tile'),
    contentAttributes: parseSubtreeAttributes(scenegraph, extension.contentAttributes, 'content'),
    propertyTables,
    tileProperties: extension.tileProperties,
    contentProperties: extension.contentProperties,
    tilePropertyRows,
    contentPropertyRows,
    tileTemplatePropertyRows: filterTemplatePropertyRows(
      structuralMetadata,
      extension.tileProperties,
      tilePropertyRows
    ),
    contentTemplatePropertyRows: filterTemplatePropertyRows(
      structuralMetadata,
      extension.contentProperties,
      contentPropertyRows
    ),
    resourceFiles: createPackageFiles(gltf, new CachedUriResolver(basePath), inheritedPackageFiles)
  };
}

/**
 * Finds the buffers needed to decode a draft subtree hierarchy while leaving package content lazy.
 *
 * @param json - Parsed glTF JSON containing `3DTILES_subtree`.
 * @returns Unique buffer indices referenced by availability, attributes, or property tables.
 */
export function get3DTiles2SubtreeBufferIndices(json: GLTF): number[] {
  const bufferViewIndices = get3DTiles2SubtreeBufferViewIndices(json);
  const bufferIndices = new Set<number>();
  for (const bufferViewIndex of bufferViewIndices) {
    const bufferView = json.bufferViews?.[bufferViewIndex];
    const bufferIndex = bufferView?.buffer;
    if (Number.isInteger(bufferIndex)) {
      bufferIndices.add(bufferIndex as number);
    }
    const meshoptExtension =
      bufferView?.extensions?.KHR_meshopt_compression ||
      bufferView?.extensions?.EXT_meshopt_compression;
    if (Number.isInteger(meshoptExtension?.buffer)) {
      bufferIndices.add(meshoptExtension.buffer);
    }
  }
  return Array.from(bufferIndices);
}

/**
 * Finds buffer views needed to decode a draft subtree hierarchy.
 *
 * @param json - Parsed glTF JSON containing `3DTILES_subtree`.
 * @returns Unique buffer-view indices referenced by hierarchy data.
 */
export function get3DTiles2SubtreeBufferViewIndices(json: GLTF): number[] {
  const bufferViewIndices = new Set<number>();
  const addBufferView = (value: unknown): void => {
    if (Number.isInteger(value)) {
      bufferViewIndices.add(value as number);
    }
  };
  const extension = json.extensions?.[SUBTREE_EXTENSION] as DraftSubtreeExtension | undefined;
  const contentAvailability = extension?.contentAvailability as
    | DraftAvailability
    | DraftAvailability[]
    | undefined;
  const availabilityValues = [
    extension?.tileAvailability,
    extension?.childSubtreeAvailability,
    ...(Array.isArray(contentAvailability) ? contentAvailability : [contentAvailability])
  ];
  for (const availability of availabilityValues) {
    addBufferView(availability?.bitstream);
  }
  for (const attributes of [extension?.tileAttributes, extension?.contentAttributes]) {
    for (const accessorValue of Object.values(attributes || {})) {
      if (!Number.isInteger(accessorValue)) {
        continue;
      }
      const accessor = json.accessors?.[accessorValue as number];
      addBufferView(accessor?.bufferView);
      addBufferView(accessor?.sparse?.indices.bufferView);
      addBufferView(accessor?.sparse?.values.bufferView);
    }
  }
  const structuralMetadata = json.extensions?.['EXT_structural_metadata'] as
    | DraftStructuralMetadata
    | undefined;
  for (const propertyTable of structuralMetadata?.propertyTables || []) {
    for (const property of Object.values(propertyTable.properties || {})) {
      addBufferView(property.values);
      addBufferView(property.arrayOffsets);
      addBufferView(property.stringOffsets);
    }
  }
  return Array.from(bufferViewIndices);
}

type DraftAvailability = {constant?: unknown; bitstream?: unknown};
type DraftSubtreeExtension = {
  tileAvailability?: DraftAvailability;
  contentAvailability?: DraftAvailability;
  childSubtreeAvailability?: DraftAvailability;
  tileAttributes?: Record<string, unknown>;
  contentAttributes?: Record<string, unknown>;
  tileProperties?: unknown;
  contentProperties?: unknown;
};
type DraftStructuralMetadata = {
  schema?: {
    classes?: Record<string, {properties?: Record<string, DraftStructuralMetadataClassProperty>}>;
    enums?: Record<string, {values?: Array<{name: string; value: number}>}>;
  };
  propertyTables?: Array<{
    class?: string;
    count?: number;
    properties?: Record<string, DraftStructuralMetadataTableProperty>;
  }>;
};
type DraftStructuralMetadataClassProperty = {
  type?: string;
  componentType?: string;
  enumType?: string;
  array?: boolean;
  count?: number;
  required?: boolean;
  normalized?: boolean;
  noData?: unknown;
  default?: unknown;
  offset?: number | number[];
  scale?: number | number[];
};
type DraftStructuralMetadataTableProperty = {
  data?: ArrayLike<unknown>;
  values?: number;
  arrayOffsets?: number;
  stringOffsets?: number;
  offset?: number | number[];
  scale?: number | number[];
};

/** Resolves one constant- or buffer-view-backed availability declaration. */
function parseSubtreeAvailability(
  gltf: GLTFWithBuffers,
  availability: DraftAvailability,
  label: string
): {constant?: number; explicitBitstream?: Uint8Array} {
  if (availability.constant === 0 || availability.constant === 1) {
    if (availability.bitstream !== undefined) {
      throw new Error(`3DTILES_subtree: ${label} availability has two data sources`);
    }
    return {constant: availability.constant};
  }
  if (!Number.isInteger(availability.bitstream)) {
    throw new Error(`3DTILES_subtree: ${label} availability requires constant or bitstream`);
  }
  const bufferViewIndex = availability.bitstream as number;
  const bufferView = gltf.json.bufferViews?.[bufferViewIndex];
  const buffer = bufferView && gltf.buffers?.[bufferView.buffer];
  if (!bufferView || !buffer) {
    throw new Error(
      `3DTILES_subtree: ${label} availability references missing bufferView ${bufferViewIndex}`
    );
  }
  const byteOffset = buffer.byteOffset + (bufferView.byteOffset || 0);
  return {
    explicitBitstream: new Uint8Array(buffer.arrayBuffer, byteOffset, bufferView.byteLength)
  };
}

/** Decodes and validates subtree attribute accessors by their standard semantics. */
function parseSubtreeAttributes(
  scenegraph: GLTFScenegraph,
  attributes: Record<string, unknown> | undefined,
  label: string
): Record<string, ArrayLike<number>> | undefined {
  if (!attributes) {
    return undefined;
  }
  const result: Record<string, ArrayLike<number>> = {};
  for (const [semantic, accessorValue] of Object.entries(attributes)) {
    if (!Number.isInteger(accessorValue)) {
      throw new Error(`3DTILES_subtree: ${label} attribute ${semantic} has an invalid accessor`);
    }
    const accessorIndex = accessorValue as number;
    const accessor = scenegraph.json.accessors?.[accessorIndex];
    if (!accessor) {
      throw new Error(
        `3DTILES_subtree: ${label} attribute ${semantic} references missing accessor ${accessorIndex}`
      );
    }
    validateSubtreeAttributeAccessor(accessor, semantic, label);
    result[semantic] = getMaterializedSubtreeAccessor(scenegraph, accessorIndex, accessor);
  }
  return result;
}

/** Materializes a standard subtree accessor, including implicit-zero and sparse storage. */
function getMaterializedSubtreeAccessor(
  scenegraph: GLTFScenegraph,
  accessorIndex: number,
  accessor: GLTFAccessor
): ArrayLike<number> {
  const componentCount = getAccessorComponentCount(accessor.type);
  const ArrayType = getSubtreeAccessorArrayType(accessor.componentType);
  let values =
    accessor.bufferView === undefined
      ? new ArrayType(accessor.count * componentCount)
      : (scenegraph.getTypedArrayForAccessor(accessorIndex) as NumericSubtreeArray);
  if (!accessor.sparse) {
    return values;
  }
  const materializedValues = new ArrayType(values.length);
  materializedValues.set(values);
  values = materializedValues;
  const sparseIndices = getSubtreeBufferViewValues(
    scenegraph,
    accessor.sparse.indices.bufferView,
    accessor.sparse.indices.byteOffset || 0,
    getSubtreeAccessorArrayType(accessor.sparse.indices.componentType),
    accessor.sparse.count,
    `accessor ${accessorIndex} sparse indices`
  );
  const sparseValues = getSubtreeBufferViewValues(
    scenegraph,
    accessor.sparse.values.bufferView,
    accessor.sparse.values.byteOffset || 0,
    ArrayType,
    accessor.sparse.count * componentCount,
    `accessor ${accessorIndex} sparse values`
  );
  for (let sparseIndex = 0; sparseIndex < accessor.sparse.count; sparseIndex++) {
    const targetIndex = Number(sparseIndices[sparseIndex]);
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= accessor.count) {
      throw new Error(`3DTILES_subtree: accessor ${accessorIndex} sparse index is out of bounds`);
    }
    for (let componentIndex = 0; componentIndex < componentCount; componentIndex++) {
      values[targetIndex * componentCount + componentIndex] =
        sparseValues[sparseIndex * componentCount + componentIndex];
    }
  }
  return values;
}

type NumericSubtreeArray = Uint8Array | Uint16Array | Uint32Array | Float64Array;
type NumericSubtreeArrayConstructor =
  | Uint8ArrayConstructor
  | Uint16ArrayConstructor
  | Uint32ArrayConstructor
  | Float64ArrayConstructor;

/** Returns the typed-array constructor for supported subtree accessor components. */
function getSubtreeAccessorArrayType(componentType: number): NumericSubtreeArrayConstructor {
  switch (componentType) {
    case 5121:
      return Uint8Array;
    case 5123:
      return Uint16Array;
    case 5125:
      return Uint32Array;
    case 5130:
      return Float64Array;
    default:
      throw new Error(`3DTILES_subtree: unsupported accessor component type ${componentType}`);
  }
}

/** Returns the number of scalar components in one accessor element. */
function getAccessorComponentCount(accessorType: string): number {
  const componentCount = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
  }[accessorType];
  if (!componentCount) {
    throw new Error(`3DTILES_subtree: unsupported accessor type ${accessorType}`);
  }
  return componentCount;
}

/** Reads tightly packed sparse components from one loaded subtree buffer view. */
function getSubtreeBufferViewValues(
  scenegraph: GLTFScenegraph,
  bufferViewIndex: number,
  localByteOffset: number,
  ArrayType: NumericSubtreeArrayConstructor,
  count: number,
  label: string
): NumericSubtreeArray {
  const bufferView = scenegraph.gltf.json.bufferViews?.[bufferViewIndex];
  const buffer = bufferView && scenegraph.gltf.buffers?.[bufferView.buffer];
  const byteLength = count * ArrayType.BYTES_PER_ELEMENT;
  if (!bufferView || !buffer) {
    throw new Error(`3DTILES_subtree: ${label} references missing bufferView ${bufferViewIndex}`);
  }
  if (localByteOffset + byteLength > bufferView.byteLength) {
    throw new Error(`3DTILES_subtree: ${label} exceeds bufferView ${bufferViewIndex}`);
  }
  const byteOffset = buffer.byteOffset + (bufferView.byteOffset || 0) + localByteOffset;
  if (byteOffset % ArrayType.BYTES_PER_ELEMENT === 0) {
    return new ArrayType(buffer.arrayBuffer, byteOffset, count);
  }
  const bytes = new Uint8Array(buffer.arrayBuffer, byteOffset, byteLength);
  const alignedBytes = new Uint8Array(byteLength);
  alignedBytes.set(bytes);
  return new ArrayType(alignedBytes.buffer, 0, count);
}

/** Enforces the accessor layouts assigned to standard subtree attribute semantics. */
function validateSubtreeAttributeAccessor(
  accessor: {type: string; componentType: number},
  semantic: string,
  label: string
): void {
  const expected = {
    TILE_BOUNDING_BOX: ['MAT4', 5130],
    TILE_BOUNDING_SPHERE: ['VEC4', 5130],
    TILE_GEOMETRIC_ERROR: ['SCALAR', 5130],
    TILE_REFINE: ['SCALAR', 5121],
    TILE_TRANSFORM: ['MAT4', 5130],
    CONTENT_BOUNDING_BOX: ['MAT4', 5130],
    CONTENT_BOUNDING_SPHERE: ['VEC4', 5130]
  }[semantic] as [string, number] | undefined;
  if (expected && (accessor.type !== expected[0] || accessor.componentType !== expected[1])) {
    throw new Error(
      `3DTILES_subtree: ${label} attribute ${semantic} requires ${expected[0]}/${expected[1]}`
    );
  }
}

/** Decodes one referenced structural-metadata property table into application-facing rows. */
function decodePropertyTableRows(
  metadata: DraftStructuralMetadata | undefined,
  tableValue: unknown,
  label: string
): Array<Record<string, unknown>> | undefined {
  if (tableValue === undefined) {
    return undefined;
  }
  if (!Number.isInteger(tableValue)) {
    throw new Error(`3DTILES_subtree: ${label} properties has an invalid table index`);
  }
  const tableIndex = tableValue as number;
  const table = metadata?.propertyTables?.[tableIndex];
  const classDefinition = table?.class ? metadata?.schema?.classes?.[table.class] : undefined;
  if (!table || !classDefinition || !Number.isInteger(table.count) || Number(table.count) < 0) {
    throw new Error(
      `3DTILES_subtree: ${label} properties references invalid property table ${tableIndex}`
    );
  }
  return Array.from({length: table.count as number}, (_unused, rowIndex) => {
    const row: Record<string, unknown> = {};
    for (const [propertyName, classProperty] of Object.entries(classDefinition.properties || {})) {
      const tableProperty = table.properties?.[propertyName];
      const rawValue = getPropertyTableRowValue(
        tableProperty?.data,
        rowIndex,
        classProperty.type,
        classProperty.array === true
      );
      row[propertyName] = resolvePropertyValue(rawValue, classProperty, tableProperty);
    }
    return row;
  });
}

/** Selects required scalar, string, and enum values that the draft permits in template URIs. */
function filterTemplatePropertyRows(
  metadata: DraftStructuralMetadata | undefined,
  tableValue: unknown,
  rows: Array<Record<string, unknown>> | undefined
): Array<Record<string, unknown>> | undefined {
  if (!rows || !Number.isInteger(tableValue)) {
    return undefined;
  }
  const table = metadata?.propertyTables?.[tableValue as number];
  const classDefinition = table?.class ? metadata?.schema?.classes?.[table.class] : undefined;
  const propertyNames = Object.entries(classDefinition?.properties || {})
    .filter(
      ([_propertyName, property]) =>
        property.required === true &&
        property.array !== true &&
        ['SCALAR', 'STRING', 'ENUM'].includes(property.type || '')
    )
    .map(([propertyName]) => propertyName);
  return rows.map(row =>
    Object.fromEntries(propertyNames.map(propertyName => [propertyName, row[propertyName]]))
  );
}

/** Extracts one scalar, vector, matrix, or array row from decoded property-table data. */
function getPropertyTableRowValue(
  data: ArrayLike<unknown> | undefined,
  rowIndex: number,
  propertyType: string | undefined,
  isArray: boolean
): unknown {
  const componentCount = getPropertyComponentCount(propertyType);
  if (!data || isArray || componentCount === 1) {
    return data?.[rowIndex];
  }
  const offset = rowIndex * componentCount;
  return Array.from({length: componentCount}, (_unused, componentIndex) =>
    Reflect.get(data, offset + componentIndex)
  );
}

/** Applies metadata no-data/default and numeric transforms to one decoded value. */
function resolvePropertyValue(
  rawValue: unknown,
  classProperty: DraftStructuralMetadataClassProperty,
  tableProperty: DraftStructuralMetadataTableProperty | undefined
): unknown {
  if (rawValue === undefined || isMetadataValueEqual(rawValue, classProperty.noData)) {
    return classProperty.default;
  }
  if (Array.isArray(rawValue) || ArrayBuffer.isView(rawValue)) {
    const componentCount = getPropertyComponentCount(classProperty.type);
    return Array.from(rawValue as ArrayLike<unknown>, (component, componentIndex) =>
      typeof component === 'number' ||
      (typeof component === 'bigint' && hasNumericPropertyTransform(classProperty, tableProperty))
        ? applyNumericPropertyTransform(
            component,
            classProperty,
            tableProperty,
            componentIndex % componentCount
          )
        : component
    );
  }
  if (
    typeof rawValue !== 'number' &&
    (typeof rawValue !== 'bigint' || !hasNumericPropertyTransform(classProperty, tableProperty))
  ) {
    return rawValue;
  }
  return applyNumericPropertyTransform(rawValue, classProperty, tableProperty, 0);
}

/** Reports whether structural metadata requires a decoded numeric component to be transformed. */
function hasNumericPropertyTransform(
  classProperty: DraftStructuralMetadataClassProperty,
  tableProperty: DraftStructuralMetadataTableProperty | undefined
): boolean {
  return Boolean(
    classProperty.normalized ||
      tableProperty?.scale !== undefined ||
      tableProperty?.offset !== undefined ||
      classProperty.scale !== undefined ||
      classProperty.offset !== undefined
  );
}

/** Compares scalar and composite metadata values without relying on array identity. */
function isMetadataValueEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (typeof left === 'bigint' || typeof right === 'bigint') {
    const leftInteger = getMetadataBigInt(left);
    const rightInteger = getMetadataBigInt(right);
    return leftInteger !== undefined && rightInteger !== undefined && leftInteger === rightInteger;
  }
  const leftArray = getMetadataArray(left);
  const rightArray = getMetadataArray(right);
  return Boolean(
    leftArray &&
      rightArray &&
      leftArray.length === rightArray.length &&
      Array.from(leftArray).every((value, index) =>
        isMetadataValueEqual(value, Reflect.get(rightArray, index))
      )
  );
}

/** Converts an exactly represented metadata integer or integer string to a 64-bit comparison value. */
function getMetadataBigInt(value: unknown): bigint | undefined {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return BigInt(value);
  }
  if (typeof value === 'string' && /^[+-]?\d+$/.test(value)) {
    return BigInt(value);
  }
  return undefined;
}

/** Returns a metadata array value while excluding non-indexed DataView instances. */
function getMetadataArray(value: unknown): ArrayLike<unknown> | undefined {
  if (Array.isArray(value)) {
    return value;
  }
  return ArrayBuffer.isView(value) && !(value instanceof DataView)
    ? (value as unknown as ArrayLike<unknown>)
    : undefined;
}

/** Returns the number of numeric components in one metadata property element. */
function getPropertyComponentCount(propertyType: string | undefined): number {
  return {VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16}[propertyType || ''] || 1;
}

/** Applies normalization, scale, and offset to one numeric property component. */
function applyNumericPropertyTransform(
  rawValue: number | bigint,
  classProperty: DraftStructuralMetadataClassProperty,
  tableProperty: DraftStructuralMetadataTableProperty | undefined,
  componentIndex: number
): number {
  let value = Number(rawValue);
  if (classProperty.normalized) {
    value = normalizeInteger(value, classProperty.componentType);
  }
  const scale = getNumericTransformComponent(
    tableProperty?.scale ?? classProperty.scale,
    componentIndex,
    1
  );
  const offset = getNumericTransformComponent(
    tableProperty?.offset ?? classProperty.offset,
    componentIndex,
    0
  );
  return value * scale + offset;
}

/** Resolves a scalar or per-component metadata transform value. */
function getNumericTransformComponent(
  transform: number | number[] | undefined,
  componentIndex: number,
  defaultValue: number
): number {
  if (Array.isArray(transform)) {
    return transform[componentIndex] ?? defaultValue;
  }
  return transform ?? defaultValue;
}

/** Normalizes a signed or unsigned structural-metadata integer component. */
function normalizeInteger(value: number, componentType: string | undefined): number {
  const ranges: Record<string, [number, boolean]> = {
    INT8: [127, true],
    UINT8: [255, false],
    INT16: [32767, true],
    UINT16: [65535, false],
    INT32: [2147483647, true],
    UINT32: [4294967295, false],
    INT64: [Number(0x7fffffffffffffffn), true],
    UINT64: [Number(0xffffffffffffffffn), false]
  };
  const range = componentType && ranges[componentType];
  if (!range) {
    return value;
  }
  return range[1] ? Math.max(value / range[0], -1) : value / range[0];
}

/**
 * Adapts an explicit draft 3D Tiles 2.0 glTF hierarchy to the normalized 3D Tiles header model.
 *
 * External assets remain lazy: URI files are represented by resolved URLs, while buffer-view
 * files retain structured-cloneable byte ranges and their package-name lookup table.
 *
 * @param gltf - Parsed glTF container.
 * @param basePath - Base path of the tileset resource.
 * @param inheritedPackageFiles - Parent package records available to embedded tilesets.
 * @returns A 1.x-shaped header tree tagged as draft 2.0.
 */
export function parse3DTiles2Tileset(
  gltf: GLTFWithBuffers,
  basePath: string,
  inheritedPackageFiles?: Tiles3DPackageFile[]
): Tiles3DTilesetJSON {
  const json = gltf.json;
  validateTilesetStructure(json);
  const tilesetExtension = json.extensions?.[TILESET_EXTENSION] as {geometricError: number};
  const scene = json.scenes![json.scene!];
  const rootNodeIndex = scene.nodes![0];
  const resourceResolver = new CachedUriResolver(basePath);
  const files = createPackageFiles(gltf, resourceResolver, inheritedPackageFiles);
  const vectorExtension = json.extensions?.[VECTOR_EXTENSION] as {clip?: boolean} | undefined;
  if (vectorExtension?.clip !== undefined && typeof vectorExtension.clip !== 'boolean') {
    throw new Error('3DTILES_tileset_vectors: clip must be boolean when present');
  }
  const vectorContent = vectorExtension ? {clip: vectorExtension.clip === true} : undefined;
  const ancestorNodeIndices = new Set<number>();
  const root = convertNode(json, rootNodeIndex, files, vectorContent, ancestorNodeIndices, true);

  return {
    asset: json.asset,
    geometricError: tilesetExtension.geometricError,
    root,
    extensionsUsed: json.extensionsUsed,
    extensionsRequired: json.extensionsRequired,
    extensions: json.extensions,
    extras: json.extras
  } as Tiles3DTilesetJSON;
}

/** Validates the explicit hierarchy invariants required by the draft extension. */
function validateTilesetStructure(json: GLTF): void {
  const tilesetExtension = json.extensions?.[TILESET_EXTENSION] as
    | {geometricError?: unknown}
    | undefined;
  if (!tilesetExtension || !isNonnegativeNumber(tilesetExtension.geometricError)) {
    throw new Error('3DTILES_tileset: top-level geometricError must be a nonnegative number');
  }
  if (json.scenes?.length !== 1 || json.scene !== 0 || json.scenes[0].nodes?.length !== 1) {
    throw new Error('3DTILES_tileset: glTF must define one scene with one root node');
  }
  const rootNodeIndex = json.scenes[0].nodes[0];
  if (!Number.isInteger(rootNodeIndex) || !json.nodes?.[rootNodeIndex]) {
    throw new Error(`3DTILES_tileset: invalid root node ${rootNodeIndex}`);
  }
}

/** Converts one glTF node and its descendants without loading external assets. */
function convertNode(
  json: GLTF,
  nodeIndex: number,
  files: Tiles3DPackageFile[],
  vectorContent: {clip: boolean} | undefined,
  ancestorNodeIndices: Set<number>,
  isRoot: boolean
): Tiles3DTileJSON {
  const node = json.nodes?.[nodeIndex];
  if (!node) {
    throw new Error(`3DTILES_tileset: invalid child node ${nodeIndex}`);
  }
  if (ancestorNodeIndices.has(nodeIndex)) {
    throw new Error(`3DTILES_tileset: node hierarchy contains a cycle at node ${nodeIndex}`);
  }
  const extension = node.extensions?.[TILESET_EXTENSION] as
    | {geometricError?: unknown; refine?: unknown; content?: {boundingVolume?: GLTFBoundingVolume}}
    | undefined;
  if (!extension || !isNonnegativeNumber(extension.geometricError)) {
    throw new Error(`3DTILES_tileset: node ${nodeIndex} requires a nonnegative geometricError`);
  }
  if (isRoot && extension.refine !== 'ADD' && extension.refine !== 'REPLACE') {
    throw new Error('3DTILES_tileset: root node requires ADD or REPLACE refinement');
  }
  if (!node.boundingVolume) {
    throw new Error(`3DTILES_tileset: node ${nodeIndex} requires a boundingVolume`);
  }
  if (node.mesh !== undefined) {
    throw new Error(`3DTILES_tileset: tile node ${nodeIndex} must not define a mesh`);
  }
  const implicitTiling = node.extensions?.[IMPLICIT_TILING_EXTENSION] as
    | DraftImplicitTilingExtension
    | undefined;
  if (implicitTiling) {
    validateImplicitTilingNode(json, node, implicitTiling, nodeIndex);
  }
  const nextAncestors = new Set(ancestorNodeIndices);
  nextAncestors.add(nodeIndex);
  const content = implicitTiling
    ? ({uri: implicitTiling.contentUri, _vectorContent: vectorContent} as Tiles3DTileContentJSON)
    : createContent(json, node, files, vectorContent, extension.content, nodeIndex);
  return {
    boundingVolume: convertBoundingVolume(json, node.boundingVolume, `node ${nodeIndex}`),
    geometricError: extension.geometricError as number,
    refine: extension.refine as string | undefined,
    transform: getNodeMatrix(json, node, nodeIndex),
    content,
    children: implicitTiling
      ? []
      : (node.children || []).map(childNodeIndex =>
          convertNode(json, childNodeIndex, files, vectorContent, nextAncestors, false)
        ),
    implicitTiling: implicitTiling
      ? {
          subdivisionScheme: implicitTiling.subdivisionScheme,
          subtreeLevels: implicitTiling.subtreeLevels,
          availableLevels: implicitTiling.availableLevels,
          subtrees: {uri: implicitTiling.subtreeUri}
        }
      : undefined,
    _implicitPackageFiles: implicitTiling ? files : undefined,
    _scaleGeometricError: false,
    extensions: node.extensions,
    extras: node.extras
  } as Tiles3DTileJSON;
}

type DraftImplicitTilingExtension = {
  contentUri?: unknown;
  subtreeUri?: unknown;
  subdivisionScheme?: unknown;
  availableLevels?: unknown;
  subtreeLevels?: unknown;
};

/** Validates draft implicit-root invariants before adapting to the shared runtime descriptor. */
function validateImplicitTilingNode(
  json: GLTF,
  node: GLTFNode,
  implicitTiling: DraftImplicitTilingExtension,
  nodeIndex: number
): asserts implicitTiling is {
  contentUri: string;
  subtreeUri: string;
  subdivisionScheme: 'QUADTREE' | 'OCTREE';
  availableLevels: number;
  subtreeLevels: number;
} {
  if (node.children?.length || node.externalAsset !== undefined) {
    throw new Error(
      `3DTILES_implicit_tiling: node ${nodeIndex} must not define children or externalAsset`
    );
  }
  const boundingShape = json.shapes?.[node.boundingVolume!.shape];
  if (boundingShape?.type === 'sphere') {
    throw new Error(
      `3DTILES_implicit_tiling: node ${nodeIndex} cannot use a sphere bounding volume`
    );
  }
  if (typeof implicitTiling.contentUri !== 'string' || !implicitTiling.contentUri) {
    throw new Error(`3DTILES_implicit_tiling: node ${nodeIndex} requires contentUri`);
  }
  if (typeof implicitTiling.subtreeUri !== 'string' || !implicitTiling.subtreeUri) {
    throw new Error(`3DTILES_implicit_tiling: node ${nodeIndex} requires subtreeUri`);
  }
  if (
    implicitTiling.subdivisionScheme !== 'QUADTREE' &&
    implicitTiling.subdivisionScheme !== 'OCTREE'
  ) {
    throw new Error(`3DTILES_implicit_tiling: node ${nodeIndex} has unsupported subdivisionScheme`);
  }
  if (
    !Number.isInteger(implicitTiling.availableLevels) ||
    Number(implicitTiling.availableLevels) < 1
  ) {
    throw new Error(`3DTILES_implicit_tiling: node ${nodeIndex} requires positive availableLevels`);
  }
  if (!Number.isInteger(implicitTiling.subtreeLevels) || Number(implicitTiling.subtreeLevels) < 1) {
    throw new Error(`3DTILES_implicit_tiling: node ${nodeIndex} requires positive subtreeLevels`);
  }
}

/** Creates one lazy normalized content reference from a node external asset. */
function createContent(
  json: GLTF,
  node: GLTFNode,
  files: Tiles3DPackageFile[],
  vectorContent: {clip: boolean} | undefined,
  contentMetadata: {boundingVolume?: GLTFBoundingVolume} | undefined,
  nodeIndex: number
): Tiles3DTileContentJSON | undefined {
  if (node.externalAsset === undefined) {
    if (contentMetadata) {
      throw new Error(`3DTILES_tileset: content metadata on empty node ${nodeIndex}`);
    }
    return undefined;
  }
  const externalAsset = json.externalAssets?.[node.externalAsset];
  if (!externalAsset) {
    throw new Error(
      `3DTILES_tileset: node ${nodeIndex} references missing external asset ${node.externalAsset}`
    );
  }
  const file = json.files?.[externalAsset.file];
  if (!file || !files[externalAsset.file]) {
    throw new Error(
      `3DTILES_tileset: external asset ${node.externalAsset} references missing file ${externalAsset.file}`
    );
  }
  const content = {
    uri: file.uri || file.name || `embedded-${externalAsset.file}`,
    boundingVolume: contentMetadata?.boundingVolume
      ? convertBoundingVolume(json, contentMetadata.boundingVolume, `node ${nodeIndex} content`)
      : undefined,
    extensions: contentMetadata
      ? (contentMetadata as {extensions?: Record<string, unknown>}).extensions
      : undefined,
    _resource: {fileIndex: externalAsset.file, files} satisfies Tiles3DPackageResource,
    _vectorContent: vectorContent
  };
  return content as Tiles3DTileContentJSON;
}

/** Creates structured-cloneable lazy file records for the complete package. */
function createPackageFiles(
  gltf: GLTFWithBuffers,
  resourceResolver: CachedUriResolver,
  inheritedPackageFiles?: Tiles3DPackageFile[]
): Tiles3DPackageFile[] {
  const localFiles = (gltf.json.files || []).map((file, fileIndex) =>
    createPackageFile(gltf, file, fileIndex, resourceResolver, inheritedPackageFiles)
  );
  if (!inheritedPackageFiles?.length) {
    return localFiles;
  }
  const localReferences = new Set(
    localFiles.flatMap(file => [file.uri, file.originalUri, file.name].filter(Boolean) as string[])
  );
  return [
    ...localFiles,
    ...inheritedPackageFiles.filter(
      file =>
        ![file.uri, file.originalUri, file.name].some(
          reference => reference && localReferences.has(reference)
        )
    )
  ];
}

/** Creates one URI- or buffer-view-backed package file record. */
function createPackageFile(
  gltf: GLTFWithBuffers,
  file: GLTFFile,
  fileIndex: number,
  resourceResolver: CachedUriResolver,
  inheritedPackageFiles?: Tiles3DPackageFile[]
): Tiles3DPackageFile {
  if (!file.mimeType) {
    throw new Error(`3DTILES_tileset: file ${fileIndex} requires mimeType`);
  }
  if ((file.uri === undefined) === (file.bufferView === undefined)) {
    throw new Error(`3DTILES_tileset: file ${fileIndex} must define exactly one data source`);
  }
  if (file.uri !== undefined) {
    const loadedFile = gltf.files?.[fileIndex];
    if (loadedFile) {
      return {
        name: file.name,
        mimeType: file.mimeType,
        originalUri: file.uri,
        data: loadedFile.arrayBuffer,
        byteOffset: loadedFile.byteOffset,
        byteLength: loadedFile.byteLength
      };
    }
    const resolvedUri = resourceResolver.resolve(file.uri);
    const inheritedFile = inheritedPackageFiles?.find(
      packageFile =>
        packageFile.uri === resolvedUri ||
        packageFile.originalUri === file.uri ||
        packageFile.name === file.uri
    );
    if (inheritedFile) {
      return {
        ...inheritedFile,
        name: file.name || inheritedFile.name,
        mimeType: file.mimeType,
        originalUri: file.uri
      };
    }
    return {
      name: file.name,
      mimeType: file.mimeType,
      uri: resolvedUri,
      originalUri: file.uri,
      byteOffset: 0,
      byteLength: 0
    };
  }

  const bufferView = gltf.json.bufferViews?.[file.bufferView!];
  if (!bufferView) {
    throw new Error(`3DTILES_tileset: file ${fileIndex} references missing bufferView`);
  }
  const buffer = gltf.buffers?.[bufferView.buffer];
  const bufferDefinition = gltf.json.buffers?.[bufferView.buffer];
  const byteOffset = (buffer?.byteOffset || 0) + (bufferView.byteOffset || 0);
  if (buffer?.arrayBuffer) {
    return {
      name: file.name,
      mimeType: file.mimeType,
      data: buffer.arrayBuffer,
      byteOffset,
      byteLength: bufferView.byteLength
    };
  }
  if (bufferDefinition?.uri) {
    return {
      name: file.name,
      mimeType: file.mimeType,
      bufferUri: resourceResolver.resolve(bufferDefinition.uri),
      byteOffset: bufferView.byteOffset || 0,
      byteLength: bufferView.byteLength
    };
  }
  throw new Error(`3DTILES_tileset: embedded file ${fileIndex} has no available buffer data`);
}

/** Converts a supported draft glTF shape to the 3D Tiles runtime volume representation. */
function convertBoundingVolume(
  json: GLTF,
  boundingVolume: GLTFBoundingVolume,
  label: string
): Tile3DBoundingVolume {
  const shape = json.shapes?.[boundingVolume.shape] as GLTFShape | undefined;
  if (!shape) {
    throw new Error(`3DTILES_tileset: ${label} references missing shape ${boundingVolume.shape}`);
  }
  const matrix = getTransformMatrix(boundingVolume);
  if (shape.type === 'box' && shape.box?.size?.length === 3) {
    const [sizeX, sizeY, sizeZ] = shape.box.size;
    return {
      box: [
        matrix[12],
        matrix[13],
        matrix[14],
        (matrix[0] * sizeX) / 2,
        (matrix[1] * sizeX) / 2,
        (matrix[2] * sizeX) / 2,
        (matrix[4] * sizeY) / 2,
        (matrix[5] * sizeY) / 2,
        (matrix[6] * sizeY) / 2,
        (matrix[8] * sizeZ) / 2,
        (matrix[9] * sizeZ) / 2,
        (matrix[10] * sizeZ) / 2
      ]
    };
  }
  if (shape.type === 'sphere' && isNonnegativeNumber(shape.sphere?.radius)) {
    const maximumScale = Math.max(
      Math.hypot(matrix[0], matrix[1], matrix[2]),
      Math.hypot(matrix[4], matrix[5], matrix[6]),
      Math.hypot(matrix[8], matrix[9], matrix[10])
    );
    return {
      sphere: [matrix[12], matrix[13], matrix[14], shape.sphere.radius * maximumScale]
    };
  }
  const ellipsoidRegion = shape.extensions?.['3DTILES_shape_ellipsoid_region'] as
    | DraftEllipsoidRegion
    | undefined;
  if (shape.type === 'ellipsoid region' && ellipsoidRegion) {
    const minimumLongitude = ellipsoidRegion.minimumLongitude ?? -Math.PI;
    const maximumLongitude = ellipsoidRegion.maximumLongitude ?? Math.PI;
    const minimumLatitude = ellipsoidRegion.minimumLatitude ?? -Math.PI / 2;
    const maximumLatitude = ellipsoidRegion.maximumLatitude ?? Math.PI / 2;
    if (
      ![
        minimumLongitude,
        minimumLatitude,
        maximumLongitude,
        maximumLatitude,
        ellipsoidRegion.minimumHeight,
        ellipsoidRegion.maximumHeight
      ].every(Number.isFinite) ||
      ellipsoidRegion.minimumHeight > ellipsoidRegion.maximumHeight
    ) {
      throw new Error(`3DTILES_tileset: invalid ${label} ellipsoid region`);
    }
    return {
      region: [
        minimumLongitude,
        minimumLatitude,
        maximumLongitude,
        maximumLatitude,
        ellipsoidRegion.minimumHeight,
        ellipsoidRegion.maximumHeight
      ]
    };
  }
  const s2Region = shape.extensions?.['3DTILES_shape_s2'] as DraftS2Region | undefined;
  if (
    shape.type === 's2' &&
    s2Region &&
    typeof s2Region.token === 'string' &&
    Number.isFinite(s2Region.minimumHeight) &&
    Number.isFinite(s2Region.maximumHeight)
  ) {
    const s2VolumeInfo = {
      token: s2Region.token,
      minimumHeight: s2Region.minimumHeight,
      maximumHeight: s2Region.maximumHeight
    };
    return {
      box: convertS2BoundingVolumetoOBB(s2VolumeInfo),
      extensions: {'3DTILES_bounding_volume_S2': s2VolumeInfo},
      s2VolumeInfo
    } as Tile3DBoundingVolume;
  }
  const cylinderRegion = shape.extensions?.['3DTILES_shape_cylinder_region'] as
    | DraftCylinderRegion
    | undefined;
  if (
    shape.type === 'cylinder region' &&
    cylinderRegion &&
    isNonnegativeNumber(cylinderRegion.minimumRadius) &&
    isNonnegativeNumber(cylinderRegion.maximumRadius) &&
    isNonnegativeNumber(cylinderRegion.height) &&
    cylinderRegion.minimumRadius <= cylinderRegion.maximumRadius
  ) {
    return convertConservativeCylinderRegion(matrix, cylinderRegion);
  }
  throw new Error(`3DTILES_tileset: unsupported ${label} shape type ${shape.type}`);
}

type DraftEllipsoidRegion = {
  minimumHeight: number;
  maximumHeight: number;
  minimumLatitude?: number;
  maximumLatitude?: number;
  minimumLongitude?: number;
  maximumLongitude?: number;
};
type DraftS2Region = {token: string; minimumHeight: number; maximumHeight: number};
type DraftCylinderRegion = {
  minimumRadius: number;
  maximumRadius: number;
  height: number;
  minimumAngle?: number;
  maximumAngle?: number;
};

/** Returns a conservative transformed oriented box for a cylinder-region shape. */
function convertConservativeCylinderRegion(
  matrix: Matrix4,
  cylinderRegion: DraftCylinderRegion
): Tile3DBoundingVolume {
  const radius = cylinderRegion.maximumRadius;
  const halfHeight = cylinderRegion.height / 2;
  return {
    box: [
      matrix[12],
      matrix[13],
      matrix[14],
      matrix[0] * radius,
      matrix[1] * radius,
      matrix[2] * radius,
      matrix[4] * halfHeight,
      matrix[5] * halfHeight,
      matrix[6] * halfHeight,
      matrix[8] * radius,
      matrix[9] * radius,
      matrix[10] * radius
    ],
    extensions: {'3DTILES_shape_cylinder_region': cylinderRegion}
  } as Tile3DBoundingVolume;
}

/** Returns a column-major node transform, with georeferencing pre-multiplied when declared. */
function getNodeMatrix(json: GLTF, node: GLTFNode, nodeIndex: number): number[] | undefined {
  const nodeMatrix = node.matrix
    ? new Matrix4(node.matrix)
    : new Matrix4()
        .translate(node.translation || [0, 0, 0])
        .multiplyRight(new Matrix4().fromQuaternion(node.rotation || [0, 0, 0, 1]))
        .scale(node.scale || [1, 1, 1]);
  const georeference = node.extensions?.['EXT_georeference'] as
    | {longitude?: unknown; latitude?: unknown; height?: unknown}
    | undefined;
  if (!georeference) {
    return node.matrix || node.translation || node.rotation || node.scale
      ? Array.from(nodeMatrix)
      : undefined;
  }
  if (!json.extensions?.['EXT_geospatial_crs']) {
    throw new Error(`EXT_georeference: node ${nodeIndex} requires EXT_geospatial_crs`);
  }
  if (
    typeof georeference.longitude !== 'number' ||
    !Number.isFinite(georeference.longitude) ||
    georeference.longitude < -180 ||
    georeference.longitude > 180 ||
    typeof georeference.latitude !== 'number' ||
    !Number.isFinite(georeference.latitude) ||
    georeference.latitude < -90 ||
    georeference.latitude > 90 ||
    (georeference.height !== undefined &&
      (typeof georeference.height !== 'number' || !Number.isFinite(georeference.height)))
  ) {
    throw new Error(`EXT_georeference: node ${nodeIndex} has invalid geographic coordinates`);
  }
  return Array.from(
    getGeoreferenceMatrix(
      georeference.longitude,
      georeference.latitude,
      (georeference.height as number | undefined) || 0
    ).multiplyRight(nodeMatrix)
  );
}

/** Creates the draft local-right/up/forward to WGS84 geocentric tangent-frame transform. */
function getGeoreferenceMatrix(
  longitudeDegrees: number,
  latitudeDegrees: number,
  height: number
): Matrix4 {
  const longitude = (longitudeDegrees * Math.PI) / 180;
  const latitude = (latitudeDegrees * Math.PI) / 180;
  const cosLongitude = Math.cos(longitude);
  const sinLongitude = Math.sin(longitude);
  const cosLatitude = Math.cos(latitude);
  const sinLatitude = Math.sin(latitude);
  const position = Ellipsoid.WGS84.cartographicToCartesian([longitude, latitude, height]);
  return new Matrix4([
    sinLongitude,
    -cosLongitude,
    0,
    0,
    cosLatitude * cosLongitude,
    cosLatitude * sinLongitude,
    sinLatitude,
    0,
    -sinLatitude * cosLongitude,
    -sinLatitude * sinLongitude,
    cosLatitude,
    0,
    position[0],
    position[1],
    position[2],
    1
  ]);
}

/** Returns a concrete matrix for a bounding-volume matrix or TRS definition. */
function getTransformMatrix(boundingVolume: GLTFBoundingVolume): Matrix4 {
  if (boundingVolume.matrix) {
    return new Matrix4(boundingVolume.matrix);
  }
  return new Matrix4()
    .translate(boundingVolume.translation || [0, 0, 0])
    .multiplyRight(new Matrix4().fromQuaternion(boundingVolume.rotation || [0, 0, 0, 1]))
    .scale(boundingVolume.scale || [1, 1, 1]);
}

/** Tests whether a value is a finite nonnegative number. */
function isNonnegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Tests whether a value is a non-array object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
