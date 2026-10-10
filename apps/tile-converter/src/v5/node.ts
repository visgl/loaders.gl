// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Intentionally Node-only. Portable entrypoints do not import this adapter.
export {createNodeTilesetConversionSource, NODE_TILESET_LIMITS} from './node-source.js';
export type {
  NodeTilesetConversionSource,
  NodeTilesetConversionSourceOptions
} from './node-source.js';
