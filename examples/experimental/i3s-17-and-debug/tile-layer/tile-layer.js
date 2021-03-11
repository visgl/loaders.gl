import GL from '@luma.gl/constants';
import {Geometry} from '@luma.gl/core';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {log} from '@deck.gl/core';
import MeshLayer from '../mesh-layer/mesh-layer';

const SINGLE_DATA = [0];

export const COLORED_BY = {
  ORIGINAL: 0,
  TILE: 1,
  DEPTH: 2,
  CUSTOM: 3
};

export const DEPTH_COLOR_MAP = {
  1: [197, 78, 90],
  2: [197, 108, 78],
  3: [198, 139, 77],
  4: [199, 170, 75],
  5: [188, 195, 69],
  6: [131, 202, 74],
  7: [85, 194, 69],
  8: [73, 188, 115],
  9: [70, 174, 172],
  10: [68, 118, 182],
  11: [97, 74, 183],
  12: [125, 58, 174]
};

export const DEPTH_MAX_LEVEL = 12;

// Use our custom MeshLayer
export default class TileLayer extends Tile3DLayer {
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

  _fetchColorByDepth(level) {
    return DEPTH_COLOR_MAP[level] || DEPTH_COLOR_MAP[DEPTH_MAX_LEVEL];
  }

  _fetchCustomColor(id) {
    // TODO: implement after tile-selecting feature
    return [255, 255, 255];
  }

  _fetchColorByTile(id) {
    const {colorsMap} = this.state;
    const randomColor = Array.from({length: 3}, _ => Math.round(Math.random() * 255));

    colorsMap[id] = colorsMap[id] || randomColor;
    return colorsMap[id];
  }

  _fetchColor(coloredBy, tile) {
    switch (coloredBy) {
      case COLORED_BY.TILE:
        return this._fetchColorByTile(tile.id);
      case COLORED_BY.DEPTH:
        return this._fetchColorByDepth(tile.depth);
      case COLORED_BY.CUSTOM:
        return this._fetchCustomColor(tile.id);
      default:
        throw new Error("TileColoredLayer: coloredBy property can't be ".concat(coloredBy));
    }
  }

  _makeSimpleMeshLayer(tileHeader, oldLayer) {
    const content = tileHeader.content;
    const {attributes, modelMatrix, cartographicOrigin, texture, material} = content;
    const {pickable, autoHighlight, coloredBy} = this.props;
    const getColor = coloredBy ? this._fetchColor(coloredBy, tileHeader) : [255, 255, 255];

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
        getColor,
        texture,
        material,
        modelMatrix,
        coordinateOrigin: cartographicOrigin,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        pickable,
        autoHighlight,
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
  if (contentAttributes.colors) {
    attributes.colors = contentAttributes.colors;
  }
  if (contentAttributes.featureIds) {
    attributes.featureIds = contentAttributes.featureIds;
  }
  return attributes;
}
