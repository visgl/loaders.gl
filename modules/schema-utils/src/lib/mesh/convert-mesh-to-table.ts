// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Mesh,
  MeshAttribute,
  MeshArrowTable,
  MeshTable,
  ArrowTable,
  ColumnarTable
} from '@loaders.gl/schema';
import {indexedMeshArrowSchema, meshArrowSchema} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import {getFixedSizeListVector} from '../arrow-utils/arrow-fixed-size-list-utils';
import {
  deserializeArrowField,
  deserializeArrowMetadata,
  serializeArrowSchema
} from '../schema/convert-arrow-schema';

const MESH_ARROW_ATTRIBUTE_ORDER = ['POSITION'];

/** Convert a mesh to a columnar table. */
export function convertMeshToTable(mesh: Mesh, shape: 'columnar-table'): MeshTable;
/** Convert a mesh to an Apache Arrow table. */
export function convertMeshToTable(mesh: Mesh, shape: 'arrow-table'): MeshArrowTable;

/**
 * Convert a mesh to a specific table shape.
 * @param mesh Mesh to convert.
 * @param shape Target table shape.
 * @returns Mesh data in the requested table shape.
 */
export function convertMeshToTable(
  mesh: Mesh,
  shape: 'columnar-table' | 'arrow-table'
): Mesh | ColumnarTable | ArrowTable | MeshArrowTable {
  switch (shape) {
    case 'columnar-table':
      return convertMeshToColumnarTable(mesh);
    case 'arrow-table':
      return convertMeshToArrowTable(mesh);
    default:
      throw new Error(shape);
  }
}

/**
 * Convert a loaders.gl Mesh to a columnar table.
 * @param mesh Mesh to convert.
 * @returns Mesh data as a columnar table.
 */
export function convertMeshToColumnarTable(mesh: Mesh): MeshTable {
  const columns = {};
  const hasIndices = hasMeshIndices(mesh);

  for (const [columnName, attribute] of Object.entries(mesh.attributes)) {
    columns[columnName] = attribute.value;
  }

  return {
    shape: 'columnar-table',
    schema: mesh.schema,
    data: columns,
    topology: mesh.topology,
    indices: hasIndices ? mesh.indices : undefined
  };
}

/**
 * Convert a loaders.gl Mesh to an Apache Arrow table.
 * @param mesh Mesh to convert.
 * @param batchSize Reserved for future chunked Arrow conversion.
 * @returns Mesh data as an Apache Arrow table wrapper.
 */
export function convertMeshToArrowTable(mesh: Mesh, batchSize?: number): MeshArrowTable {
  const fields: arrow.Field[] = [];
  const columns: {[columnName: string]: arrow.Vector} = {};
  const attributeNames = getOrderedAttributeNames(mesh);
  const hasIndices = hasMeshIndices(mesh);

  for (const attributeName of attributeNames) {
    const attribute = mesh.attributes[attributeName];
    const {value, size = 1} = attribute;
    const column = getAttributeArrowVector(value, size);

    columns[attributeName] = column;
    fields.push(getAttributeArrowField(mesh, attributeName, column));

    if (attributeName === 'POSITION' && hasIndices) {
      const indicesField = indexedMeshArrowSchema.fields.find(field => field.name === 'indices')!;
      columns.indices = getIndicesVector(mesh.indices.value, column.length, indicesField.type);
      fields.push(indicesField);
    }
  }

  const arrowSchema = new arrow.Schema(fields, getMeshArrowMetadata(mesh));
  const table = new arrow.Table(arrowSchema, columns);
  const schema = serializeArrowSchema(table.schema);

  return {
    shape: 'arrow-table',
    schema,
    data: table,
    topology: mesh.topology,
    indices: hasIndices ? mesh.indices : undefined
  };
}

/** Return an Arrow vector for a mesh attribute. */
function getAttributeArrowVector(value: MeshAttribute['value'], size: number): arrow.Vector {
  return size === 1 ? arrow.makeVector(value) : getFixedSizeListVector(value, size);
}

/** Return mesh attribute names with predefined Mesh Arrow fields first. */
function getOrderedAttributeNames(mesh: Mesh): string[] {
  const attributeNames = Object.keys(mesh.attributes);
  const orderedAttributeNames = MESH_ARROW_ATTRIBUTE_ORDER.filter(
    attributeName => attributeName in mesh.attributes
  );
  const remainingAttributeNames = attributeNames.filter(
    attributeName => !MESH_ARROW_ATTRIBUTE_ORDER.includes(attributeName)
  );

  return [...orderedAttributeNames, ...remainingAttributeNames];
}

/** Return true when a mesh has a non-empty top-level index accessor. */
function hasMeshIndices(mesh: Mesh): mesh is Mesh & {indices: MeshAttribute} {
  return Boolean(mesh.indices?.value?.length);
}

/** Return the Arrow field for a mesh attribute column. */
function getAttributeArrowField(
  mesh: Mesh,
  attributeName: string,
  column: arrow.Vector
): arrow.Field {
  if (attributeName === 'POSITION' && isMeshPositionColumn(column)) {
    return meshArrowSchema.fields[0];
  }

  const field = mesh.schema.fields.find(schemaField => schemaField.name === attributeName);
  return field ? deserializeArrowField(field) : new arrow.Field(attributeName, column.type, false);
}

/** Return true when an Arrow column matches the predefined Mesh POSITION field. */
function isMeshPositionColumn(column: arrow.Vector): boolean {
  return (
    column.type instanceof arrow.FixedSizeList &&
    column.type.listSize === 3 &&
    column.type.children[0].type instanceof arrow.Float32
  );
}

/** Return an IndexedMesh indices column with the full index list stored in row 0. */
function getIndicesVector(
  indices: MeshAttribute['value'],
  vertexCount: number,
  type: arrow.DataType
): arrow.Vector {
  const indicesType = type as arrow.List<arrow.Int32>;
  const values = indices instanceof Int32Array ? indices : Int32Array.from(indices);
  const valueOffsets = new Int32Array(vertexCount + 1);
  if (vertexCount > 0) {
    valueOffsets.fill(values.length, 1);
  }

  const nullBitmap = new Uint8Array(Math.ceil(vertexCount / 8));
  if (vertexCount > 0) {
    nullBitmap[0] = 1;
  }

  const valuesData = new arrow.Data<arrow.Int32>(
    indicesType.children[0].type,
    0,
    values.length,
    0,
    {[arrow.BufferType.DATA]: values}
  );
  const indicesData = new arrow.Data<arrow.List<arrow.Int32>>(
    indicesType,
    0,
    vertexCount,
    Math.max(0, vertexCount - 1),
    {
      [arrow.BufferType.OFFSET]: valueOffsets,
      [arrow.BufferType.VALIDITY]: nullBitmap
    },
    [valuesData]
  );

  return new arrow.Vector([indicesData]);
}

/** Return Arrow schema metadata for mesh-level properties. */
function getMeshArrowMetadata(mesh: Mesh): Map<string, string> {
  const metadata = {...mesh.schema?.metadata};
  if (mesh.topology) {
    metadata.topology ||= mesh.topology;
  }
  if (Number.isFinite(mesh.mode)) {
    metadata.mode ||= String(mesh.mode);
  }
  if (mesh.header?.boundingBox) {
    metadata.boundingBox ||= JSON.stringify(mesh.header.boundingBox);
  }
  return deserializeArrowMetadata(metadata);
}
