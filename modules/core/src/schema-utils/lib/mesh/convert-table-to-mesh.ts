// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createFloat16Array, getFloat16Value, setFloat16Value} from '@loaders.gl/core/schema';
import type {Mesh, MeshAttribute, ColumnarTable, ArrowTable, Schema} from '@loaders.gl/core/schema';
import * as arrow from 'apache-arrow';
import {getFixedSizeListSize} from '../arrow-utils/arrow-fixed-size-list-utils';
import {serializeArrowSchema} from '../schema/convert-arrow-schema';
import {getMeshBoundingBox} from './mesh-utils';

/**
 * Convert a table to a mesh.
 * @param table Table to convert.
 * @returns Mesh reconstructed from the table.
 */
export function convertTableToMesh(table: ColumnarTable | ArrowTable): Mesh {
  switch (table.shape) {
    // case 'columnar-table':
    //   return convertColumnarTableToMesh(table);
    case 'arrow-table':
      return convertArrowTableToMesh(table);
    default:
      throw new Error(table.shape);
  }
}

/**
 * Convert an Apache Arrow mesh table to a loaders.gl Mesh.
 * @param table Arrow table wrapper to convert.
 * @returns Mesh reconstructed from the Arrow table.
 */
export function convertArrowTableToMesh(table: ArrowTable): Mesh {
  const arrowTable = table.data;

  const schema = serializeArrowSchema(arrowTable.schema);
  const fields = schema.fields;

  const attributes: Mesh['attributes'] = {};
  const columns: {name: string; data: readonly arrow.Data[]}[] = [];
  for (const field of fields) {
    const {name} = field;
    if (name === 'indices') {
      continue;
    }
    const attributeData = arrowTable.getChild(name)!;
    const size = getFixedSizeListSize(attributeData);
    const typedArray = getAttributeTypedArray(attributeData, size);
    const metadata = getMeshAttributeMetadata(field.metadata);
    const value =
      metadata.componentType === 'float16' ? restoreFloat16Array(typedArray) : typedArray;
    // Preserve exact physical-storage aliases across column copies without merging equal values.
    const shared = columns.find(
      column =>
        column.data.length === attributeData.data.length &&
        attributes[column.name].value.constructor === value.constructor &&
        column.data.every((chunk, index) => shareArrowStorage(chunk, attributeData.data[index]))
    );
    attributes[name] = {
      value: shared ? attributes[shared.name].value : value,
      size,
      ...metadata
    };
    if (!shared) columns.push({name, data: attributeData.data});
  }

  fixMetadata(schema);
  const topology = schema.metadata.topology as any;
  const mode = getMeshMode(schema);
  const indices = getIndices(arrowTable);
  const boundingBox =
    attributes.POSITION?.transform?.type === 'quantization'
      ? getMeshBoundingBoxFromSchema(schema) || getMeshBoundingBox(attributes)
      : getMeshBoundingBox(attributes);

  return {
    schema,
    attributes,
    topology,
    mode,
    indices,
    header: {
      vertexCount: arrowTable.numRows,
      boundingBox
    }
  };
}

/** Restores a serialized logical bounding box when one is available. */
function getMeshBoundingBoxFromSchema(
  schema: Schema
): [[number, number, number], [number, number, number]] | null {
  const serializedBoundingBox = schema.metadata?.boundingBox;
  if (!serializedBoundingBox) {
    return null;
  }
  try {
    const boundingBox = JSON.parse(serializedBoundingBox);
    if (
      Array.isArray(boundingBox) &&
      boundingBox.length === 2 &&
      boundingBox.every(
        (corner: unknown) =>
          Array.isArray(corner) &&
          corner.length === 3 &&
          corner.every(value => typeof value === 'number')
      )
    ) {
      return boundingBox as [[number, number, number], [number, number, number]];
    }
  } catch {
    // Ignore malformed optional metadata and recompute from decoded values.
  }
  return null;
}

/** Restores Mesh attribute properties serialized into Arrow field metadata. */
function getMeshAttributeMetadata(metadata: Record<string, string> = {}): Partial<MeshAttribute> {
  const result: Partial<MeshAttribute> = {};
  if (metadata.byteOffset !== undefined) {
    result.byteOffset = Number(metadata.byteOffset);
  }
  if (metadata.byteStride !== undefined) {
    result.byteStride = Number(metadata.byteStride);
  }
  if (metadata.normalized !== undefined) {
    result.normalized = metadata.normalized === 'true';
  }
  if (metadata.componentType === 'float16') {
    result.componentType = 'float16';
  }
  if (metadata['loaders.gl.transform']) {
    try {
      const transform = JSON.parse(metadata['loaders.gl.transform']);
      if (isMeshAttributeTransform(transform)) {
        result.transform = transform;
      }
    } catch {
      // Ignore malformed optional metadata and preserve the decoded values.
    }
  }
  return result;
}

