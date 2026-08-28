// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, LoaderOptions} from '@loaders.gl/loader-utils';
import {getI3SSpatialReference, I3SSource} from '@loaders.gl/tiles';
import type {TilesetSpatialReference} from '@loaders.gl/tiles';
import {I3SLoaderWithParser} from './i3s-loader-with-parser';
import {I3SPointCloudSource} from './i3s-point-cloud-source';
import {
  I3SPointCloudSceneLayerSchema,
  I3SPointSceneLayerSchema,
  I3SSceneLayerSchema
} from './i3s-zod-schema';
import type {SceneLayer3D, SpatialReference, FullExtent} from './types';

/** A source created from an I3S SceneServer layer. */
export type I3SLayerSource = I3SSource | I3SPointCloudSource;

/** Capability state reported for an I3S feature. */
export type I3SFeatureSupportStatus = 'supported' | 'partial' | 'unsupported';

/** A non-fatal qualification attached to an I3S capability report. */
export type I3SSupportDiagnostic = {
  /** Stable diagnostic identifier. */
  code: string;
  /** Human-readable explanation of the qualification. */
  message: string;
  /** Diagnostic severity. */
  severity: 'info' | 'warning';
};

/** Version- and profile-specific capabilities exposed by an I3S layer. */
export type I3SFeatureSupportReport = {
  /** I3S document version. */
  version: string;
  /** Layer profile or layer type. */
  profile: string;
  /** Capability states keyed by stable feature name. */
  features: Record<string, I3SFeatureSupportStatus>;
  /** Qualifications explaining partial and unsupported capabilities. */
  diagnostics: I3SSupportDiagnostic[];
};

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
  /** Capability report for the advertised version and profile. */
  supportReport: I3SFeatureSupportReport;
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

/** Parses and validates a mesh, Point, or Point Cloud I3S scene-layer document. */
export function parseI3SSceneLayerMetadata(document: unknown): SceneLayer3D {
  const layerType =
    document && typeof document === 'object' && 'layerType' in document
      ? (document as {layerType?: unknown}).layerType
      : undefined;
  if (layerType === 'Point') {
    return I3SPointSceneLayerSchema.parse(document);
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
    layer,
    supportReport: getI3SFeatureSupportReport(layer)
  };
}

/** Builds a conservative, metadata-only capability report for an I3S layer. */
export function getI3SFeatureSupportReport(layer: SceneLayer3D): I3SFeatureSupportReport {
  const hasGeometry = Boolean(
    layer.store.defaultGeometrySchema || layer.geometryDefinitions?.length || layer.pointNodePages
  );
  const hasAttributes = Boolean(layer.fields?.length || layer.attributeStorageInfo?.length);
  const features: Record<string, I3SFeatureSupportStatus> = {
    metadata: 'supported',
    geometry: hasGeometry ? 'supported' : 'partial',
    attributes: hasAttributes ? 'supported' : 'partial',
    rendererMetadata: layer.drawingInfo ? 'partial' : 'unsupported',
    popupMetadata: layer.popupInfo ? 'partial' : 'unsupported',
    spatialReference: layer.spatialReference ? 'supported' : 'partial',
    sceneServerQueries: 'unsupported',
    authoring: 'unsupported'
  };
  const diagnostics: I3SSupportDiagnostic[] = [
    {
      code: 'renderer-not-evaluated',
      message:
        'Renderer, visual-variable, label, and popup expressions are preserved as metadata; loaders do not evaluate them.',
      severity: 'info'
    },
    {
      code: 'authoring-not-supported',
      message: 'I3S Point and Point Cloud authoring is not included in the loader support surface.',
      severity: 'info'
    }
  ];
  if (!layer.spatialReference) {
    diagnostics.push({
      code: 'missing-spatial-reference',
      message:
        'The layer does not advertise a spatial reference; coordinate transforms cannot be inferred safely.',
      severity: 'warning'
    });
  }
  return {version: layer.version, profile: layer.store.profile, features, diagnostics};
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
