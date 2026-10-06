// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {
  convertTileset,
  inspectTileset,
  TileConversionError,
  validateTileset
} from '@loaders.gl/tile-converter/v5/core';
export {createTilesetConversionSource} from '@loaders.gl/tile-converter/v5/core';
export type {TilesetConversionSourceOptions} from '@loaders.gl/tile-converter/v5/core';
export type {
  ConvertTilesetOptions,
  TileConversionCodec,
  TileConversionDiagnostic,
  TileConversionProgress,
  TileConversionReport,
  TileConversionSink,
  TileConversionSource,
  TileValidationReport,
  ValidateTilesetOptions
} from '@loaders.gl/tile-converter/v5/core';
export {createBoundedMemoryTileConversionSink} from '@loaders.gl/tile-converter/v5/core';
export {createBrowserTileConversionSource} from '@loaders.gl/tile-converter/v5/core';
export type {
  BoundedMemoryTileConversionSink,
  BoundedMemoryTileConversionSinkOptions,
  BrowserTileConversionFile,
  BrowserTileConversionResource
} from '@loaders.gl/tile-converter/v5/core';
export type {
  BrowserTileConversionInspection,
  BrowserTileConversionInputResource,
  BrowserTileConversionSourceOptions
} from '@loaders.gl/tile-converter/v5/core';
export {createBrowserTilesetConversionSource} from '@loaders.gl/tile-converter/v5/core';
export {encodePointCloudTile} from '@loaders.gl/tile-converter/v5/adapters';
export type {EncodePointCloudTileOptions} from '@loaders.gl/tile-converter/v5/adapters';
export {traversePointCloudSource} from '@loaders.gl/tile-converter/v5/core';
export type {
  PointCloudSourceTile,
  TraversePointCloudSourceOptions
} from '@loaders.gl/tile-converter/v5/core';
export {
  encodePointCloudSource,
  encodePointCloudSourceTile
} from '@loaders.gl/tile-converter/v5/adapters';
export type {
  EncodedPointCloudSourceTile,
  EncodePointCloudSourceOptions
} from '@loaders.gl/tile-converter/v5/adapters';
export {convertPointCloudSource} from '@loaders.gl/tile-converter/v5/adapters';
export type {ConvertPointCloudSourceOptions} from '@loaders.gl/tile-converter/v5/adapters';
export type {
  BrowserTilesetConversionInputResource,
  BrowserTilesetConversionInspection,
  BrowserTilesetConversionSourceOptions,
  BrowserTilesetResourceDescriptor
} from '@loaders.gl/tile-converter/v5/core';
export {encodeMeshTile} from '@loaders.gl/tile-converter/v5/adapters';
export type {
  MeshTileMaterial,
  MeshTileOptions,
  MeshTileTexture,
  MeshTileSampler,
  MeshTileTextureTransform
} from '@loaders.gl/tile-converter/v5/adapters';
export {createMeshConversionCodec} from '@loaders.gl/tile-converter/v5/adapters';
export type {
  MeshConversionInput,
  EncodedMeshConversionResource,
  MeshConversionCodecOptions
} from '@loaders.gl/tile-converter/v5/adapters';
export {createTiles3DConversionSpatialContext} from '@loaders.gl/tile-converter/v5/core';
export type {Tiles3DConversionSpatialContext} from '@loaders.gl/tile-converter/v5/core';
export {createSingleMeshTilesetSink} from '@loaders.gl/tile-converter/v5/adapters';
export type {
  SingleMeshTilesetSink,
  SingleMeshTilesetSinkOptions
} from '@loaders.gl/tile-converter/v5/adapters';

export {
  createTileConversionArchive,
  encodeTileConversionArchiveInBatches
} from '@loaders.gl/tile-converter/v5/adapters';
export type {TileConversionArchiveOptions} from '@loaders.gl/tile-converter/v5/adapters';
export {createSingleMeshTilesetArchive} from '@loaders.gl/tile-converter/v5/adapters';
export type {SingleMeshTilesetArchiveOptions} from '@loaders.gl/tile-converter/v5/adapters';

export {createMeshTilesetConversionSource} from '@loaders.gl/tile-converter/v5/adapters';
export type {
  MeshSourceResource,
  MeshTilesetSourceOptions,
  MeshSourceFeatureOptions
} from '@loaders.gl/tile-converter/v5/adapters';
export {
  createI3SMeshConversionCodec,
  createSingleMeshI3SSink
} from '@loaders.gl/tile-converter/v5/adapters';
export type {
  I3SMeshConversionResource,
  I3SMeshConversionCodecOptions,
  SingleMeshI3SSink
} from '@loaders.gl/tile-converter/v5/adapters';
