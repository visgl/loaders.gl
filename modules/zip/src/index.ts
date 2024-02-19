// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {ZipLoader} from './zip-loader';
export {ZipWriter} from './zip-writer';
export {TarBuilder} from './tar-builder';

export {
  parseZipCDFileHeader,
  makeZipCDHeaderIterator,
  signature as CD_HEADER_SIGNATURE,
  generateCDHeader
} from './parse-zip/cd-file-header';
export {
  parseZipLocalFileHeader,
  signature as localHeaderSignature,
  generateLocalHeader
} from './parse-zip/local-file-header';
export {parseEoCDRecord} from './parse-zip/end-of-central-directory';
export {searchFromTheEnd} from './parse-zip/search-from-the-end';
export {addOneFile, createZip} from './parse-zip/zip-composition';

// export type {HashElement} from './hash-file-utility';
export {IndexedArchive} from './filesystems/IndexedArchive';
export {parseHashTable, makeHashTableFromZipHeaders, composeHashFile} from './hash-file-utility';

export {ZipFileSystem, ZIP_COMPRESSION_HANDLERS} from './filesystems/zip-filesystem';
export type {CompressionHandler} from './filesystems/zip-filesystem';
