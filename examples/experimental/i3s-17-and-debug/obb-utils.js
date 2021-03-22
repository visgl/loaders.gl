import {CompositeLayer, COORDINATE_SYSTEM, log} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import SphereGeometry from './geometry/sphere-geometry';
import CubeGeometry from './geometry/cube-geometry';
import {OrientedBoundingBox} from '@math.gl/culling';

const BG_OPACITY = 100;
const GEOMETRY_STEP = 50;
const SINGLE_DATA = [0];

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

  _generateMesh(tile) {
    if (tile.header.obb) {
      return new CubeGeometry({
        halfSize: tile.header.obb.halfSize
      });
    }
    if (tile.boundingVolume instanceof OrientedBoundingBox) {
      return new CubeGeometry({
        halfSize: tile.boundingVolume.halfSize
      });
    }

    return new SphereGeometry({
      radius: tile.boundingVolume.radius,
      nlat: GEOMETRY_STEP,
      nlong: GEOMETRY_STEP
    });
  }

  _getObbLayer(tile, oldLayer) {
    const content = tile.content;
    const {coloredBy, colorsMap} = this.props;
    const {cartographicOrigin, material} = content;

    const geometry = (oldLayer && oldLayer.props.mesh) || this._generateMesh(tile);

    return new SimpleMeshLayer({
      id: `obb-debug-${tile.id}`,
      mesh: geometry,
      data: SINGLE_DATA,
      getPosition: [0, 0, 0],
      getColor: [...colorsMap.getTileColor(tile, {coloredBy}), BG_OPACITY],
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
