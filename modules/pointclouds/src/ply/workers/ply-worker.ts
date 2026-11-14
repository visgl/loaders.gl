// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker, makeTableScanBatch} from '@loaders.gl/core/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/core/schema';
import {convertMeshToTable} from '@loaders.gl/core/schema-utils';
import type {PLYMesh} from '../lib/ply-types';
import type {PLYLoaderOptions} from '../ply-loader-types';
import {PLYColumnLoader} from '../ply-loader';

createLoaderWorker({
  ...PLYColumnLoader,
  /** Always returns columnar data; legacy mesh conversion runs on the caller. */
  parse(input, options) {
    return PLYColumnLoader.parse(input, {
      ...options,
      ply: {...options?.ply, shape: 'arrow'}
    });
  },
  /** Preserves full-mesh parsing while streaming point-cloud vertices as Arrow batches. */
  async *parseInBatches(input, options?: PLYLoaderOptions) {
    const parseMesh = options?.ply?.shape === 'mesh' && !options?.ply?.pointCloud;
    const parserOptions = parseMesh
      ? options
      : {...options, ply: {...options?.ply, shape: 'arrow' as const}};
    for await (const batch of PLYColumnLoader.parseInBatches(input, parserOptions)) {
      if ('shape' in batch && batch.shape === 'arrow-table') {
        yield batch;
      } else {
        const mesh = batch as PLYMesh;
        yield makeTableScanBatch({
          ...convertMeshToTable(mesh, 'arrow-table'),
          loader: mesh.loader,
          loaderData: mesh.loaderData
        } as MeshArrowTable);
      }
    }
  }
});
