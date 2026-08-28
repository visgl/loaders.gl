// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, LoaderOptions} from '@loaders.gl/loader-utils';
import {getI3SSpatialReference, I3SSource} from '@loaders.gl/tiles';
import type {TilesetSpatialReference} from '@loaders.gl/tiles';
import {I3SLoaderWithParser} from './i3s-loader-with-parser';
import {I3SPointCloudSource} from './i3s-point-cloud-source';
import {I3SPointCloudSceneLayerSchema, I3SSceneLayerSchema} from './i3s-zod-schema';
import type {SceneLayer3D, SpatialReference, FullExtent} from './types';

/** A source created from an I3S SceneServer layer. */
export type I3SLayerSource = I3SSource | I3SPointCloudSource;

/** Normalized metadata exposed by a SceneServer layer service. */
export type I3SServiceMetadata = {
  /** URL of the SceneServer layer resource. */
  url: string;
  /** I3S profile discriminator. */
  layerType: SceneLayer3D['layerType'];
  /** I3S document version. */
  version: string;
  /** Physical I3S storage profile. */
  profile: string;
  /** Layer capabilities advertised by the service. */
  capabilities: string[];
  /** Horizontal and vertical spatial reference metadata. */
  spatialReference?: SpatialReference;
  /** Normalized horizontal, vertical, axis, and height-reference metadata. */
  spatialMetadata: TilesetSpatialReference;
  /** Layer extent, when advertised. */
  fullExtent?: FullExtent;
  /** Human-readable layer name. */
  name?: string;
  /** Human-readable layer description. */
  description?: string;
  /** Parsed layer document retained for source construction and advanced consumers. */
  layer: SceneLayer3D;
};

/** Error raised when a SceneServer layer profile is not supported by loaders.gl. */
export class I3SUnsupportedProfileError extends Error {
  /** Unsupported profile or layer type reported by the service. */
  readonly profile: string;

  /** Creates an unsupported-profile error. */
  constructor(profile: string) {
    super(`Unsupported I3S layer profile: ${profile}`);
    this.name = 'I3SUnsupportedProfileError';
    this.profile = profile;
  }
}

/** Parses and validates a mesh or Point Cloud I3S scene-layer document. */
export function parseI3SSceneLayerMetadata(document: unknown): SceneLayer3D {
  const layerType =
    document && typeof document === 'object' && 'layerType' in document
      ? (document as {layerType?: unknown}).layerType
      : undefined;
  if (layerType === 'Point') {
    throw new I3SUnsupportedProfileError('Point');
  }
  if (layerType === 'PointCloud') {
    return I3SPointCloudSceneLayerSchema.parse(document) as SceneLayer3D;
  }
  return I3SSceneLayerSchema.parse(document) as SceneLayer3D;
}

/** Normalizes a parsed I3S layer into service metadata. */
export function normalizeI3SServiceMetadata(url: string, layer: SceneLayer3D): I3SServiceMetadata {
  return {
    url,
    layerType: layer.layerType,
    version: layer.version,
    profile: layer.store.profile,
    capabilities: [...layer.capabilities],
    spatialReference: layer.spatialReference,
    spatialMetadata: getI3SSpatialReference(layer),
    fullExtent: layer.fullExtent,
    name: layer.name,
    description: layer.description,
    layer
  };
}

/** Creates the profile-specific source used to traverse an I3S layer. */
export function createI3SLayerSource(
  url: string,
  layer: SceneLayer3D,
  options: DataSourceOptions = {},
  coreApi?: CoreAPI
): I3SLayerSource {
  if (layer.layerType === 'PointCloud') {
    return new I3SPointCloudSource(url, options);
  }

  const loadOptions = {
    ...(options.core?.loadOptions || {}),
    i3s: {
      ...((options.core?.loadOptions?.i3s as Record<string, unknown> | undefined) || {}),
      ...((options['i3s'] as Record<string, unknown> | undefined) || {})
    }
  } as LoaderOptions;
  return new I3SSource({url, loader: I3SLoaderWithParser, coreApi}, loadOptions);
}
