// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Format-specific codecs, feature mapping and archive packaging remain in the application.
export {convertFeatureAttributesToArrowBatches} from './feature-arrow.js';
export type {FeatureArrowBatchOptions, TileFeatureAttributes} from './feature-arrow.js';
export {encodePointCloudTile, encodePointCloudTileWithMetadata} from './point-cloud.js';
export type {EncodePointCloudTileOptions, EncodedPointCloudTile} from './point-cloud.js';
export {encodePointCloudSource, encodePointCloudSourceTile} from './point-cloud-source-encoder.js';
export type {
  EncodedPointCloudSourceTile,
  EncodePointCloudSourceOptions
} from './point-cloud-source-encoder.js';
export {convertPointCloudSource} from './point-cloud-conversion.js';
export type {ConvertPointCloudSourceOptions} from './point-cloud-conversion.js';
export type {MeshTileFeatures} from './mesh-features.js';
export {encodeMeshTile} from './mesh.js';
export type {
  MeshTileMaterial,
  MeshTileOptions,
  MeshTileTexture,
  MeshTileSampler,
  MeshTileTextureTransform
} from './mesh.js';
export {createMeshConversionCodec} from './mesh-conversion.js';
export type {
  MeshConversionInput,
  EncodedMeshConversionResource,
  MeshConversionCodecOptions
} from './mesh-conversion.js';
export {createSingleMeshTilesetSink, createMeshTilesetSink} from './mesh-tileset-sink.js';
export type {
  SingleMeshTilesetSink,
  SingleMeshTilesetSinkOptions,
  MeshTilesetSink,
  MeshTilesetSinkOptions
} from './mesh-tileset-sink.js';
export {
  createTileConversionArchive,
  encodeTileConversionArchiveInBatches
} from './conversion-archive.js';
export type {TileConversionArchiveOptions} from './conversion-archive.js';
export {createSingleMeshTilesetArchive} from './mesh-tileset-archive.js';
export type {SingleMeshTilesetArchiveOptions} from './mesh-tileset-archive.js';
export {createMeshTilesetConversionSource} from './mesh-source.js';
export type {
  MeshSourceResource,
  MeshTilesetSourceOptions,
  MeshSourceFeatureOptions
} from './mesh-source.js';
export {createI3SMeshConversionCodec, createSingleMeshI3SSink} from './i3s-mesh-conversion.js';
export type {
  I3SMeshConversionResource,
  I3SMeshConversionCodecOptions,
  SingleMeshI3SSink
} from './i3s-mesh-conversion.js';

export {createI3SMeshSink} from './i3s-mesh-sink.js';
export type {I3SMeshSink, I3SMeshSinkOptions} from './i3s-mesh-sink.js';

export {createTileConversionResourceFetcher} from './resource-fetcher.js';
export type {TileConversionResourceFetcherOptions} from './resource-fetcher.js';

export {createPointCloudTilesetSink} from './point-cloud-tileset-sink.js';
export type {
  PointCloudTilesetSink,
  PointCloudTilesetSinkOptions
} from './point-cloud-tileset-sink.js';

export {transformPointCloudSourceTile} from './point-cloud-spatial.js';
export type {PointCloudSpatialOptions} from './point-cloud-spatial.js';

export {createI3SMeshTilesetConversionSource} from './i3s-mesh-source.js';
export type {I3SMeshTilesetSourceOptions, I3SMeshSourceFeatureOptions} from './i3s-mesh-source.js';

export {mapPointCloudAttributes} from './point-cloud-attributes.js';
export type {PointCloudAttributeMapping, MappedPointCloud} from './point-cloud-attributes.js';
export {encodePointCloudCOPC, createCOPCConversionCodec} from './point-cloud-copc.js';
export type {EncodePointCloudCOPCOptions, EncodedPointCloudCOPC} from './point-cloud-copc.js';
