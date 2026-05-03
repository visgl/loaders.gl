// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  dehydrateArrowTable,
  hydrateArrowTable,
  serializeArrowTableToIPC,
  deserializeArrowTableFromIPC,
  type DehydratedArrowData,
  type DehydratedArrowRecordBatch,
  type DehydratedArrowTable,
  type DehydratedArrowVector,
  type SerializedArrowTableIPC
} from './lib/utils/arrow-table-transport';
export {
  splitArrowBuffers,
  splitArrowTableBuffers,
  type SplitArrowBuffersInput,
  type SplitArrowBuffersOptions
} from './lib/utils/split-arrow-buffers';
