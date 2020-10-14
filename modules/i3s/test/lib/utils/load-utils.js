import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../../../src/helpers/i3s-nodepages-tiles';

/**
 * The data stub of "tileset header" which I3SLoader returns after loading
 * "/SceneServer/layers/0" json
 */
const TILESET_STUB = {
  fetchOptions: {},
  nodePages: {
    nodesPerPage: 64,
    lodSelectionMetricType: 'maxScreenThresholdSQ'
  },
  url: '@loaders.gl/i3s/test/data/SanFrancisco_3DObjects_1_7/SceneServer/layers/0',
  materialDefinitions: [
    {
      doubleSided: true,
      emissiveFactor: [255, 255, 255],
      pbrMetallicRoughness: {
        baseColorTexture: {textureSetDefinitionId: 0}
      }
    }
  ],
  textureSetDefinitions: [{formats: [{name: '0', format: 'jpg'}]}],
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
  type: 'I3S',
  loader: I3SLoader
};

export async function loadI3STileContent() {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB, {});
  const nodeRoot = await i3SNodePagesTiles.formTileFromNodePages(0);
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  TILESET_STUB.root = nodeRoot;
  const tileset = new Tileset3D(TILESET_STUB);
  const tile = new Tile3D(tileset, node1);
  await tileset._loadTile(tile);
  return tile.content;
}
