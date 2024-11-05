// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, ArrowTable, ColumnarTable} from '@loaders.gl/schema';
import * as arrow from 'apache-arrow';
import {getFixedSizeListData} from '../arrow-utils/arrow-fixed-size-list-utils';
import {deserializeArrowSchema} from '../schema/convert-arrow-schema';

export function convertMeshToTable(mesh: Mesh, shape: 'columnar-table'): ColumnarTable;
export function convertMeshToTable(mesh: Mesh, shape: 'arrow-table'): ArrowTable;

/**
 * Convert a mesh to a specific shape
 */
export function convertMeshToTable(
  mesh: Mesh,
  shape: 'columnar-table' | 'arrow-table'
): Mesh | ColumnarTable | ArrowTable {
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
 * Convert a loaders.gl Mesh to a Columnar Table
 * @param mesh
 * @returns
 */
export function convertMeshToColumnarTable(mesh: Mesh): ColumnarTable {
  const columns = {};

  for (const [columnName, attribute] of Object.entries(mesh.attributes)) {
    columns[columnName] = attribute.value;
  }

  return {
    shape: 'columnar-table',
    schema: mesh.schema,
    data: columns
  };
}

/**
 * * Convert a loaders.gl Mesh to an Apache Arrow Table
 * @param mesh
 * @param metadata
 * @param batchSize
 * @returns
 */
export function convertMeshToArrowTable(mesh: Mesh, batchSize?: number): ArrowTable {
  const {schema} = mesh;
  const arrowSchema = deserializeArrowSchema(schema);

  const arrowDatas: arrow.Data[] = [];
  for (const attributeKey in mesh.attributes) {
    const attribute = mesh.attributes[attributeKey];
    const {value, size = 1} = attribute;

    const listData = getFixedSizeListData(value, size);
    arrowDatas.push(listData);
    // fields.push(field);
  }

  const structField = new arrow.Struct(arrowSchema.fields);
  const structData = new arrow.Data(structField, 0, length, 0, undefined, arrowDatas);
  const recordBatch = new arrow.RecordBatch(arrowSchema, structData);
  const table = new arrow.Table([recordBatch]);

  return {shape: 'arrow-table', schema, data: table};
}
