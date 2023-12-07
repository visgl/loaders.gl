// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* Problem with arrow dependency...
import {
  Table,
  Schema,
  RecordBatch,
  FixedSizeList,
  Field,
  Data,
  FixedSizeListVector
} from 'apache-arrow';
import {AbstractVector} from 'apache-arrow/vector';
import {getArrowType, getArrowVector} from '../table/arrow/arrow-type-utils';
import type {Mesh} from './mesh-types';
import {makeMeshAttributeMetadata} from './deduce-mesh-schema';

/**
 * * Convert a loaders.gl Mesh to an Apache Arrow Table
 * @param mesh
 * @param metadata
 * @param batchSize
 * @returns
 *
export function convertMeshToArrowTable(mesh: Mesh, batchSize?: number): Table {
  const vectors: AbstractVector[] = [];
  const fields: Field[] = [];
  for (const attributeKey in mesh.attributes) {
    const attribute = mesh.attributes[attributeKey];
    const {value, size = 1} = attribute;
    const type = getArrowType(value);
    const vector = getArrowVector(value);
    const listType = new FixedSizeList(size, new Field('value', type));
    const field = new Field(attributeKey, listType, false, makeMeshAttributeMetadata(attribute));
    const data = new Data(listType, 0, value.length / size, 0, undefined, [vector]);
    const listVector = new FixedSizeListVector(data);
    vectors.push(listVector);
    fields.push(field);
  }
  const schema = new Schema(fields, mesh?.schema?.metadata || new Map<string, string>());
  const recordBatch = new RecordBatch(schema, vectors[0].length, vectors);
  const table = new Table(schema, recordBatch);
  return table;
}
*/
