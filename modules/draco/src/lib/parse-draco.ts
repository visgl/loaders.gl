// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/schema';
import {convertMeshToTable} from '@loaders.gl/schema-utils';
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
 * @returns Decoded mesh or Arrow table
 */
export async function parseDraco(
  arrayBuffer: ArrayBuffer | ArrayBufferView,
  options: DracoLoaderOptions | undefined,
  loadDecoderModule: LoadDracoDecoderModule
): Promise<DracoMesh | ArrowTable> {
  const {draco} = await loadDecoderModule();
  const dracoParser = new DracoParser(draco);
  try {
    const mesh = dracoParser.parseSync(arrayBuffer, options?.draco);
    if (options?.draco?.shape === 'arrow-table') {
      return convertMeshToTable(mesh, 'arrow-table');
    }
    return mesh;
  } finally {
    dracoParser.destroy();
  }
}
