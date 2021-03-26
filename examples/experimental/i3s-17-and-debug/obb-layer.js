import {CompositeLayer, COORDINATE_SYSTEM, log} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {OrientedBoundingBox} from '@math.gl/culling';
import {CubeGeometry, SphereGeometry} from '@luma.gl/engine';
import {COLORED_BY} from './color-map';

const BG_OPACITY = 100;
const GEOMETRY_STEP = 50;
const SINGLE_DATA = [0];

const defaultProps = {
  visible: false,
  coloredBy: COLORED_BY.ORIGINAL,
  colorsMap: null
};

// TODO: replace CompositeLayer to SimpleMeshLayer
export default class ObbLayer extends CompositeLayer {
  initializeState() {
    if ('onTileLoadFail' in this.props) {
      log.removed('onTileLoadFail', 'onTileError')();
    }

    this.state = {
      layerMap: {},
      colorsMap: {}
    };
  }

  _generateCubeMesh(tile) {
    const geometry = new CubeGeometry();
    const halfSize = tile.header.obb.halfSize;
    const {attributes} = geometry;

    const POSITION = {
      ...attributes.POSITION,
      value: new Float32Array(attributes.POSITION.value)
    };
    for (let i = 0; i < POSITION.value.length; i += 3) {
      POSITION.value[i] *= halfSize[0] * 2;
      POSITION.value[i + 1] *= halfSize[1] * 2;
      POSITION.value[i + 2] *= halfSize[2] * 2;
    }
    geometry.attributes = {
      ...attributes,
      POSITION
    };
    return geometry;
  }

  _generateSphereMesh(tile) {
    return new SphereGeometry({
      radius: tile.boundingVolume.radius,
      nlat: GEOMETRY_STEP,
      nlong: GEOMETRY_STEP
    });
  }

  _generateMesh(tile) {
    if (tile.header.obb || tile.boundingVolume instanceof OrientedBoundingBox) {
      return this._generateCubeMesh(tile);
    }
    return this._generateSphereMesh(tile);
  }

  _getObbLayer(tile, oldLayer) {
    const content = tile.content;
    const {coloredBy, colorsMap} = this.props;
    const {cartographicOrigin, material} = content;

    const geometry = (oldLayer && oldLayer.props.mesh) || this._generateMesh(tile);

    const color = colorsMap ? colorsMap.getTileColor(tile, {coloredBy}) : [255, 255, 255];

    return new SimpleMeshLayer({
      id: `obb-debug-${tile.id}`,
      mesh: geometry,
      data: SINGLE_DATA,
      getPosition: [0, 0, 0],
      getColor: [...color, BG_OPACITY],
      material,
      coordinateOrigin: cartographicOrigin,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
    });
  }

  updateState({props, oldProps, changeFlags}) {
    if (changeFlags.propsChanged) {
      const {layerMap} = this.state;

      for (const key in layerMap) {
        layerMap[key].needsUpdate = true;
      }
    }
  }

  resetTiles() {
    this.setState({
      layerMap: {},
      colorsMap: {}
    });
  }

  addTile(tile) {
    const {layerMap} = this.state;

    layerMap[tile.id] = layerMap[tile.id] || {tile};
    this.setNeedsUpdate();
  }

  renderLayers() {
    const {visible} = this.props;
    if (!visible) return null;

    const {layerMap} = this.state;

    return Object.values(layerMap)
      .map(layerCache => {
        let {layer} = layerCache;
        const {tile} = layerCache;

        if (tile.selected) {
          if (!layer) {
            layer = this._getObbLayer(tile);
          } else if (layerCache.needsUpdate) {
            layer = this._getObbLayer(tile, layer);
            layerCache.needsUpdate = false;
          } else if (!layer.props.visible) {
            layer = layer.clone({
              visible: true
            });
          }
        } else if (layer && layer.props.visible) {
          layer = layer.clone({
            visible: false
          });
        }

        layerCache.layer = layer;
        return layer;
      })
      .filter(Boolean);
  }
}

ObbLayer.layerName = 'ObbLayer';
ObbLayer.defaultProps = defaultProps;
