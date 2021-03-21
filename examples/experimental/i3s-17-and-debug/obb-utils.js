import {Vector3} from '@math.gl/core';
import {OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {PolygonLayer} from '@deck.gl/layers';
import {CompositeLayer, log} from '@deck.gl/core';

const LINE_WIDTH = 3;
const BG_OPACITY = 20;

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

  _getObbBounds(boundingVolume) {
    let center;
    let halfSize;
    let radius;

    if (boundingVolume instanceof OrientedBoundingBox) {
      halfSize = boundingVolume.halfSize;
      radius = new Vector3(halfSize[0], halfSize[1], halfSize[2]).len();
      center = boundingVolume.center;
    } else {
      radius = boundingVolume.radius;
      center = boundingVolume.center;
      halfSize = [radius, radius, radius];
    }

    const rightTop = Ellipsoid.WGS84.cartesianToCartographic(
      new Vector3(center[0] + radius, center[1] + radius, center[2]),
      new Vector3()
    );

    const rightBottom = Ellipsoid.WGS84.cartesianToCartographic(
      new Vector3(center[0] + radius, center[1] - radius, center[2]),
      new Vector3()
    );

    const leftTop = Ellipsoid.WGS84.cartesianToCartographic(
      new Vector3(center[0] - radius, center[1] + radius, center[2]),
      new Vector3()
    );

    const leftBottom = Ellipsoid.WGS84.cartesianToCartographic(
      new Vector3(center[0] - radius, center[1] - radius, center[2]),
      new Vector3()
    );

    const bottomElevation = Ellipsoid.WGS84.cartesianToCartographic(
      new Vector3(center[0], center[1], center[2]),
      new Vector3()
    );

    const topElevation = Ellipsoid.WGS84.cartesianToCartographic(
      new Vector3(center[0], center[1], center[2] + halfSize[2]),
      new Vector3()
    );

    const elevation = topElevation[2] - bottomElevation[2];
    const boundaries = [
      [
        [leftTop[0], leftTop[1]],
        [rightTop[0], rightTop[1]],
        [rightBottom[0], rightBottom[1]],
        [leftBottom[0], leftBottom[1]],
        [leftTop[0], leftTop[1]]
      ]
    ];

    return {boundaries, elevation};
  }

  _getObbColors(tile) {
    const {coloredBy, colorsMap} = this.props;

    const lineColor = colorsMap.getTileColor(tile, {coloredBy});
    const fillColor = [...lineColor, BG_OPACITY];

    return {fillColor, lineColor};
  }

  _getObbLayer(tile) {
    const data = [
      {
        ...this._getObbBounds(tile.boundingVolume),
        ...this._getObbColors(tile)
      }
    ];

    return new PolygonLayer({
      id: `obb-debug-${tile.id}`,
      data,
      extruded: true,
      filled: true,
      getPolygon: d => d.boundaries,
      getLineWidth: LINE_WIDTH,
      lineWidthMinPixels: LINE_WIDTH,
      getFillColor: d => d.fillColor,
      getLineColor: d => d.lineColor,
      getElevation: d => d.elevation,
      pickable: false,
      stroked: true,
      wireframe: true
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
            layer = this._getObbLayer(tile);
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
