// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {getFixedSizeListData} from '../arrow-utils/arrow-fixed-size-list-utils';
import type {Mesh, ArrowTable} from '@loaders.gl/schema';
import {deserializeArrowSchema} from '../schema/convert-arrow-schema';
// import {makeMeshAttributeMetadata} from './deduce-mesh-schema';

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
  const table = new arrow.Table(arrowSchema, recordBatch);
  
  return {shape: 'arrow-table', schema, data: table};
}
