// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  Mesh,
  MeshAttribute,
  MeshArrowTable,
  MeshTable,
  ArrowTable,
  ColumnarTable,
  MeshAttributes,
  Schema
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

/** Options for constructing a MeshArrowTable directly from typed mesh attribute arrays. */
export type MeshArrowTableOptions = {
  /** Schema describing the mesh attributes and metadata. */
  schema?: Schema;
  /** Mesh primitive topology represented by the table rows. */
  topology?:
    | 'point-list'
    | 'line-list'
    | 'line-loop'
    | 'line-strip'
    | 'triangle-list'
    | 'triangle-strip'
    | 'triangle-fan';
  /** Numeric draw mode associated with the mesh topology. */
  mode?: number;
  /** Optional mesh bounding box metadata. */
  boundingBox?: [number[], number[]];
  /** Optional top-level primitive indices accessor for indexed meshes. */
  indices?: MeshAttribute;
};

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
  return makeMeshArrowTable(mesh.attributes, {
    schema: mesh.schema,
    topology: mesh.topology,
    mode: mesh.mode,
    boundingBox: mesh.header?.boundingBox,
    indices: hasMeshIndices(mesh) ? mesh.indices : undefined
  });
}

/**
 * Create a MeshArrowTable directly from mesh attribute typed arrays.
 * @param attributes Mesh attributes to expose as Arrow columns.
 * @param options Mesh table metadata and optional schema.
 * @returns Mesh data as an Apache Arrow table wrapper.
 */
export function makeMeshArrowTable(
  attributes: MeshAttributes,
  options: MeshArrowTableOptions = {}
): MeshArrowTable {
  const fields: arrow.Field[] = [];
  const columns: {[columnName: string]: arrow.Vector} = {};
  const attributeNames = getOrderedAttributeNames(attributes);

  for (const attributeName of attributeNames) {
    const attribute = attributes[attributeName];
    const {value, size = 1} = attribute;
    const column = getAttributeArrowVector(value, size);

    columns[attributeName] = column;
    fields.push(getAttributeArrowField(options.schema, attributeName, column));

    if (attributeName === 'POSITION' && options.indices?.value?.length) {
      const indicesField = indexedMeshArrowSchema.fields.find(field => field.name === 'indices')!;
      columns.indices = getIndicesVector(options.indices.value, column.length, indicesField.type);
      fields.push(indicesField);
    }
  }

  const arrowSchema = new arrow.Schema(fields, getMeshArrowMetadata(options));
  const table = new arrow.Table(arrowSchema, columns);
  const schema = serializeArrowSchema(table.schema);

  return {
    shape: 'arrow-table',
    schema,
    data: table,
    topology: options.topology || 'point-list',
    indices: options.indices
  };
}

/** Return an Arrow vector for a mesh attribute. */
function getAttributeArrowVector(value: MeshAttribute['value'], size: number): arrow.Vector {
  return size === 1 ? arrow.makeVector(value) : getFixedSizeListVector(value, size);
}

/** Return mesh attribute names with predefined Mesh Arrow fields first. */
function getOrderedAttributeNames(attributes: MeshAttributes): string[] {
  const attributeNames = Object.keys(attributes);
  const orderedAttributeNames = MESH_ARROW_ATTRIBUTE_ORDER.filter(
    attributeName => attributeName in attributes
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
  schema: Schema | undefined,
  attributeName: string,
  column: arrow.Vector
): arrow.Field {
  if (attributeName === 'POSITION' && isMeshPositionColumn(column)) {
    const canonicalField = meshArrowSchema.fields[0];
    const suppliedField = schema?.fields.find(schemaField => schemaField.name === attributeName);
    if (!suppliedField?.metadata) {
      return canonicalField;
    }
    const metadata = new Map(canonicalField.metadata);
    for (const [key, value] of Object.entries(suppliedField.metadata)) {
      metadata.set(key, value);
    }
    return new arrow.Field(
      canonicalField.name,
      canonicalField.type,
      canonicalField.nullable,
      metadata
    );
  }

  const field = schema?.fields.find(schemaField => schemaField.name === attributeName);
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
function getMeshArrowMetadata(options: MeshArrowTableOptions): Map<string, string> {
  const metadata = {...options.schema?.metadata};
  if (options.topology) {
    metadata.topology ||= options.topology;
  }
  if (Number.isFinite(options.mode)) {
    metadata.mode ||= String(options.mode);
  }
  if (options.boundingBox) {
    metadata.boundingBox ||= JSON.stringify(options.boundingBox);
  }
  return deserializeArrowMetadata(metadata);
}
