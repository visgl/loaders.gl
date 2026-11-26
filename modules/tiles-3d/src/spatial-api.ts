// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {createBoundingVolume} from './tileset-3d/helpers/bounding-volume';
export {calculateTransformProps} from './tileset-3d/helpers/transform-utils';
export {convertS2BoundingVolumeToOBB} from './tileset-3d/helpers/s2-bounding-volume';
export type {S2VolumeInfo} from './tileset-3d/helpers/s2-bounding-volume';
export type {CreateTilesetSpatialReferenceOptions} from './spatial/spatial-types';
export type {TilesetCoordinateFrame} from './spatial/spatial-types';
export type {TilesetElevationBounds} from './spatial/spatial-types';
export type {TilesetElevationMode} from './spatial/spatial-types';
export type {TilesetElevationProvider} from './spatial/spatial-types';
export type {TilesetElevationRange} from './spatial/spatial-types';
export type {TilesetElevationSample} from './spatial/spatial-types';
export type {TilesetHeightReference} from './spatial/spatial-types';
export type {TilesetOutputCoordinates} from './spatial/spatial-types';
export type {TilesetSpatialOptions} from './spatial/spatial-types';
export type {TilesetSpatialReference} from './spatial/spatial-types';
export type {TilesetSpatialReferenceProvenance} from './spatial/spatial-types';
export type {TilesetTargetHeightReference} from './spatial/spatial-types';
export {applyTilesetSpatialOptions} from './spatial/spatial-types';
export {createTilesetSpatialReference} from './spatial/spatial-types';
export {markTilesetSpatialReferenceTransformed} from './spatial/spatial-types';
export {get3DTilesSpatialReference} from './spatial/format-spatial-reference';
export {getI3SSpatialReference} from './spatial/format-spatial-reference';
export {SpatialCoordinateTransformer} from './spatial/spatial-coordinate-transformer';
export {getSpatialCoordinateFrame} from './spatial/get-spatial-coordinate-frame';
export {Tiles3DSpatialTransformer} from './spatial/tiles-3d-spatial-transformer';
export type {Tiles3DSpatialBoundingVolume} from './spatial/tiles-3d-spatial-transformer';
export type {I3SSpatialBounds} from './spatial/i3s-spatial-transformer';
export type {I3SSpatialObb} from './spatial/i3s-spatial-transformer';
export {I3SSpatialTransformer} from './spatial/i3s-spatial-transformer';
export {getGeoidModel} from './spatial/spatial-resource-registry';
export {registerGeoidModel} from './spatial/spatial-resource-registry';
export {registerGeoidModelFromPgm} from './spatial/spatial-resource-registry';
export {registerSpatialCrs} from './spatial/spatial-resource-registry';
export {registerSpatialDatumGrid} from './spatial/spatial-resource-registry';

export type {I3STransformedPositions} from './spatial/i3s-spatial-transformer';

export type {I3STransformedGeometry} from './spatial/i3s-spatial-transformer';
