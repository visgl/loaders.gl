import {I3SAttributeLoader} from '@loaders.gl/i3s';
import {load} from '@loaders.gl/core';
import GL from '@luma.gl/constants';
import {Geometry} from '@luma.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import MeshLayer from '../mesh-layer/mesh-layer';

const SINGLE_DATA = [0];
// Use our custom MeshLayer
export default class TileLayer extends Tile3DLayer {
  // TODO - static since layer is not avalable in TileLayer.onTileLoad
  static loadFeatureAttributesForNode(tile, tileset) {
    return loadFeatureAttributesForNode(tile, tileset);
  }
  static getFeatureAttributes(tile, featureIndex) {
    return getFeatureAttributes(tile, featureIndex);
  }

  _makeSimpleMeshLayer(tileHeader, oldLayer) {
    const content = tileHeader.content;
    const {attributes, modelMatrix, cartographicOrigin, texture} = content;

    const geometry =
      (oldLayer && oldLayer.props.mesh) ||
      new Geometry({
        drawMode: GL.TRIANGLES,
        attributes: getMeshGeometry(attributes)
      });

    return new MeshLayer(
      this.getSubLayerProps({
        id: 'mesh'
      }),
      {
        id: `${this.id}-mesh-${tileHeader.id}`,
        mesh: geometry,
        data: SINGLE_DATA,
        getPosition: [0, 0, 0],
        getColor: [255, 255, 255],
        texture,
        modelMatrix,
        coordinateOrigin: cartographicOrigin,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 255, 150]
      }
    );
  }
}

function getMeshGeometry(contentAttributes) {
  const attributes = {};
  attributes.positions = {
    ...contentAttributes.positions,
    value: new Float32Array(contentAttributes.positions.value)
  };
  if (contentAttributes.normals) {
    attributes.normals = contentAttributes.normals;
  }
  if (contentAttributes.texCoords) {
    attributes.texCoords = contentAttributes.texCoords;
  }
  if (contentAttributes.featureIds) {
    attributes.featureIds = contentAttributes.featureIds;
  }
  return attributes;
}

export async function loadFeatureAttributesForNode(tile) {
  if (tile.featureAttributes || !tile.tileset) {
    return;
  }

  const attributeStorageInfo = tile.tileset.tileset.attributeStorageInfo;
  const attributeUrls = tile.header.attributeUrls;

  tile.userData.layerFeaturesAttributes = await getAllFeatureAttributesOfLayer(
    attributeStorageInfo,
    attributeUrls
  );
}

export function getFeatureAttributes(tile, featureIndex) {
  // Check if loaded
  if (featureIndex < 0) {
    return;
  }
  if (!tile || !tile.header) {
    return;
  }
  if (!tile.userData.layerFeaturesAttributes) {
    return;
  }

  const {attributeStorageInfo} = tile.tileset.tileset;
  const {layerFeaturesAttributes} = tile.userData;

  const featureAttributes = {};

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const attributeName = attributeStorageInfo[index].name;
    const attributeValue = layerFeaturesAttributes[index][attributeName][featureIndex];
    featureAttributes[attributeName] = attributeValue;
  }

  return featureAttributes;
}

const loadMap = {};

async function loadAttribute(url, attributeName, attributeType) {
  const key = `${url}-${attributeName}=${attributeType}`;
  if (!loadMap[key]) {
    loadMap[key] = await load(url, I3SAttributeLoader, {attributeName, attributeType});
  }
  return loadMap[key];
}

async function getAllFeatureAttributesOfLayer(attributeStorageInfo, attributeUrls) {
  const attributes = [];

  for (let index = 0; index < attributeStorageInfo.length; index++) {
    const url = attributeUrls[index];
    const attributeName = attributeStorageInfo[index].name;
    const attributeType = getAttributeValueType(attributeStorageInfo[index]);
    const attribute = await loadAttribute(url, attributeName, attributeType);
    attributes.push(attribute);
  }
  return attributes;
}


function getAttributeValueType(attribute) {
  if (attribute.hasOwnProperty('objectIds')) {
    return 'Oid32';
  } else if (attribute.hasOwnProperty('attributeValues')) {
    return attribute.attributeValues.valueType;
  }
  return null;
}
