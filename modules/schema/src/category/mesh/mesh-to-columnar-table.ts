import type {Mesh} from '../mesh/mesh-types';
import type {ColumnarTable} from '../table/table-types';
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
