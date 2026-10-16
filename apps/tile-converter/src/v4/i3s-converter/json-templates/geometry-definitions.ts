// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

import type {SceneLayer3D} from '@loaders.gl/i3s';
/** Legacy geometry layout choices. */
export type GeometryConfiguration = {
  /** Whether texture coordinates are present. */
  hasTexture?: boolean;
  /** Whether UV regions are present. */
  hasUvRegions?: boolean;
  /** Whether Draco is emitted. */
  draco?: boolean;
};
/** Input to one geometry layout builder. */
export type GeometryDefinitionInput = {
  /** Geometry layout choices. */
  geometryConfig: GeometryConfiguration;
};

/** Builds plain geometry definition with the legacy field selection and defaults. */
function createPlainGeometryDefinition(
  input: BuilderInput<GeometryConfiguration> | null | undefined
) {
  const source = input ?? {};
  return {
    offset: 8,
    position: {
      type: 'Float32',
      component: 3
    },
    normal: {
      type: 'Float32',
      component: 3
    },
    ...(source.hasTexture ? {uv0: {type: 'Float32', component: 2}} : {}),
    color: {
      type: 'UInt8',
      component: 4
    },
    ...(source.hasUvRegions ? {uvRegion: {type: 'UInt16', component: 4}} : {}),
    featureId: {
      binding: 'per-feature',
      type: 'UInt64',
      component: 1
    },
    faceRange: {
      binding: 'per-feature',
      type: 'UInt32',
      component: 2
    }
  };
}

/** Builds compressed geometry definition with the legacy field selection and defaults. */
function createCompressedGeometryDefinition(
  input: BuilderInput<GeometryDefinitionInput> | null | undefined
) {
  const configuration = input!.geometryConfig!;
  return {
    compressedAttributes: {
      encoding: 'draco',
      attributes: [
        'position',
        'normal',
        ...(configuration.hasTexture ? ['uv0'] : []),
        'color',
        ...(configuration.hasUvRegions ? ['uv-region'] : []),
        'feature-index'
      ]
    }
  };
}

/** Builds geometry definition with the legacy field selection and defaults. */
export function createGeometryDefinition(
  input: BuilderInput<GeometryDefinitionInput> | null | undefined
): NonNullable<SceneLayer3D['geometryDefinitions']>[number] {
  const source = input ?? {};
  return {
    geometryBuffers: [
      createPlainGeometryDefinition(source.geometryConfig),
      ...(source.geometryConfig!.draco ? [createCompressedGeometryDefinition(source)] : [])
    ]
  } as NonNullable<SceneLayer3D['geometryDefinitions']>[number];
}
