// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

// import {
//   Table as ApacheArrowTable,
//   Schema as ApacheArrowSchema,
//   RecordBatch,
//   FixedSizeList,
//   Field,
//   Data,
//   FixedSizeListVector
// } from 'apache-arrow/Arrow.dom';
// import {AbstractVector} from 'apache-arrow/vector';

// import {Table} from '../../types/category-table';
// import {getArrowType, getArrowVector} from './arrow-type-utils';
// import {makeMeshAttributeMetadata} from './deduce-mesh-schema';
// import {getTableLength, getTableNumCols} from './table-accessors';

/**
 * * Convert a loaders.gl Mesh to an Apache Arrow Table
 * @param mesh
 * @param metadata
 * @param batchSize
 * @returns
 *
export function convertTableToArrow(table: Table, options?: {batchSize?: number}): ArrowTable {
  const vectors: AbstractVector[] = [];
  const fields: Field[] = [];

  const length = getTableLength(table);
  const batchSize = options?.batchSize || length;

  const recordBatches: RecordBatch[] = [];
  for (let i = 0; i < length; i += batchSize) {
    for (let columnIndex = 0; columnIndex < getTableNumCols(table); ++columnIndex) {
      const field_ = table.schema.fields[columnIndex];
      const column = getTableColumnAt(table, columnIndex, i, batchSize);
      const type = getArrowType(column);
      const vector = getArrowVector(column);
      const listType = new FixedSizeList(size, new Field('value', type));
      const field = new Field(field_.name, listType, false, makeMeshAttributeMetadata(attribute));
      const data = new Data(listType, 0, value.length / size, 0, undefined, [vector]);
      const listVector = new FixedSizeListVector(data);
      vectors.push(listVector);
      fields.push(field);
    }

  for (const attributeKey in table.columns) {
    const attribute = mesh.attributes[attributeKey];
    const {value, size = 1} = attribute;
  }

  const schema = new ApacheArrowSchema(fields, table?.schema?.metadata || new Map<string, string>());
  const recordBatch = new RecordBatch(schema, vectors[0].length, vectors);
  const apacheArrowTable = new ApacheArrowTable(schema, recordBatch);

  return apacheArrowTable;
}
*/
