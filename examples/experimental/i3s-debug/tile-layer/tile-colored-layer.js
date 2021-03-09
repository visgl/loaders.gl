import GL from '@luma.gl/constants';
import {Geometry} from '@luma.gl/core';
import {COORDINATE_SYSTEM, log} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

const SINGLE_DATA = [0];

export const COLORED_BY = {
  TILE: 1,
  CUSTOM: 2
};

// Use our custom MeshLayer
export default class TileColoredLayer extends Tile3DLayer {
  initializeState() {
    if ('onTileLoadFail' in this.props) {
      log.removed('onTileLoadFail', 'onTileError')();
    }

    this.state = {
      layerMap: {},
      colorsMap: {},
      tileset3d: null
    };
  }

  _fetchCustomColor(coloredMap, id) {
    return coloredMap[id] || coloredMap['*'] || [255, 255, 255];
  }

  _fetchColorByTile(id) {
    const {colorsMap} = this.state;

    const randomColor = Array.from({length: 3}, _ => Math.round(Math.random() * 255));
    colorsMap[id] = colorsMap[id] || randomColor;

    return colorsMap[id];
  }

  _fetchColor(coloredBy, coloredMap, id) {
    switch (coloredBy) {
      case COLORED_BY.TILE:
        return this._fetchColorByTile(id);
      case COLORED_BY.CUSTOM:
        return this._fetchCustomColor(coloredMap, id);
      default:
        throw new Error("TileColoredLayer: coloredBy property can't be ".concat(coloredBy));
    }
  }

  _makeSimpleMeshLayer(tileHeader, oldLayer) {
    const content = tileHeader.content;
    const {attributes, modelMatrix, cartographicOrigin, texture, material} = content;
    const {coloredBy, coloredMap} = this.props;

    const geometry =
      (oldLayer && oldLayer.props.mesh) ||
      new Geometry({
        drawMode: GL.TRIANGLES,
        attributes: getMeshGeometry(attributes)
      });

    let visualPart = {texture, material, getColor: [255, 255, 255]};
    if (coloredBy) {
      visualPart = {getColor: this._fetchColor(coloredBy, coloredMap, tileHeader.id)};
    }

    return new SimpleMeshLayer(
      this.getSubLayerProps({
        id: 'mesh'
      }),
      {
        id: `${this.id}-mesh-${tileHeader.id}`,
        mesh: geometry,
        data: SINGLE_DATA,
        getPosition: [0, 0, 0],
        ...visualPart,
        modelMatrix,
        coordinateOrigin: cartographicOrigin,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
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
  if (contentAttributes.colors) {
    attributes.colors = contentAttributes.colors;
  }
  if (contentAttributes.featureIds) {
    attributes.featureIds = contentAttributes.featureIds;
  }
  return attributes;
}
