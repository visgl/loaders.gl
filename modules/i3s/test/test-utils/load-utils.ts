import {I3SLoader, I3STilesetHeader, SceneLayer3D} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D, TILESET_TYPE} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../../src/lib/helpers/i3s-nodepages-tiles';

export const TEST_LAYER_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0';

/**
 * The data stub of "tileset header" which I3SLoader returns after loading
 * "/SceneServer/layers/0" json
 */
export const TILESET_STUB = (): SceneLayer3D => ({
  id: 0,
  layerType: '3DObject',
  version: '1.7',
  capabilities: ['View', 'Query'],
  disablePopup: false,
  nodePages: {
    nodesPerPage: 64,
    lodSelectionMetricType: 'maxScreenThresholdSQ'
  },
  materialDefinitions: [
    {
      doubleSided: true,
      emissiveFactor: [255, 255, 255],
      alphaMode: 'opaque',
      pbrMetallicRoughness: {
        baseColorTexture: {textureSetDefinitionId: 0},
        metallicFactor: 0,
        roughnessFactor: 1
      }
    }
  ],
  textureSetDefinitions: [
    {
      formats: [
        {name: '0', format: 'jpg'},
        {name: '0_0_1', format: 'dds'}
      ]
    }
  ],
  geometryDefinitions: [
    {
      geometryBuffers: [
        {
          offset: 8,
          position: {type: 'Float32', component: 3},
          normal: {type: 'Float32', component: 3},
          uv0: {type: 'Float32', component: 2},
          color: {type: 'UInt8', component: 4},
          featureId: {
            type: 'UInt64',
            component: 1,
            binding: 'per-feature'
          },
          faceRange: {
            type: 'UInt32',
            component: 2,
            binding: 'per-feature'
          }
        },
        {
          compressedAttributes: {
            encoding: 'draco',
            attributes: ['position', 'uv0', 'color', 'feature-index']
          }
        }
      ]
    },
    {
      geometryBuffers: [
        {
          offset: 8,
          position: {type: 'Float32', component: 3},
          normal: {type: 'Float32', component: 3},
          uv0: {type: 'Float32', component: 2},
          color: {type: 'UInt8', component: 4},
          uvRegion: {type: 'UInt16', component: 4},
          featureId: {
            type: 'UInt64',
            component: 1,
            binding: 'per-feature'
          },
          faceRange: {
            type: 'UInt32',
            component: 2,
            binding: 'per-feature'
          }
        },
        {
          compressedAttributes: {
            encoding: 'draco',
            attributes: ['position', 'uv0', 'color', 'feature-index', 'uv-region']
          }
        }
      ]
    }
  ],
  store: {
    profile: 'meshpyramids',
    version: '1.7',
    defaultGeometrySchema: {
      geometryType: 'triangles',
      header: [
        {property: 'vertexCount', type: 'UInt32'},
        {property: 'featureCount', type: 'UInt32'}
      ],
      topology: 'PerAttributeArray',
      ordering: ['position', 'normal', 'uv0', 'color'],
      vertexAttributes: {
        position: {valueType: 'Float32', valuesPerElement: 3},
        normal: {valueType: 'Float32', valuesPerElement: 3},
        uv0: {valueType: 'Float32', valuesPerElement: 2},
        color: {valueType: 'UInt8', valuesPerElement: 4}
      },
      featureAttributeOrder: ['id', 'faceRange'],
      featureAttributes: {
        id: {valueType: 'UInt64', valuesPerElement: 1},
        faceRange: {valueType: 'UInt32', valuesPerElement: 2}
      }
    }
  },
  attributeStorageInfo: [
    {
      key: 'f_0',
      name: 'OBJECTID',
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      ordering: ['attributeValues'],
      attributeValues: {
        valueType: 'Oid32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_1',
      name: 'NAME',
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      ordering: ['attributeByteCounts', 'attributeValues'],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    }
  ],
  fields: [
    {
      name: 'OBJECTID',
      type: 'esriFieldTypeOID',
      alias: 'OBJECTID'
    },
    {
      name: 'NAME',
      type: 'esriFieldTypeString',
      alias: 'NAME'
    }
  ]
});

export async function getI3sTileHeader(
  options = {},
  _replaceWithKTX2Texture = false,
  i3sTilesetData = TILESET_STUB()
): Promise<I3STilesetHeader> {
  // Replaced mocked textures with one ktx2 texture for testing purposes.
  if (_replaceWithKTX2Texture && i3sTilesetData.textureSetDefinitions) {
    i3sTilesetData.textureSetDefinitions[0].formats = [{name: '1', format: 'ktx2'}];
  }
  const i3SNodePagesTiles = new I3SNodePagesTiles(i3sTilesetData, TEST_LAYER_URL, options);
  const nodeRoot = await i3SNodePagesTiles.formTileFromNodePages(0);
  return {
    ...i3sTilesetData,
    root: nodeRoot,
    type: TILESET_TYPE.I3S
  };
}

export async function loadI3STile(options = {}, _replaceWithKTX2Texture = false) {
  const i3sTilesetData = TILESET_STUB();
  // Replaced mocked textures with one ktx2 texture for testing purposes.
  if (_replaceWithKTX2Texture && i3sTilesetData.textureSetDefinitions) {
    i3sTilesetData.textureSetDefinitions[0].formats = [{name: '1', format: 'ktx2'}];
  }
  const i3SNodePagesTiles = new I3SNodePagesTiles(i3sTilesetData, TEST_LAYER_URL, options);
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  const I3STilesetHeader = await getI3sTileHeader(options, _replaceWithKTX2Texture);
  const tileset = new Tileset3D({...I3STilesetHeader, loader: I3SLoader}, options);
  const tile = new Tile3D(tileset, node1);
  await tileset._loadTile(tile);
  return tile;
}

export async function loadI3STileContent(options = {}) {
  const tile = await loadI3STile(options);
  return tile.content;
}
