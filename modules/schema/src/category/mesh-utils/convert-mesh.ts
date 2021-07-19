import type {Mesh} from '../mesh';
import type {ColumnarTable} from '../table';

export function convertMeshToMeshColumnarTable(mesh: Mesh): ColumnarTable {
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

// export function convertColumnarTableToArrayRowTable(mesh: ColumnarTable): ArrayRowTable {
// export function convertArrayRowTableToColumnarTable(mesh: ColumnarTable): ArrayRowTable {
// export function convertMeshToGLTF(mesh: Mesh):
