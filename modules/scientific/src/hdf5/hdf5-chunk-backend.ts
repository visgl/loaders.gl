// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {HDF5Dataset} from './hdf5-source';
import type {HDF5ByteSource} from './hdf5-binary';
import {
  readHDF5ChunkSelection,
  type HDF5ChunkedDataset,
  type HDF5ChunkSelection
} from './hdf5-chunk-reader';

function dtype(dataset: HDF5ChunkedDataset): string {
  const {kind, size, signed} = dataset.type;
  return kind === 'float' ? 'float' + size * 8 : (signed ? 'int' : 'uint') + size * 8;
}
/**
 * Bridge resolved HDF5 chunk metadata into the shared scientific array source.
 * Chunk index traversal remains the responsibility of the HDF5 file parser.
 */
export function createHDF5ChunkedDataset(
  source: HDF5ByteSource,
  descriptor: HDF5ChunkedDataset
): HDF5Dataset {
  const shape = [...descriptor.shape];
  return {
    shape,
    dtype: dtype(descriptor),
    read: async () => {
      const ranges: HDF5ChunkSelection = shape.map(length => [0, length]);
      return (await readHDF5ChunkSelection(source, descriptor, ranges)).data;
    },
    readSelection: async ranges => {
      return (await readHDF5ChunkSelection(source, descriptor, ranges)).data;
    }
  };
}
