// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {ZipFormat} from './zip-format';
export {ZipLoader} from './zip-loader-types';
export type {ZipFileMap, ZipLoaderOptions} from './zip-loader-types';
export type {ZipWriterFiles, ZipWriterOptions} from './zip-writer';
export {ZipWriter} from './zip-writer';
export {encodeIndexedZip} from './indexed-zip-writer';
export type {IndexedZipFiles, IndexedZipOptions} from './indexed-zip-writer';

export {addOneFile, createZip} from './lib/zip-composition';
export type {ZipCompositionOptions} from './lib/zip-composition';

export {IndexedArchive} from './filesystems/IndexedArchive';
export {parseHashTable, composeHashFile} from './hash-file-utility';

export {ZipFileSystem} from './filesystems/zip-filesystem';
export type {ZipFileStat} from './filesystems/zip-filesystem';

export {ZipArchive, openZipArchive} from './zip-archive';
export type {
  ZipArchiveInput,
  ZipArchiveOptions,
  ZipEntry,
  ZipReadOptions,
  ZipRangeOptions
} from './zip-archive-types';

export {encodeZip, encodeZipInBatches} from './zip-encode';
export type {
  ZipByteChunk,
  ZipByteSource,
  ZipEncodeEntry,
  ZipEncodeFiles,
  ZipEncodeOptions
} from './zip-encode-types';
