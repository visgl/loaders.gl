// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

import type {SceneLayer3D} from '@loaders.gl/i3s';
import {createStore, type StoreBuilderRecord} from './store';

/** Partially specified nested records completed by the legacy layer builder. */
type LayerBuilderRecord = Omit<
  SceneLayer3D,
  'store' | 'nodePages' | 'spatialReference' | 'heightModelInfo' | 'fullExtent'
> & {
  /** Store values completed with defaults. */
  store: BuilderInput<StoreBuilderRecord>;
  /** Node page settings. */
  nodePages?: BuilderInput<NonNullable<SceneLayer3D['nodePages']>>;
  /** Spatial reference identifiers. */
  spatialReference?: BuilderInput<NonNullable<SceneLayer3D['spatialReference']>>;
  /** Height model settings. */
  heightModelInfo?: BuilderInput<NonNullable<SceneLayer3D['heightModelInfo']>>;
  /** Extent fields retained without defaults. */
  fullExtent?: BuilderInput<NonNullable<SceneLayer3D['fullExtent']>>;
};

/** Builds spatial reference with the legacy field selection and defaults. */
function createSpatialReference(
  input: BuilderInput<NonNullable<SceneLayer3D['spatialReference']>> | null | undefined
) {
  const source = input ?? {};
  return {
    wkid: source.wkid ?? 4326,
    latestWkid: source.latestWkid ?? 4326,
    vcsWkid: source.vcsWkid ?? 5773,
    latestVcsWkid: source.latestVcsWkid ?? 5773
  };
}

/** Builds height model info with the legacy field selection and defaults. */
function createHeightModelInfo(
  input: BuilderInput<NonNullable<SceneLayer3D['heightModelInfo']>> | null | undefined
) {
  const source = input ?? {};
  return {
    heightModel: source.heightModel ?? 'gravity_related_height',
    vertCRS: source.vertCRS ?? 'EGM96_Geoid',
    heightUnit: source.heightUnit ?? 'meter'
  };
}

/** Builds node pages with the legacy field selection and defaults. */
function createNodePages(
  input: BuilderInput<NonNullable<SceneLayer3D['nodePages']>> | null | undefined
) {
  const source = input ?? {};
  return {
    nodesPerPage: source.nodesPerPage ?? undefined,
    lodSelectionMetricType: source.lodSelectionMetricType ?? 'maxScreenThresholdSQ'
  };
}

/** Builds full extent with the legacy field selection and defaults. */
function createFullExtent(
  input: BuilderInput<NonNullable<SceneLayer3D['fullExtent']>> | null | undefined
) {
  const source = input ?? {};
  return {
    xmin: source.xmin ?? undefined,
    ymin: source.ymin ?? undefined,
    xmax: source.xmax ?? undefined,
    ymax: source.ymax ?? undefined,
    zmin: source.zmin ?? undefined,
    zmax: source.zmax ?? undefined
  };
}

/** Builds layers with the legacy field selection and defaults. */
export function createLayers(
  input: BuilderInput<LayerBuilderRecord> | null | undefined
): SceneLayer3D {
  const source = input ?? {};
  return {
    version: source.version!.toUpperCase(),
    id: source.id ?? 0,
    name: source.name ?? undefined,
    href: source.href ?? './layers/0',
    layerType: source.layerType ?? 'IntegratedMesh',
    spatialReference: createSpatialReference(source.spatialReference),
    capabilities: source.capabilities ?? ['View', 'Query'],
    store: createStore(source.store),
    fullExtent: createFullExtent(source.fullExtent),
    heightModelInfo: createHeightModelInfo(source.heightModelInfo),
    nodePages: createNodePages(source.nodePages),
    materialDefinitions: source.materialDefinitions ?? [],
    textureSetDefinitions: source.textureSetDefinitions ?? [],
    geometryDefinitions: source.geometryDefinitions ?? [],
    attributeStorageInfo: source.attributeStorageInfo ?? [],
    fields: source.fields ?? [],
    popupInfo: source.popupInfo ?? undefined
  } as SceneLayer3D;
}
