import test from 'tape-promise/tape';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../../../../i3s/src/helpers/i3s-nodepages-tiles';
import B3dmConverter from '../../../src/3d-tiles-converter/helpers/b3dm-converter';
import {isBrowser} from '@loaders.gl/core';
import {load} from '@loaders.gl/core';
import {I3SAttributeLoader} from '@loaders.gl/i3s';

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
};

async function _loadI3STile() {
  const i3SNodePagesTiles = new I3SNodePagesTiles(TILESET_STUB, {});
  const nodeRoot = await i3SNodePagesTiles.formTileFromNodePages(0);
  const node1 = await i3SNodePagesTiles.formTileFromNodePages(1);
  TILESET_STUB.root = nodeRoot;
  const tileset = new Tileset3D(TILESET_STUB);
  const tile = new Tile3D(tileset, node1);
  await tileset._loadTile(tile);
  return tile;
}

async function _loadAttributes(tile, attributeStorageInfo) {
  const promises = [];
  const {attributeUrls} = tile.header;

  for (let index = 0; index < attributeUrls.length; index++) {
    const inputUrl = `${attributeUrls[index]}/index.bin`;
    const attribute = attributeStorageInfo[index];
    const options = {
      attributeName: attribute.name,
      attributeType: attribute.attributeValues.valueType
    };

    promises.push(load(inputUrl, I3SAttributeLoader, options));
  }
  const attributesList = await Promise.all(promises);
  return Object.assign({}, ...attributesList);
}

test('cli - b3dm converter#should convert i3s node data to b3dm encoded data', async t => {
  if (!isBrowser) {
    const tile = await _loadI3STile();
    const i3sContent = tile.content;
    t.ok(i3sContent);
    const attributes = await _loadAttributes(tile, TILESET_STUB.attributeStorageInfo);
    const b3dmConverter = new B3dmConverter();
    const encodedContent = await b3dmConverter.convert(i3sContent, attributes);

    t.ok(encodedContent);
    t.ok(b3dmConverter.i3sContent.attributes._BATCHID);
    t.notOk(b3dmConverter.i3sContent.attributes.featureIds);
    t.notOk(b3dmConverter.i3sContent.attributes.faceRange);
    t.equal(b3dmConverter.i3sContent.attributes._BATCHID.value[0], 0);
    t.ok(attributes);
    t.equal(attributes.OBJECTID[0], 4);
    t.equal(attributes.NAME[0], 'SanfranI_00004.flt\x00');

    t.end();
  }
});
