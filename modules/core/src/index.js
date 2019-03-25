// FILE READING AND WRITING
export {setPathPrefix, getPathPrefix, resolvePath} from './fetch-file/file-aliases.js';
export {fetchFile, readFileSync} from './fetch-file/fetch-file';
export {writeFile, writeFileSync} from './fetch-file/write-file';

// FILE PARSING
export {registerLoaders} from './parse-file/register-loaders';
export {
  parseFile,
  parseFileSync,
  parseFileInBatches,
  parseFileInBatchesSync
} from './parse-file/parse-file';

// FILE LOADING (READING + PARSING)
export {loadFileInBatches, loadFile, loadFileSync} from './load-file/load-file';
export {loadImage} from './load-file/load-image';

// FILE ENCODING AND SAVING
export {encodeFile, encodeFileSync, encodeToStream} from './encode-file/encode-file';
export {saveFile, saveFileSync} from './save-file/save-file';

// TYPE UTILS
export {
  isPromise,
  isIterable,
  isAsyncIterable,
  isIterator,
  isFetchResponse,
  isReadableStream,
  isWritableStream
} from './utils/is-type';

// BINARY UTILS
export {
  isArrayBuffer,
  isBuffer,
  isBlob,
  toArrayBuffer,
  blobToArrayBuffer,
  toBuffer,
  toDataView
} from './binary-utils/binary-utils';

export {padTo4Bytes, copyToArray, copyArrayBuffer} from './binary-utils/memory-copy-utils';
export {flattenToTypedArray} from './binary-utils/flatten-to-typed-array';
export {TextDecoder, TextEncoder} from './binary-utils/text-encoding';

// WORKER UTILS
export {default as createWorker} from './worker-utils/create-worker';

// ITERATOR UTILS
export {default as AsyncQueue} from './iterator-utils/async-queue';
export {getStreamIterator} from './iterator-utils/stream-utils';

export {
  forEach,
  concatenateAsyncIterator,
  lineAsyncIterator,
  textDecoderAsyncIterator,
  numberedLineAsyncIterator
} from './iterator-utils/async-iterator-utils';

// CORE UTILS
export {isBrowser, self, window, global, document} from './utils/globals';
export {default as assert} from './utils/assert';

// IMAGE UTILS
export {isImage, getImageSize} from './image-utils/get-image-size';
export {ImageBitmapLoader, HTMLImageLoader, PlatformImageLoader} from './image-utils/image-loaders';

// MESH CATEGORY UTILS
export {getMeshSize as _getMeshSize} from './categories/mesh/mesh-utils';

// TABLE CATEGORY UTILS
export {default as TableBatchBuilder} from './categories/table/table-batch-builder';
export {default as RowTableBatch} from './categories/table/row-table-batch';
export {default as ColumnarTableBatch} from './categories/table/columnar-table-batch';
export {deduceTableSchema} from './categories/table/table-utils';

// DEPRECATED
export {readFile, createReadStream} from './fetch-file/fetch-file';
