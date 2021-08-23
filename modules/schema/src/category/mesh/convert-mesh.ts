import type {Mesh} from './mesh-types';
import type {ColumnarTable, ArrowTable} from '../table/table-types';
import {convertMeshToArrowTable} from './mesh-to-arrow-table';

type TargetShape = 'mesh' | 'columnar-table' | 'arrow-table';

/**
 * Convert a mesh to a specific shape
 */
export function convertMesh(
  mesh: Mesh,
  shape: TargetShape,
  options?: any
): Mesh | ColumnarTable | ArrowTable {
  switch (shape || 'mesh') {
    case 'mesh':
      return mesh;
    case 'columnar-table':
      return convertMeshToColumnarTable(mesh);
    case 'arrow-table':
      return {
        shape: 'arrow-table',
        data: convertMeshToArrowTable(mesh)
      };
    default:
      throw new Error(`Unsupported shape ${options?.shape}`);
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
