// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BuilderInput} from '../../lib/utils/builder-input';

import type {Store} from '@loaders.gl/i3s';

/** Converter stores use the legacy uppercase string identifier. */
export type StoreBuilderRecord = Omit<Store, 'id'> & {
  /** Store identifier before uppercase normalization. */
  id: string;
};

/** Builds store with the legacy field selection and defaults. */
export function createStore(input: BuilderInput<StoreBuilderRecord> | null | undefined): Store {
  const source = input ?? {};
  return {
    id: source.id!.toUpperCase(),
    profile: source.profile ?? 'meshpyramids',
    version: source.version ?? '1.8',
    resourcePattern: source.resourcePattern ?? [
      '3dNodeIndexDocument',
      'Attributes',
      'SharedResource',
      'Geometry'
    ],
    rootNode: source.rootNode ?? './nodes/root',
    extent: source.extent ?? undefined,
    indexCRS: source.indexCRS ?? 'http://www.opengis.net/def/crs/EPSG/0/4326',
    vertexCRS: source.vertexCRS ?? 'http://www.opengis.net/def/crs/EPSG/0/4326',
    normalReferenceFrame: source.normalReferenceFrame ?? 'earth-centered',
    attributeEncoding: source.attributeEncoding ?? 'application/octet-stream; version=1.6',
    textureEncoding: source.textureEncoding ?? ['image/jpeg', 'image/ktx2'],
    lodType: source.lodType ?? 'MeshPyramid',
    lodModel: source.lodModel ?? 'node-switching',
    defaultGeometrySchema: source.defaultGeometrySchema ?? {
      geometryType: 'triangles',
      header: [
        {
          property: 'vertexCount',
          type: 'UInt32'
        },
        {
          property: 'featureCount',
          type: 'UInt32'
        }
      ],
      topology: 'PerAttributeArray',
      ordering: ['position', 'normal', 'uv0', 'color'],
      vertexAttributes: {
        position: {
          valueType: 'Float32',
          valuesPerElement: 3
        },
        normal: {
          valueType: 'Float32',
          valuesPerElement: 3
        },
        uv0: {
          valueType: 'Float32',
          valuesPerElement: 2
        },
        color: {
          valueType: 'UInt8',
          valuesPerElement: 4
        }
      },
      featureAttributeOrder: ['id', 'faceRange'],
      featureAttributes: {
        id: {
          valueType: 'UInt64',
          valuesPerElement: 1
        },
        faceRange: {
          valueType: 'UInt32',
          valuesPerElement: 2
        }
      }
    }
  } as Store;
}
