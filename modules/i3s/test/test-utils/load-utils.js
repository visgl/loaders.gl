import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../../src/helpers/i3s-nodepages-tiles';

/**
 * The data stub of "tileset header" which I3SLoader returns after loading
 * "/SceneServer/layers/0" json
 */
export const TILESET_STUB = () => ({
  fetchOptions: {},
  nodePages: {
    nodesPerPage: 64,
    lodSelectionMetricType: 'maxScreenThresholdSQ'
  },
  url:
    'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0',
  materialDefinitions: [
    {
      doubleSided: true,
      emissiveFactor: [255, 255, 255],
      pbrMetallicRoughness: {
        baseColorTexture: {textureSetDefinitionId: 0}
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
  type: 'I3S',
  loader: I3SLoader
});

export async function loadI3STile(options = {}) {
  const i3sTilesetData = TILESET_STUB();
  const i3SNodePagesTiles = new I3SNodePagesTiles(i3sTilesetData, options);
  const nodeRoot = await i3SNodePagesTiles.formTileFromNodePages(0);
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  i3sTilesetData.root = nodeRoot;
  const tileset = new Tileset3D(i3sTilesetData, options);
  const tile = new Tile3D(tileset, node1);
  await tileset._loadTile(tile);
  return tile;
}

export async function loadI3STileContent(options = {}) {
  const tile = await loadI3STile(options);
  return tile.content;
}
