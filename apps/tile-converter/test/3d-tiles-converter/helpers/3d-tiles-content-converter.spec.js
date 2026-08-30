import {expect, test} from 'vitest';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {loadI3STile} from '@loaders.gl/i3s/test/test-utils/load-utils';
import {Tiles3DContentConverter} from '../../../src/3d-tiles-converter/helpers/3d-tiles-content-converter';
import {isBrowser, parse, load} from '@loaders.gl/core';
import {I3SAttributeLoader, COORDINATE_SYSTEM} from '@loaders.gl/i3s';
import {Matrix4, Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
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
test('tile-converter(3d-tiles)#content converter - should convert i3s node data to b3dm encoded data', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({i3s: {decodeTextures: false}});
    const i3sContent = tile.content;
    expect(i3sContent).toBeTruthy();
    const attributes = await _loadAttributes(tile, ATTRIBUTES_STORAGE_INFO_STUB);
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert(
      {
        tileContent: tile.content,
        textureFormat: tile.header.textureFormat,
        box: tile.header.boundingVolume.box
      },
      attributes
    );
    const batchId = i3sContent.featureIds;
    expect(encodedContent).toBeTruthy();
    expect(batchId).toBeTruthy();
    expect(batchId.length).toBe(i3sContent.attributes.positions.value.length / 3);
    expect(attributes).toBeTruthy();
    expect(attributes.OBJECTID[0]).toBe(14238);
    expect(attributes.NAME[0]).toBe('Sanfran_island_0197.flt\x00');
  }
});
test('tile-converter(3d-tiles)#content converter - should normalise positions correctly', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({
      i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS, decodeTextures: false}
    });
    const i3sContent = tile.content;
    const originPositions = i3sContent.attributes.positions.value;
    const cartographicOrigin = i3sContent.cartographicOrigin;
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert({
      tileContent: i3sContent,
      textureFormat: tile.header.textureFormat,
      box: tile.header.boundingVolume.box
    });
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    expect(decodedContent).toBeTruthy();
    const positionOffsets = decodedContent.gltf.meshes[0].primitives[0].attributes.POSITION.value;
    const matrix = decodedContent.gltf.nodes[0].matrix;
    const positions = _transformPositionsWithMatrix(positionOffsets, matrix, cartographicOrigin);
    expect(_areArraysEqualWithDelta(originPositions, positions, 0.0001)).toBeTruthy();
  }
});
test('tile-converter(3d-tiles)#content converter - should add KHR_materials_unlit extension', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({
      i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS, decodeTextures: false}
    });
    const i3sContent = tile.content;
    i3sContent.material.pbrMetallicRoughness.metallicFactor = 1.0;
    i3sContent.material.pbrMetallicRoughness.roughnessFactor = 1.0;
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert({
      tileContent: i3sContent,
      textureFormat: tile.header.textureFormat,
      box: tile.header.boundingVolume.box
    });
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    expect(decodedContent).toBeTruthy();
    const material = decodedContent.gltf.meshes[0].primitives[0].material;
    expect(material.unlit).toBeTruthy();
  }
});
test('tile-converter(3d-tiles)#content converter - should NOT add KHR_materials_unlit extension', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({
      i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS, decodeTextures: false}
    });
    const i3sContent = tile.content;
    i3sContent.material.pbrMetallicRoughness.metallicFactor = 2.0;
    i3sContent.material.pbrMetallicRoughness.roughnessFactor = 2.0;
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert({
      tileContent: i3sContent,
      textureFormat: tile.header.textureFormat,
      box: tile.header.boundingVolume.box
    });
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    expect(decodedContent).toBeTruthy();
    const material = decodedContent.gltf.meshes[0].primitives[0].material;
    expect(material.unlit).toBeFalsy();
  }
});
test('tile-converter(3d-tiles)#content converter - should convert material', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({i3s: {decodeTextures: false}});
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert({
      tileContent: tile.content,
      textureFormat: tile.header.textureFormat,
      box: tile.header.boundingVolume.box
    });
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    expect(decodedContent).toBeTruthy();
    expect(decodedContent.gltf.materials[0]).toBeTruthy();
    expect(decodedContent.gltf.materials[0].doubleSided).toBeTruthy();
    expect(decodedContent.gltf.materials[0].emissiveFactor).toEqual([1, 1, 1]);
    expect(decodedContent.gltf.materials[0].pbrMetallicRoughness.baseColorTexture.index).toBe(0);
  }
});
test('tile-converter(3d-tiles)#content converter - should not convert incorrect normals', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({i3s: {decodeTextures: false}});
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert({
      tileContent: tile.content,
      textureFormat: tile.header.textureFormat,
      box: tile.header.boundingVolume.box
    });
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    expect(decodedContent).toBeTruthy();
    expect(decodedContent.gltf.meshes[0].primitives[0].attributes).toBeTruthy();
    expect(decodedContent.gltf.meshes[0].primitives[0].attributes.NORMAL).toBeTruthy();
    // If all normals are 0, converter should not convert such normals
    tile.content.attributes.normals.value.fill(0);
    const encodedContent2 = await contentConverter.convert({
      tileContent: tile.content,
      textureFormat: tile.header.textureFormat,
      box: tile.header.boundingVolume.box
    });
    const decodedContent2 = await load(encodedContent2, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    expect(decodedContent2).toBeTruthy();
    expect(decodedContent2.gltf.meshes[0].primitives[0].attributes).toBeTruthy();
    expect(decodedContent2.gltf.meshes[0].primitives[0].attributes.NORMAL).toBeFalsy();
  }
});
test('tile-converter(3d-tiles)#content converter - should handle geometry without normals', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({i3s: {decodeTextures: false}});
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    delete tile.content.attributes.normals;
    const encodedContent = await contentConverter.convert({
      tileContent: tile.content,
      textureFormat: tile.header.textureFormat,
      box: tile.header.boundingVolume.box
    });
    const decodedContent = await load(encodedContent, Tiles3DLoader, {
      '3d-tiles': {
        isTileset: false
      },
      tile: {type: 'b3dm'}
    });
    expect(decodedContent).toBeTruthy();
    expect(decodedContent.gltf.meshes[0].primitives[0].attributes).toBeTruthy();
    expect(decodedContent.gltf.meshes[0].primitives[0].attributes.NORMAL).toBeFalsy();
  }
});
test('tile-converter(3d-tiles)#content converter - should convert i3s node data to b3dm encoded data with ktx2 textures', async () => {
  if (!isBrowser) {
    const _replaceWithKTX2Texture = true;
    const options = {i3s: {decodeTextures: false, useCompressedTextures: true}};
    const tile = await loadI3STile(options, _replaceWithKTX2Texture);
    const i3sContent = tile.content;
    expect(i3sContent).toBeTruthy();
    expect(
      i3sContent.material.pbrMetallicRoughness.baseColorTexture.texture.source.image
    ).toBeTruthy();
    expect(tile.header.textureFormat).toBe('ktx2');
    const attributes = await _loadAttributes(tile, ATTRIBUTES_STORAGE_INFO_STUB);
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert(
      {
        tileContent: tile.content,
        textureFormat: tile.header.textureFormat,
        box: tile.header.boundingVolume.box
      },
      attributes
    );
    expect(encodedContent).toBeTruthy();
  }
});
test('tile-converter(3d-tiles)#content converter - should generate batchIds during conversion', async () => {
  if (!isBrowser) {
    const tile = await loadI3STile({i3s: {decodeTextures: false}});
    const attributes = await _loadAttributes(tile, ATTRIBUTES_STORAGE_INFO_STUB);
    const contentConverter = new Tiles3DContentConverter({outputVersion: '1.0'});
    const encodedContent = await contentConverter.convert(
      {
        tileContent: tile.content,
        textureFormat: tile.header.textureFormat,
        box: tile.header.boundingVolume.box
      },
      attributes
    );
    const decodedContent = await parse(encodedContent, Tiles3DLoader, {
      '3d-tiles': {isTileset: false}
    });
    expect(decodedContent).toBeTruthy();
    expect(decodedContent.gltf.meshes[0].primitives[0].attributes._BATCHID).toBeTruthy();
    expect(decodedContent.gltf.meshes[0].primitives[0].attributes._BATCHID.value.length).toBe(
      25638
    );
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
function _transformPositionsWithMatrix(positions, matrix, cartographicOrigin) {
  const transformationMatrix = new Matrix4(matrix);
  const result = new Float64Array(positions.length);
  for (let index = 0; index < positions.length; index += 3) {
    const vertex = positions.subarray(index, index + 3);
    let vertexVector = new Vector3(Array.from(vertex));
    vertexVector = vertexVector.transform(transformationMatrix);
    vertexVector = vertexVector.transform(Y_UP_TO_Z_UP_MATRIX);
    Ellipsoid.WGS84.cartesianToCartographic(vertexVector, vertexVector);
    vertexVector = vertexVector.subtract(cartographicOrigin);
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
