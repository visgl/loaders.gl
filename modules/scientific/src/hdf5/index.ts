// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
export {HDF5Source} from './hdf5-source';
export type {HDF5Backend, HDF5Dataset} from './hdf5-source';

export {openHDF5Source} from './hdf5-file-source';
export {openH5WasmBackend, isHDF5} from './h5wasm-backend';

export {HTTPRangeReader} from './http-range-reader';

export {
  HDF5MemorySource,
  readHDF5Superblock,
  locateHDF5Superblock,
  hdf5Checksum
} from './hdf5-binary';
export type {HDF5ByteSource, HDF5Superblock} from './hdf5-binary';
export {HDF5TypeScriptFile} from './hdf5-typescript-source';

export {readHDF5ObjectHeader} from './hdf5-object-header';
export type {HDF5ObjectHeader, HDF5ObjectMessage} from './hdf5-object-header';

export {
  parseHDF5Dataspace,
  parseHDF5PrimitiveType,
  parseHDF5ContiguousLayout,
  decodeHDF5Primitive
} from './hdf5-dataset-messages';
export type {HDF5Primitive, HDF5Dataspace, HDF5ContiguousLayout} from './hdf5-dataset-messages';

export {parseHDF5HardLink, getHDF5CompactLinks} from './hdf5-links';
export {
  parseHDF5FilterPipeline,
  decodeHDF5Filters,
  unshuffleHDF5,
  verifyHDF5Fletcher32
} from './hdf5-filters';
export type {HDF5HardLink} from './hdf5-links';
export type {HDF5Filter} from './hdf5-filters';

export {readHDF5ChunkSelection} from './hdf5-chunk-reader';
export {createHDF5ChunkedDataset} from './hdf5-chunk-backend';
export type {
  HDF5ChunkEntry,
  HDF5ChunkedDataset,
  HDF5ChunkSelection,
  HDF5ChunkReadStats
} from './hdf5-chunk-reader';

export {parseHDF5ChunkLayout, resolveHDF5ChunkIndex} from './hdf5-chunk-index';

export {parseHDF5FillValue} from './hdf5-fill-value';

export {readHDF5ChunkBTreeV1} from './hdf5-btree-v1';

export {readHDF5BTreeV2Header, readHDF5ExtensibleArrayHeader} from './hdf5-index-headers';
export type {HDF5BTreeV2Header, HDF5ExtensibleArrayHeader} from './hdf5-index-headers';
