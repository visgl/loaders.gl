// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Portable orchestration and adapters using the existing tiles and math dependencies.
export {
  TileConversionError,
  inspectTileset,
  convertTileset,
  validateTileset
} from './conversion-api.js';
export type {
  TileConversionDiagnostic,
  TileConversionProgress,
  TileConversionReport,
  TileConversionSource,
  TileConversionSink,
  TileConversionCodec,
  ConvertTilesetOptions,
  ValidateTilesetOptions,
  TileValidationReport
} from './conversion-api.js';
export {createBrowserTileConversionSource} from './browser-source.js';
export type {
  BrowserTileConversionInspection,
  BrowserTileConversionInputResource,
  BrowserTileConversionSourceOptions
} from './browser-source.js';
export {traversePointCloudSource} from './point-cloud-source.js';
export type {PointCloudSourceTile, TraversePointCloudSourceOptions} from './point-cloud-source.js';
export {
  createTiles3DConversionSpatialContext,
  createI3SConversionSpatialContext
} from './spatial-conversion.js';
export type {
  Tiles3DConversionSpatialContext,
  I3SConversionSpatialContext
} from './spatial-conversion.js';
export {createTilesetConversionSource} from './tileset-source.js';
export type {TilesetConversionSourceOptions} from './tileset-source.js';
export {createManifestBackedTileConversionSink} from './resource-manifest.js';
export type {
  TileResourceManifestEntry,
  TileResourceManifest,
  TileResourceManifestStore,
  ManifestBackedTileConversionSinkOptions
} from './resource-manifest.js';
export {createBoundedMemoryTileConversionSink} from './browser-sink.js';
export type {
  BrowserTileConversionResource,
  BrowserTileConversionFile,
  BoundedMemoryTileConversionSinkOptions,
  BoundedMemoryTileConversionSink
} from './browser-sink.js';
export {createBrowserTilesetConversionSource} from './browser-tileset-source.js';
export type {
  BrowserTilesetConversionSourceOptions,
  BrowserTilesetConversionInspection,
  BrowserTilesetResourceDescriptor,
  BrowserTilesetConversionInputResource
} from './browser-tileset-source.js';
