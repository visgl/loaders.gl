// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fetchFile, parse} from '@loaders.gl/core';
import {I3SNodePageLoader} from '@loaders.gl/i3s';
import {
  I3SPointCloudSceneLayerSchema,
  I3SPointSceneLayerSchema,
  I3SSceneLayerSchema
} from '@loaders.gl/i3s/i3s-zod-schema';
import {describe, expect, it} from 'vitest';
import {parseSLPKArchive} from '../src/lib/parsers/parse-slpk/parse-slpk';
import {parseI3STileAttribute} from '../src/lib/parsers/parse-i3s-attribute';
import {parseI3STileContent, parseUint64Values} from '../src/lib/parsers/parse-i3s-tile-content';
import {getLegacyMaterialDefinition, normalizeTileData} from '../src/lib/parsers/parse-i3s';
import {loadFeatureAttributes} from '../src/i3s-attribute-loader-with-parser';
import {loadStatistics} from '../src/i3s-statistics';
import {createReadableFileFromBuffer} from 'test/utils/readable-files';

const SCENE_LAYER_FIXTURES = [
  {
    name: 'I3S 1.8 Point',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-1.8-point.json',
    expectedVersion: '1.8',
    expectedLayerType: 'Point'
  },
  {
    name: 'I3S 1.6 3D Object',
    url: '@loaders.gl/i3s/test/data/SanFrancisco_Bldgs/SceneServer/layers/0',
    expectedVersion: '1.6',
    expectedLayerType: '3DObject'
  },
  {
    name: 'I3S 1.8 3D Object',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-1.8-3d-object.json',
    expectedVersion: '1.8',
    expectedLayerType: '3DObject'
  },
  {
    name: 'I3S 1.9 3D Object',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-1.9-3d-object.json',
    expectedVersion: '1.9',
    expectedLayerType: '3DObject'
  },
  {
    name: 'I3S 1.10 3D Object with forward fields',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-1.10-3d-object.json',
    expectedVersion: '1.10',
    expectedLayerType: '3DObject'
  },
  {
    name: 'I3S 2.1 Point Cloud',
    url: '@loaders.gl/i3s/test/data/conformance/i3s-2.1-point-cloud.json',
    expectedVersion: '2.1',
    expectedLayerType: 'PointCloud'
  }
] as const;

