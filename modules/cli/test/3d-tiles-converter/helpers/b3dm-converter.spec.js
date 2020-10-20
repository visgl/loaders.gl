import test from 'tape-promise/tape';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../../../../i3s/src/helpers/i3s-nodepages-tiles';
import B3dmConverter from '../../../src/3d-tiles-converter/helpers/b3dm-converter';
import {isBrowser} from '@loaders.gl/core';

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

async function _loadI3SContent() {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB, {});
  const nodeRoot = await i3SNodePagesTiles.formTileFromNodePages(0);
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  TILESET_STUB.root = nodeRoot;
  const tileset = new Tileset3D(TILESET_STUB);
  const tile = new Tile3D(tileset, node1);
  await tileset._loadTile(tile);
  return tile.content;
}

test('cli - b3dm converter#should convert i3s node data to b3dm encoded data', async t => {
  if (!isBrowser) {
    const i3sContent = await _loadI3SContent();
    t.ok(i3sContent);

    const b3dmConverter = new B3dmConverter();
    const encodedContent = b3dmConverter.convert(i3sContent);

    t.ok(encodedContent);
    t.deepEqual(b3dmConverter.rtcCenter, [4051665.75, 618151.6875, 4870759]);
    t.ok(b3dmConverter.i3sContent.attributes._BATCHID);
    t.notOk(b3dmConverter.i3sContent.attributes.featureIds);
    t.notOk(b3dmConverter.i3sContent.attributes.faceRange);
    t.equal(b3dmConverter.i3sContent.attributes._BATCHID.value[0], 7.0345e-320);

    t.end();
  }
});
