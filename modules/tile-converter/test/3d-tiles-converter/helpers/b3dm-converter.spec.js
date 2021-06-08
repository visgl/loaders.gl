import test from 'tape-promise/tape';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {loadI3STile} from '@loaders.gl/i3s/test/test-utils/load-utils';
import B3dmConverter from '../../../src/3d-tiles-converter/helpers/b3dm-converter';
import {isBrowser} from '@loaders.gl/core';
import {load} from '@loaders.gl/core';
import {I3SAttributeLoader} from '@loaders.gl/i3s';
import {Matrix4, Vector3} from '@math.gl/core';

const ATTRIBUTES_STORAGE_INFO_STUB = [
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
];
const Y_UP_TO_Z_UP_MATRIX = new Matrix4([1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1]);

test('tile-converter - b3dm converter#should convert i3s node data to b3dm encoded data', async (t) => {
  if (!isBrowser) {
    const tile = await loadI3STile();
    const i3sContent = tile.content;
    t.ok(i3sContent);
    const attributes = await _loadAttributes(tile, ATTRIBUTES_STORAGE_INFO_STUB);
    const b3dmConverter = new B3dmConverter();
    const encodedContent = await b3dmConverter.convert(tile, attributes);
    const batchId = i3sContent.featureIds;

    t.ok(encodedContent);
    t.ok(batchId);
    t.equal(batchId.length, i3sContent.attributes.positions.value.length / 3);
    t.ok(attributes);
    t.equal(attributes.OBJECTID[0], 14238);
    t.equal(attributes.NAME[0], 'Sanfran_island_0197.flt\x00');
    t.end();
  }
});

test('tile-converter - b3dm converter#should normalise positions correctly', async (t) => {
  if (!isBrowser) {
    const tile = await loadI3STile();
    const i3sContent = tile.content;
    const originPositions = i3sContent.attributes.positions.value;
    const b3dmConverter = new B3dmConverter();
    const encodedContent = await b3dmConverter.convert(tile);

    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    t.ok(decodedContent);

    const positionOffsets = decodedContent.gltf.meshes[0].primitives[0].attributes.POSITION.value;
    const matrix = decodedContent.gltf.nodes[0].matrix;
    const positions = _transformPositionsWithMatrix(positionOffsets, matrix);
    t.ok(_areArraysEqualWithDelta(originPositions, positions, 0.0001));

    t.end();
  }
});

test('tile-converter - b3dm converter#should convert material', async (t) => {
  if (!isBrowser) {
    const tile = await loadI3STile();
    const b3dmConverter = new B3dmConverter();
    const encodedContent = await b3dmConverter.convert(tile);

    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    t.ok(decodedContent);

    t.ok(decodedContent.gltf.materials[0]);
    t.ok(decodedContent.gltf.materials[0].doubleSided);
    t.deepEqual(decodedContent.gltf.materials[0].emissiveFactor, [1, 1, 1]);
    t.equal(decodedContent.gltf.materials[0].pbrMetallicRoughness.baseColorTexture.index, 0);

    t.end();
  }
});

test('tile-converter - b3dm converter#should not convert incorrect normals', async (t) => {
  if (!isBrowser) {
    const tile = await loadI3STile();
    const b3dmConverter = new B3dmConverter();
    const encodedContent = await b3dmConverter.convert(tile);
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    t.ok(decodedContent);

    t.ok(decodedContent.gltf.meshes[0].primitives[0].attributes);
    t.ok(decodedContent.gltf.meshes[0].primitives[0].attributes.NORMAL);

    // If all normals are 0, converter should not convert such normals
    tile.content.attributes.normals.value.fill(0);
    const encodedContent2 = await b3dmConverter.convert(tile);
    const decodedContent2 = await load(encodedContent2, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    t.ok(decodedContent2);
    t.ok(decodedContent2.gltf.meshes[0].primitives[0].attributes);
    t.notOk(decodedContent2.gltf.meshes[0].primitives[0].attributes.NORMAL);

    t.end();
  }
});

test('tile-converter - b3dm converter#should handle geometry without normals', async (t) => {
  if (!isBrowser) {
    const tile = await loadI3STile();
    const b3dmConverter = new B3dmConverter();

    delete tile.content.attributes.normals;
    const encodedContent = await b3dmConverter.convert(tile);
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    t.ok(decodedContent);
    t.ok(decodedContent.gltf.meshes[0].primitives[0].attributes);
    t.notOk(decodedContent.gltf.meshes[0].primitives[0].attributes.NORMAL);

    t.end();
  }
});

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

function _transformPositionsWithMatrix(positions, matrix) {
  const transformationMatrix = new Matrix4(matrix);
  const result = new Float64Array(positions.length);
  for (let index = 0; index < positions.length; index += 3) {
    const vertex = positions.subarray(index, index + 3);
    let vertexVector = new Vector3(Array.from(vertex));
    vertexVector = vertexVector.transform(transformationMatrix);
    vertexVector = vertexVector.transform(Y_UP_TO_Z_UP_MATRIX);
    result.set(vertexVector, index);
  }
  return result;
}

function _areArraysEqualWithDelta(array1, array2, delta) {
  let result = true;
  for (let index = 0; index < array1.length; index++) {
    if (Math.abs(array1[index] - array2[index]) > delta) {
      result = false;
      break;
    }
  }
  return result;
}
