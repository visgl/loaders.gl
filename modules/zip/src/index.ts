// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export {ZipLoader} from './zip-loader';
export {ZipWriter} from './zip-writer';
export {TarBuilder} from './tar-builder';

export {
  parseZipCDFileHeader,
  makeZipCDHeaderIterator,
  signature as cdSignature
} from './parse-zip/cd-file-header';
export {
  parseZipLocalFileHeader,
  signature as localHeaderSignature
} from './parse-zip/local-file-header';
export {parseEoCDRecord} from './parse-zip/end-of-central-directory';
export {searchFromTheEnd} from './parse-zip/search-from-the-end';

// export type {HashElement} from './hash-file-utility';
export {parseHashTable, makeHashTableFromZipHeaders} from './hash-file-utility';

export {ZipFileSystem} from './filesystems/zip-filesystem';