/** Validates the compact transform representation stored in Arrow metadata. */
function isMeshAttributeTransform(value: unknown): value is MeshAttribute['transform'] {
  if (!value || typeof value !== 'object' || !('type' in value)) {
    return false;
  }
  const transform = value as Record<string, unknown>;
  if (transform.type === 'octahedron') {
    return (
      Number.isInteger(transform.bits) &&
      (transform.bits as number) >= 1 &&
      (transform.bits as number) <= 30
    );
  }
  return (
    transform.type === 'quantization' &&
    Number.isInteger(transform.bits) &&
    (transform.bits as number) >= 1 &&
    (transform.bits as number) <= 30 &&
    Array.isArray(transform.origin) &&
    transform.origin.every((component: unknown) => typeof component === 'number') &&
    typeof transform.range === 'number'
  );
}

/** Ensure required mesh metadata defaults are present on a schema. */
function fixMetadata(schema: Schema) {
  schema.metadata ||= {};
  schema.metadata.topology ||= 'point-list';
  schema.metadata.mode ||= '0';
}

/** Return a typed attribute array from an Arrow attribute column. */
function getAttributeTypedArray(attributeData: arrow.Vector, size: number): any {
  if (!(attributeData.type instanceof arrow.FixedSizeList)) {
    return attributeData.toArray();
  }

  const values = attributeData.data[0].children[0].values;
  const TypedArrayConstructor = values.constructor as any;
  const typedArray = new TypedArrayConstructor(attributeData.length * size);
  let targetOffset = 0;

  for (const data of attributeData.data) {
    const child = data.children[0];
    const sourceLength = data.length * size;
    const sourceOffset = child.offset || data.offset * size;
    // Arrow chunks can either slice child values eagerly or retain offsets into the source buffer.
    const sourceStart = sourceOffset + sourceLength <= child.values.length ? sourceOffset : 0;
    const source = child.values.subarray(sourceStart, sourceStart + sourceLength);
    typedArray.set(source, targetOffset);
    targetOffset += sourceLength;
  }

  return typedArray;
}

/** Restore native Float16 storage when the runtime supports it. */
function restoreFloat16Array(typedArray: any): Float16Array | Uint16Array {
  const result = createFloat16Array(typedArray.length);
  for (let index = 0; index < typedArray.length; index++) {
    setFloat16Value(result, index, getFloat16Value(typedArray, index));
  }
  return result;
}

/** Return the mesh drawing mode stored in Arrow schema metadata. */
function getMeshMode(schema: Schema): number {
  const mode = Number(schema.metadata?.mode);
  return Number.isFinite(mode) ? mode : 0;
}

/** Return top-level mesh indices from the predefined IndexedMesh Arrow column. */
function getIndices(arrowTable: arrow.Table): Mesh['indices'] | undefined {
  const indicesColumn = arrowTable.getChild('indices');
  if (!indicesColumn?.isValid(0)) {
    return undefined;
  }

  const indicesData = indicesColumn.data[0];
  const valueOffsets = indicesData.valueOffsets;
  const start = valueOffsets[indicesData.offset];
  const end = valueOffsets[indicesData.offset + 1];
  const values = indicesData.children[0].values.subarray(start, end);

  return {value: values, size: 1};
}

/** Checks complete Arrow chunk regions, including child buffers and validity/offset metadata. */
function shareArrowStorage(left: arrow.Data, right: arrow.Data): boolean {
  const rightBuffers = Object.values(right.buffers);
  return (
    left.type.toString() === right.type.toString() &&
    left.offset === right.offset &&
    left.length === right.length &&
    left.nullCount === right.nullCount &&
    left.dictionary === right.dictionary &&
    Object.values(left.buffers).every((buffer, index) => {
      const other = rightBuffers[index];
      return (
        buffer === other ||
        Boolean(
          buffer &&
            other &&
            buffer.buffer === other.buffer &&
            buffer.byteOffset === other.byteOffset &&
            buffer.byteLength === other.byteLength
        )
      );
    }) &&
    left.children.length === right.children.length &&
    left.children.every((child, index) => shareArrowStorage(child, right.children[index]))
  );
}
