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
import type {SceneLayer3D, SpatialReference, FullExtent, PopupInfo, I3SRenderer} from './types';

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
  /** Normalized renderer and popup metadata for downstream renderers. */
  rendererMetadata?: I3SRendererMetadata;
  /** Normalized popup metadata for downstream renderers. */
  popupMetadata?: PopupInfo;
  /** Non-fatal metadata diagnostics. */
  diagnostics: I3SSupportDiagnostic[];
  /** Profile-aware feature support report. */
  supportReport: I3SFeatureSupportReport;
  /** Parsed layer document retained for source construction and advanced consumers. */
  layer: SceneLayer3D;
};

/** Status assigned to one capability in a conformance report. */
export type I3SFeatureSupportStatus = 'supported' | 'partial' | 'unsupported';

/** Diagnostic explaining a partial, unsupported, or malformed feature. */
export type I3SSupportDiagnostic = {
  /** Stable diagnostic code. */
  code: 'profile-unsupported' | 'feature-unsupported' | 'metadata-preserved' | 'invalid';
  /** Human-readable explanation. */
  message: string;
  /** Optional metadata path. */
  path?: string;
};

/** Metadata-only renderer representation. Expressions are never evaluated by the loader. */
export type I3SRendererMetadata = {
  /** Renderer discriminator. */
  type: string;
  /** Renderer field, when supplied. */
  field?: string;
  /** Classification or unique-value definitions. */
  classes?: unknown[];
  /** Visual variables retained for downstream evaluation. */
  visualVariables?: unknown[];
  /** Label classes retained for downstream evaluation. */
  labelClasses?: unknown[];
  /** Original renderer document. */
  raw: I3SRenderer;
  /** Properties not normalized by loaders.gl. */
  unsupportedProperties: string[];
};

/** Produces a profile-aware capability report for a parsed I3S layer. */
export function getI3SFeatureSupportReport(layer: SceneLayer3D): I3SFeatureSupportReport {
  const features: Record<string, I3SFeatureSupportStatus> = {
    geometry: 'supported',
    attributes: 'supported',
    rendererMetadata: layer.drawingInfo ? 'partial' : 'unsupported',
    popupMetadata: layer.popupInfo ? 'partial' : 'unsupported',
    crsMetadata: layer.spatialReference ? 'supported' : 'partial',
    elevationMetadata: layer.elevationInfo ? 'partial' : 'unsupported'
  };
  const diagnostics: I3SSupportDiagnostic[] = [];
  if (layer.drawingInfo) {
    diagnostics.push({
      code: 'metadata-preserved',
      message: 'Renderer metadata is preserved but not evaluated by the loader.',
      path: 'drawingInfo'
    });
  }
  if (layer.popupInfo) {
    diagnostics.push({
      code: 'metadata-preserved',
      message: 'Popup expressions and media are preserved but not evaluated by the loader.',
      path: 'popupInfo'
    });
  }
  return {
    version: layer.version,
    profile: layer.store.profile,
    features,
    diagnostics
  };
}

/** Feature support report for one version/profile combination. */
export type I3SFeatureSupportReport = {
  /** I3S document version. */
  version: string;
  /** Physical I3S profile. */
  profile: string;
  /** Feature status keyed by capability name. */
  features: Record<string, I3SFeatureSupportStatus>;
  /** Diagnostics explaining partial and unsupported features. */
  diagnostics: I3SSupportDiagnostic[];
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
  const rendererMetadata = normalizeI3SRendererMetadata(layer);
  const diagnostics = rendererMetadata?.unsupportedProperties.length
    ? [
        {
          code: 'metadata-preserved' as const,
          message: 'Renderer properties were preserved for downstream evaluation.',
          path: 'drawingInfo.renderer'
        }
      ]
    : [];
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
    rendererMetadata,
    popupMetadata: layer.popupInfo,
    diagnostics,
    supportReport: getI3SFeatureSupportReport(layer),
    layer
  };
}

/** Normalizes common renderer metadata without evaluating expressions. */
export function normalizeI3SRendererMetadata(layer: SceneLayer3D): I3SRendererMetadata | undefined {
  const renderer = layer.drawingInfo?.renderer;
  if (!renderer) return undefined;
  const normalized: I3SRendererMetadata = {
    type: renderer.type,
    field: typeof renderer.field === 'string' ? renderer.field : undefined,
    classes: Array.isArray(renderer.classBreakInfos)
      ? renderer.classBreakInfos
      : Array.isArray(renderer.uniqueValueInfos)
        ? renderer.uniqueValueInfos
        : undefined,
    visualVariables: Array.isArray(renderer.visualVariables) ? renderer.visualVariables : undefined,
    labelClasses: Array.isArray(renderer.labelClasses) ? renderer.labelClasses : undefined,
    raw: renderer,
    unsupportedProperties: []
  };
  const knownProperties = new Set([
    'type',
    'field',
    'classBreakInfos',
    'uniqueValueInfos',
    'visualVariables',
    'labelClasses',
    'symbol',
    'defaultSymbol',
    'defaultLabel'
  ]);
  normalized.unsupportedProperties = Object.keys(renderer).filter(key => !knownProperties.has(key));
  return normalized;
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
