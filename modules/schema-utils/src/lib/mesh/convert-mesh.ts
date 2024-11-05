// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh, ColumnarTable, ArrowTable} from '@loaders.gl/schema';
import {convertMeshToArrowTable} from './convert-mesh-to-arrow-table';

type TargetShape = 'mesh' | 'columnar-table' | 'arrow-table';

export function convertMesh(mesh: Mesh, shape: 'mesh'): Mesh;
export function convertMesh(mesh: Mesh, shape: 'columnar-table'): ColumnarTable;
export function convertMesh(mesh: Mesh, shape: 'arrow-table'): ArrowTable;

/**
 * Convert a mesh to a specific shape
 */
export function convertMesh(
  mesh: Mesh,
  shape: TargetShape,
): Mesh | ColumnarTable | ArrowTable {
  switch (shape || 'mesh') {
    case 'mesh':
      return mesh;
    case 'columnar-table':
      return convertMeshToColumnarTable(mesh);
    case 'arrow-table':
      return convertMeshToArrowTable(mesh);
    default:
      throw new Error(`Unsupported shape ${shape}`);
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
