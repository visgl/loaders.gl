// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  formatCOPCKey,
  getCOPCKeyBounds,
  loadCOPCHierarchyPage,
  loadCOPCNodeData,
  openCOPC,
  parseCOPCLAZMetadata,
  parseCOPCHeader,
  parseCOPCHierarchy,
  parseCOPCInfo,
  parseCOPCKey
} from './lib/copc-reader';
export type {
  COPCLoaderOptions,
  COPCHierarchyBatch,
  COPCHierarchyBatchOptions,
  COPCTileContent,
  COPCTileContentBatchOptions,
  COPCTileContentLoadOptions,
  COPCWriterOptions,
  COPCFile,
  COPCHeader,
  COPCHierarchy,
  COPCHierarchyNode,
  COPCHierarchyPage,
  COPCInfo,
  COPCLAZMetadata,
  COPCRangeReader,
  COPCVariableLengthRecord
} from './bundled';