describe('I3S conformance fixtures', () => {
  it.each(SCENE_LAYER_FIXTURES)('accepts $name scene-layer metadata', async fixture => {
    const response = await fetchFile(fixture.url);
    const document = await response.json();
    const sceneLayer =
      fixture.expectedLayerType === 'PointCloud'
        ? I3SPointCloudSceneLayerSchema.parse(document)
        : fixture.expectedLayerType === 'Point'
          ? I3SPointSceneLayerSchema.parse(document)
          : I3SSceneLayerSchema.parse(document);

    expect(sceneLayer.layerType).toBe(fixture.expectedLayerType || '3DObject');
    expect(sceneLayer.store.version).toBe(fixture.expectedVersion);
  });

  it('accepts the representative I3S 1.7 node-page fixture', async () => {
    const response = await fetchFile(
      '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0/nodepages/0'
    );
    const nodePage = await parse(response, I3SNodePageLoader);

    expect(nodePage.nodes).toHaveLength(16);
    expect(nodePage.nodes[2].lodThreshold).toBe(870638.071285568);
  });

  it('rejects an incomplete Point Cloud profile without an index block size', () => {
    expect(() =>
      I3SPointCloudSceneLayerSchema.parse({
        id: 0,
        layerType: 'PointCloud',
        version: '2.1',
        capabilities: ['View'],
        disablePopup: false,
        store: {
          profile: 'pointcloud',
          version: '2.1',
          defaultGeometrySchema: {geometryType: 'points'}
        }
      })
    ).toThrow(/Invalid input|nodesPerPage|nodePerIndexBlock/);
  });

  it('rejects an incomplete Point profile without point node pages', () => {
    expect(() =>
      I3SPointSceneLayerSchema.parse({
        id: 0,
        layerType: 'Point',
        version: '1.8',
        capabilities: ['View'],
        disablePopup: false,
        store: {profile: 'points', version: '1.8'},
        geometryDefinitions: [{geometryBuffers: []}]
      })
    ).toThrow(/pointNodePages/);
  });

  it('rejects a Point Cloud layer with a non-Point Cloud store profile', () => {
    expect(() =>
      I3SPointCloudSceneLayerSchema.parse({
        id: 0,
        layerType: 'PointCloud',
        version: '2.1',
        capabilities: ['View'],
        disablePopup: false,
        store: {
          profile: 'meshpyramids',
          version: '2.1',
          index: {nodePerIndexBlock: 64},
          defaultGeometrySchema: {geometryType: 'points'}
        }
      })
    ).toThrow(/profile/);
  });

  it('preserves UInt64 values through Number.MAX_SAFE_INTEGER', () => {
    const buffer = new ArrayBuffer(16);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 0x89abcdef, true);
    dataView.setUint32(4, 0x1, true);
    dataView.setUint32(8, 0xffffffff, true);
    dataView.setUint32(12, 0x1fffff, true);

    const values = parseUint64Values(buffer, 2, 8);

    expect(values).toBeInstanceOf(Float64Array);
    expect(values[0]).toBe(0x1_89abcdef);
    expect(values[1]).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('decodes declared numeric feature attribute types', () => {
    const int32Buffer = new ArrayBuffer(12);
    const int32View = new DataView(int32Buffer);
    int32View.setInt32(4, -7, true);
    int32View.setInt32(8, 42, true);
    const int32 = parseI3STileAttribute(int32Buffer, {
      attributeName: 'LEVEL',
      attributeType: 'Int32'
    }).LEVEL;

    const float32Buffer = new ArrayBuffer(12);
    const float32View = new DataView(float32Buffer);
    float32View.setFloat32(4, 1.5, true);
    float32View.setFloat32(8, -2.25, true);
    const float32 = parseI3STileAttribute(float32Buffer, {
      attributeName: 'HEIGHT',
      attributeType: 'Float32'
    }).HEIGHT;

    const uint64Buffer = new ArrayBuffer(24);
    const uint64View = new DataView(uint64Buffer);
    uint64View.setBigUint64(8, 0x1_0000_0001n, true);
    uint64View.setBigUint64(16, 0x1_ffff_ffff_ffff_ffn, true);
    const uint64 = parseI3STileAttribute(uint64Buffer, {
      attributeName: 'GLOBAL_ID',
      attributeType: 'UInt64'
    }).GLOBAL_ID;

    expect(Array.from(int32 as Int32Array)).toEqual([-7, 42]);
    expect(Array.from(float32 as Float32Array)).toEqual([1.5, -2.25]);
    expect(Array.from(uint64 as Float64Array)).toEqual([0x1_0000_0001, 0x1_ffff_ffff_ffff_ff]);
  });

  it('formats date fields and preserves null numeric values', async () => {
    const objectIdsBuffer = new ArrayBuffer(12);
    const objectIdsView = new DataView(objectIdsBuffer);
    objectIdsView.setUint32(4, 7, true);
    objectIdsView.setUint32(8, 8, true);

    const datesBuffer = new ArrayBuffer(24);
    const datesView = new DataView(datesBuffer);
    datesView.setFloat64(8, Date.UTC(2024, 0, 1), true);
    datesView.setFloat64(16, Date.UTC(2024, 0, 2, 3, 4, 5), true);

    const stringDateValues = ['2024-01-01T00:00:00\0', '2024-01-02T03:04\0'];
    const encodedStringDateValues = stringDateValues.map(value => new TextEncoder().encode(value));
    const stringDatesBuffer = new ArrayBuffer(
      16 + encodedStringDateValues[0].byteLength + encodedStringDateValues[1].byteLength
    );
    const stringDatesView = new DataView(stringDatesBuffer);
    stringDatesView.setUint32(0, stringDateValues.length, true);
    stringDatesView.setUint32(8, encodedStringDateValues[0].byteLength, true);
    stringDatesView.setUint32(12, encodedStringDateValues[1].byteLength, true);
    new Uint8Array(stringDatesBuffer, 16).set(encodedStringDateValues[0]);
    new Uint8Array(stringDatesBuffer, 16 + encodedStringDateValues[0].byteLength).set(
      encodedStringDateValues[1]
    );

    const nullValuesBuffer = new ArrayBuffer(24);
    const nullValuesView = new DataView(nullValuesBuffer);
    nullValuesView.setFloat64(8, 10, true);
    nullValuesView.setFloat64(16, Number.NaN, true);

    const guidValues = [
      '{11111111-1111-1111-1111-111111111111}\0',
      '{22222222-2222-2222-2222-222222222222}\0'
    ];
    const encodedGuidValues = guidValues.map(value => new TextEncoder().encode(value));
    const guidsBuffer = new ArrayBuffer(
      16 + encodedGuidValues[0].byteLength + encodedGuidValues[1].byteLength
    );
    const guidsView = new DataView(guidsBuffer);
    guidsView.setUint32(0, guidValues.length, true);
    guidsView.setUint32(8, encodedGuidValues[0].byteLength, true);
    guidsView.setUint32(12, encodedGuidValues[1].byteLength, true);
    new Uint8Array(guidsBuffer, 16).set(encodedGuidValues[0]);
    new Uint8Array(guidsBuffer, 16 + encodedGuidValues[0].byteLength).set(encodedGuidValues[1]);

    const responses: Record<string, ArrayBuffer> = {
      '/attributes/objectids': objectIdsBuffer,
      '/attributes/dates': datesBuffer,
      '/attributes/string-dates': stringDatesBuffer,
      '/attributes/guids': guidsBuffer,
      '/attributes/nulls': nullValuesBuffer
    };
    const attributes = await loadFeatureAttributes(
      {
        tileset: {
          tileset: {
            attributeStorageInfo: [
              {name: 'OBJECTID', objectIds: []},
              {name: 'BuildDate', attributeValues: {valueType: 'Float64'}},
              {name: 'CreatedDate', attributeValues: {valueType: 'String'}},
              {name: 'AssetGuid', attributeValues: {valueType: 'String'}},
              {name: 'OptionalHeight', attributeValues: {valueType: 'Float64'}}
            ],
            fields: [
              {name: 'OBJECTID', type: 'esriFieldTypeOID'},
              {name: 'BuildDate', type: 'esriFieldTypeDate'},
              {name: 'CreatedDate', type: 'esriFieldTypeDate'},
              {name: 'AssetGuid', type: 'esriFieldTypeGUID'},
              {name: 'OptionalHeight', type: 'esriFieldTypeDouble'}
            ]
          }
        },
        header: {
          attributeUrls: [
            '/attributes/objectids',
            '/attributes/dates',
            '/attributes/string-dates',
            '/attributes/guids',
            '/attributes/nulls'
          ]
        }
      },
      8,
      {
        fetch: async url => new Response(responses[String(url).split('?')[0]])
      }
    );

    expect(attributes).toEqual({
      OBJECTID: '8',
      BuildDate: '2024-01-02T03:04:05.000Z',
      CreatedDate: '2024-01-02T03:04:00.000Z',
      AssetGuid: '{22222222-2222-2222-2222-222222222222}',
      OptionalHeight: null
    });
  });

  it('loads typed layer statistics and isolates missing resources', async () => {
    const requestedUrls: string[] = [];
    const statistics = await loadStatistics(
      [
        {key: 'height', name: 'Height', href: './statistics/height'},
        {key: 'missing', name: 'Missing', href: './statistics/missing'}
      ],
      {
        core: {
          baseUrl: 'https://example.com/layers/0',
          fetch: async url => {
            requestedUrls.push(String(url));
            if (String(url).includes('/missing')) {
              return new Response(null, {status: 404});
            }
            return new Response(JSON.stringify({count: 2, min: 1, max: 3, avg: 2}));
          }
        },
        i3s: {token: 'secret'}
      }
    );

    expect(requestedUrls).toEqual([
      'https://example.com/layers/0/statistics/height?token=secret',
      'https://example.com/layers/0/statistics/missing?token=secret'
    ]);
    expect(statistics).toEqual({
      height: {count: 2, min: 1, max: 3, avg: 2},
      missing: null
    });
  });

  it('keeps absolute statistics URLs unchanged', async () => {
    const statistics = await loadStatistics(
      [{key: 'height', name: 'Height', href: 'https://cdn.example.com/statistics/height'}],
      {
        core: {
          baseUrl: 'https://example.com/layers/0',
          fetch: async url => {
            expect(url).toBe('https://cdn.example.com/statistics/height');
            return new Response(JSON.stringify({count: 1}));
          }
        }
      }
    );

    expect(statistics).toEqual({height: {count: 1}});
  });

  it('preserves UInt64 feature IDs through face-range expansion', async () => {
    const featureId = 0x1_89abcdef;
    const buffer = new ArrayBuffer(60);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 3, true);
    dataView.setUint32(4, 1, true);
    for (let index = 0; index < 9; index++) {
      dataView.setFloat32(8 + index * 4, index % 3 === 2 ? 0 : index % 3, true);
    }
    dataView.setUint32(44, featureId >>> 0, true);
    dataView.setUint32(48, Math.floor(featureId / 2 ** 32), true);
    dataView.setUint32(52, 0, true);
    dataView.setUint32(56, 0, true);

    const content = await parseI3STileContent(
      buffer,
      {mbs: [0, 0, 0]} as any,
      {
        store: {
          defaultGeometrySchema: {
            header: [
              {property: 'vertexCount', type: 'UInt32'},
              {property: 'featureCount', type: 'UInt32'}
            ],
            ordering: ['position'],
            vertexAttributes: {
              position: {valueType: 'Float32', valuesPerElement: 3}
            },
            featureAttributeOrder: ['id', 'faceRange'],
            featureAttributes: {
              id: {valueType: 'UInt64', valuesPerElement: 1},
              faceRange: {valueType: 'UInt32', valuesPerElement: 2}
            }
          }
        }
      } as any
    );

    expect(content.featureIds).toBeInstanceOf(Float64Array);
    expect(Array.from(content.featureIds as Float64Array)).toEqual([
      featureId,
      featureId,
      featureId
    ]);
    expect(content.drawRanges).toEqual([
      {
        featureId,
        firstPrimitive: 0,
        primitiveCount: 1,
        firstVertex: 0,
        vertexCount: 3
      }
    ]);
  });

  it('preserves legacy mesh-segmentation bytes after schema-defined attributes', async () => {
    const buffer = new ArrayBuffer(48);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 3, true);
    dataView.setUint32(4, 0, true);
    for (let index = 0; index < 9; index++) {
      dataView.setFloat32(8 + index * 4, index % 3, true);
    }
    new Uint8Array(buffer, 44).set([0x53, 0x45, 0x47, 0x01]);

    const content = await parseI3STileContent(
      buffer,
      {mbs: [0, 0, 0]} as any,
      {
        store: {
          defaultGeometrySchema: {
            header: [
              {property: 'vertexCount', type: 'UInt32'},
              {property: 'featureCount', type: 'UInt32'}
            ],
            ordering: ['position'],
            vertexAttributes: {
              position: {valueType: 'Float32', valuesPerElement: 3}
            },
            featureAttributeOrder: [],
            featureAttributes: {}
          }
        }
      } as any
    );

    expect(content.meshSegmentation).toBeInstanceOf(ArrayBuffer);
    expect(Array.from(new Uint8Array(content.meshSegmentation!))).toEqual([0x53, 0x45, 0x47, 0x01]);
  });

  it('loads and normalizes a legacy shared-resource material', async () => {
    const sharedResources = {
      materialDefinitions: {
        '0': {
          params: {
            diffuse: [0.2, 0.4, 0.6],
            transparency: 0.25,
            renderMode: 'textured',
            cullFace: 'none'
          }
        }
      },
      textureDefinitions: {
        '0': {encoding: ['image/png'], wrap: ['repeat', 'mirror'], images: []}
      }
    };
    let requestedUrl = '';
    const tile = await normalizeTileData(
      {
        id: 'legacy',
        mbs: [0, 0, 0, 1],
        sharedResource: {href: './shared'}
      },
      {
        url: '/layers/0/nodes/legacy',
        baseUrl: '/layers/0/nodes',
        queryString: '',
        fetch: async url => {
          requestedUrl = String(url);
          return new Response(JSON.stringify(sharedResources));
        },
        coreApi: {} as any,
        _parse: async () => null
      }
    );

    expect(tile.textureFormat).toBe('png');
    expect(requestedUrl).toBe('/layers/0/nodes/legacy/shared');
    expect(tile.sharedResources).toEqual(sharedResources);
    expect(tile.materialDefinition?.alphaMode).toBe('blend');
    expect(tile.materialDefinition?.doubleSided).toBe(true);
    expect(tile.materialDefinition?.pbrMetallicRoughness.baseColorTexture?.wrapS).toBe('repeat');
    expect(tile.materialDefinition?.pbrMetallicRoughness.baseColorTexture?.wrapT).toBe('mirror');
    expect(tile.materialDefinition?.pbrMetallicRoughness.baseColorFactor).toEqual([
      51, 102, 153, 191.25
    ]);
    expect(getLegacyMaterialDefinition(undefined)).toBeUndefined();
  });

  it('expands raw archive shared-resource requests to the stored bundle path', async () => {
    const response = await fetchFile('@loaders.gl/i3s/test/data/DA12_subset.slpk');
    const archive = await parseSLPKArchive(
      await createReadableFileFromBuffer(await response.arrayBuffer())
    );
    const sharedResources = await archive.getFile('nodes/3/shared');

    expect(sharedResources.byteLength).toBe(333);
  });

  it('loads all texture sets referenced by a PBR material', async () => {
    const buffer = new ArrayBuffer(44);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 3, true);
    dataView.setUint32(4, 0, true);
    for (let index = 0; index < 9; index++) {
      dataView.setFloat32(8 + index * 4, index % 3, true);
    }

    const content = await parseI3STileContent(
      buffer,
      {
        isDracoGeometry: false,
        attributeUrls: [],
        mbs: [0, 0, 0],
        textureUrls: [
          {textureSetDefinitionId: 0, textureUrl: '/textures/base', textureFormat: 'png'},
          {textureSetDefinitionId: 1, textureUrl: '/textures/normal', textureFormat: 'png'}
        ],
        materialDefinition: {
          pbrMetallicRoughness: {
            metallicFactor: 0,
            roughnessFactor: 1,
            baseColorTexture: {
              textureSetDefinitionId: 0,
              wrapS: 'repeat',
              wrapT: 'mirror'
            }
          },
          normalTexture: {textureSetDefinitionId: 1},
          alphaMode: 'opaque'
        }
      },
      {
        store: {
          defaultGeometrySchema: {
            header: [
              {property: 'vertexCount', type: 'UInt32'},
              {property: 'featureCount', type: 'UInt32'}
            ],
            ordering: ['position'],
            vertexAttributes: {
              position: {valueType: 'Float32', valuesPerElement: 3}
            },
            featureAttributeOrder: [],
            featureAttributes: {}
          }
        }
      } as any,
      {i3s: {decodeTextures: false}} as any,
      {
        fetch: async url => new Response(new TextEncoder().encode(url).buffer),
        coreApi: {} as any,
        _parse: async () => null
      } as any
    );

    expect(Object.keys(content.textures || {})).toEqual(['0', '1']);
    expect(
      content.material?.pbrMetallicRoughness.baseColorTexture.texture.source.image
    ).toBeInstanceOf(ArrayBuffer);
    expect(content.material?.pbrMetallicRoughness.baseColorTexture.texture.sampler).toEqual({
      wrapS: 10497,
      wrapT: 33648
    });
    expect(content.material?.normalTexture.texture.source.image).toBeInstanceOf(ArrayBuffer);
  });

  it('exposes additional uncompressed UV sets', async () => {
    const buffer = new ArrayBuffer(92);
    const dataView = new DataView(buffer);
    dataView.setUint32(0, 3, true);
    dataView.setUint32(4, 0, true);
    for (let index = 0; index < 9; index++) {
      dataView.setFloat32(8 + index * 4, index % 3, true);
    }
    for (let index = 0; index < 6; index++) {
      dataView.setFloat32(44 + index * 4, index / 10, true);
      dataView.setFloat32(68 + index * 4, index / 20, true);
    }

    const content = await parseI3STileContent(
      buffer,
      {isDracoGeometry: false, attributeUrls: [], mbs: [0, 0, 0]},
      {
        store: {
          defaultGeometrySchema: {
            header: [
              {property: 'vertexCount', type: 'UInt32'},
              {property: 'featureCount', type: 'UInt32'}
            ],
            ordering: ['position', 'uv0', 'uv1'],
            vertexAttributes: {
              position: {valueType: 'Float32', valuesPerElement: 3},
              uv0: {valueType: 'Float32', valuesPerElement: 2},
              uv1: {valueType: 'Float32', valuesPerElement: 2}
            },
            featureAttributeOrder: [],
            featureAttributes: {}
          }
        }
      } as any
    );

    expect(content.attributes.texCoords.value).toEqual(
      new Float32Array([0, 0.1, 0.2, 0.3, 0.4, 0.5])
    );
    expect(content.attributes.texCoords1.value).toEqual(
      new Float32Array([0, 0.05, 0.1, 0.15, 0.2, 0.25])
    );
  });
});
