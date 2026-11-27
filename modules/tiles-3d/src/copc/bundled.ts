// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {COPCLoader, COPCTileSource} from './copc-loader';
export {COPCFormat} from './copc-format';
export {COPCWriter} from './copc-writer';
export {
  openCOPC,
  loadCOPCHierarchyPage,
  loadCOPCNodeData,
  parseCOPCHeader,
  parseCOPCInfo,
  parseCOPCHierarchy
} from './lib/copc-reader';
export type {
  COPCLoaderOptions,
  COPCHierarchyBatch,
  COPCHierarchyBatchOptions,
  COPCTileContent,
  COPCTileContentBatchOptions,
  COPCTileContentLoadOptions
} from './copc-loader';
export type {COPCWriterOptions} from './copc-writer';
export type {
  COPCFile,
  COPCHeader,
  COPCHierarchy,
  COPCHierarchyNode,
  COPCHierarchyPage,
  COPCInfo,
  COPCLAZMetadata,
  COPCRangeReader,
  COPCVariableLengthRecord
} from './lib/copc-reader';
