// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext} from '@loaders.gl/core/loader-utils';
import type {ArrowTable} from '@loaders.gl/core/schema';
import {convertMeshToTable} from '@loaders.gl/core/schema-utils';
import type {DracoMesh} from './draco-types';
import DracoParser from './draco-parser';
import type {DracoLoaderOptions} from '../draco-loader-options';
import type {Draco3D} from '../draco3d/draco3d-types';

/** Parsed Draco decoder module. */
export type LoadedDracoDecoderModule = {
  /** Initialized Draco decoder instance. */
  draco: Draco3D;
};

/** Loads the decoder selected by a backend-specific Draco loader. */
export type LoadDracoDecoderModule = () => Promise<LoadedDracoDecoderModule>;

/**
 * Parses Draco bytes with a backend-specific decoder module.
 * @param arrayBuffer Encoded Draco data
 * @param options Draco loader options
 * @param loadDecoderModule Function that loads the selected decoder backend
 * @param context Loader progress and cancellation context
 * @returns Decoded mesh or Arrow table
 */
export async function parseDraco(
  arrayBuffer: ArrayBuffer | ArrayBufferView,
  options: DracoLoaderOptions | undefined,
  loadDecoderModule: LoadDracoDecoderModule,
  context?: LoaderContext
): Promise<DracoMesh | ArrowTable> {
  const reportProgress = context?.reportProgress || options?.onProgress;
  reportProgress?.({phase: 'decode', completed: 0, total: 1, unit: 'tasks'});
  const {draco} = await loadDecoderModule();
  (options?.signal || context?.signal)?.throwIfAborted();
  const dracoParser = new DracoParser(draco);
  try {
    const mesh = dracoParser.parseSync(arrayBuffer, options?.draco);
    reportProgress?.({phase: 'decode', completed: 1, total: 1, unit: 'tasks'});
    if (options?.draco?.shape === 'arrow-table') {
      return convertMeshToTable(mesh, 'arrow-table');
    }
    return mesh;
  } finally {
    dracoParser.destroy();
  }
}
