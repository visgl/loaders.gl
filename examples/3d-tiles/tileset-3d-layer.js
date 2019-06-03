import {CompositeLayer} from '@deck.gl/core';
import {Matrix4} from 'math.gl';

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {createGLTFObjects} from '@luma.gl/addons';

import '@loaders.gl/polyfills';
import {load, registerLoaders} from '@loaders.gl/core';
import {postProcessGLTF} from '@loaders.gl/gltf';
import {DracoWorkerLoader} from '@loaders.gl/draco';
import {Ellipsoid} from '@loaders.gl/math';
import {
  Tileset3D,
  Tile3DLoader,
  Tile3DFeatureTable,
  Tile3DBatchTable,
  parseRGB565,
  Tileset3DLoader
} from '@loaders.gl/3d-tiles';

registerLoaders([Tile3DLoader, Tileset3DLoader]);

const defaultProps = {
  // TODO - the tileset json should be an async prop.
  tilesetUrl: null,
  isWGS84: false,
  depthLimit: Number.MAX_SAFE_INTEGER,
  coordinateSystem: null,
  coordinateOrigin: null,
  onTileLoaded: () => {}
};

export default class Tileset3DLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layerMap: {},
      layers: []
    };
  }

  updateState({props, oldProps, changeFlags}) {
    if (props.tilesetUrl !== oldProps.tilesetUrl) {
      this.setState({
        layerMap: {},
        layers: []
      });
      this._loadTileset(props.tilesetUrl);
    }
  }

  async _loadTileset(tilesetUrl) {
    const {depthLimit} = this.props;
    let tileset3d = null;
    if (tilesetUrl) {
      const tilesetJson = await load(tilesetUrl);
      tileset3d = new Tileset3D(tilesetJson, tilesetUrl);
      tileset3d.traverse(tileHeader => this._loadTile3D(tileHeader), depthLimit);
    }
    this.setState({tileset3d});
  }

  async _loadTile3D(tileHeader) {
    await tileHeader.loadContent(DracoWorkerLoader);
    this._unpackTile(tileHeader);

    const layer = this._render3DTileLayer(tileHeader);

    const layerMap = {
      ...this.state.layerMap,
      [tileHeader.contentUri]: layer
    };

    this.setState({
      layerMap,
      layers: Object.values(layerMap).filter(Boolean)
    });
    // React apps can call forceUpdate to trigger a rerender
    this.props.onTileLoaded(tileHeader);
  }

  _unpackTile(tileHeader) {
    const content = tileHeader.content;
    if (content) {
      switch (content.type) {
        case 'pnts':
          this._unpackPointCloud3DTile(tileHeader);
          break;
        case 'i3dm':
        case 'b3dm':
          this._unpackInstanced3DTile(tileHeader);
          break;
        default:
          // eslint-disable-next-line
          console.warn('Error unpacking 3D tile', content.type, content);
          return;
      }
    }
  }

  _unpackPointCloud3DTile(tileHeader) {
    const content = tileHeader.content;
    const featureTable = new Tile3DFeatureTable(
      content.featureTableJson,
      content.featureTableBinary
    );
    let batchTable = null;
    if (content.batchIds) {
      const {batchTableJson, batchTableBinary} = content;
      batchTable = new Tile3DBatchTable(
        batchTableJson,
        batchTableBinary,
        featureTable.getGlobalProperty('BATCH_LENGTH')
      );
    }

    const {positions} = content;

    tileHeader.userData = {
      pointsCount: content.featureTableJson.POINTS_LENGTH,
      positions,
      featureTable,
      batchTable,
      // TODO figure out what is the correct way to extract transform from tileHeader
      transform: tileHeader._initialTransform
    };
  }

  _unpackInstanced3DTile(tileHeader) {
    const {gl} = this.context.animationProps;

    const json = postProcessGLTF(tileHeader.content.gltf);

    const gltfObjects = createGLTFObjects(gl, json);

    tileHeader.userData = {gltfObjects};
  }

  _render3DTileLayer(tileHeader) {
    if (!tileHeader.content || !tileHeader.userData) {
      return null;
    }

    switch (tileHeader.content.type) {
      case 'pnts':
        return this._renderPointCloud3DTileLayer(tileHeader);
      case 'i3dm':
      case 'b3dm':
        return this._renderInstanced3DTileLayer(tileHeader);
      default:
        return null;
    }
  }

  _renderInstanced3DTileLayer(tileHeader) {
    const {gltfObjects} = tileHeader.userData;

    return new ScenegraphLayer({
      id: `3d-model-tile-layer-${tileHeader.contentUri}`,
      data: [{}, {}],
      coordinateSystem: COORDINATE_SYSTEM.METERS,
      pickable: true,
      scenegraph: gltfObjects.scenes[0],
      sizeScale: 2,
      getPosition: row => [0, 0, 0],
      getOrientation: d => [0, 0, 0],
      getTranslation: [0, 0, 0],
      getScale: [1, 1, 1],
      getColor: [255, 255, 255, 255],
      opacity: 0.8
    });
  }

  /* eslint-disable-next-line complexity */
  _resolveTransformProps(tileHeader) {
    if (!tileHeader || !tileHeader.content) {
      return {};
    }

    const {coordinateSystem, coordinateOrigin, isWGS84} = this.props;
    const {rtcCenter} = tileHeader.content;
    const {transform} = tileHeader.userData;

    const transformProps = {};

    if (coordinateSystem) {
      transformProps.coordinateSystem = coordinateSystem;
    }
    if (coordinateOrigin) {
      transformProps.coordinateOrigin = coordinateOrigin;
    }

    if (isWGS84) {
      transformProps.coordinateSystem = transformProps.coordinateSystem || COORDINATE_SYSTEM.LNGLAT;
      return transformProps;
    }

    if (rtcCenter) {
      transformProps.coordinateSystem =
        transformProps.coordinateSystem || COORDINATE_SYSTEM.METER_OFFSETS;
    }

    let modelMatrix;
    if (transform) {
      modelMatrix = new Matrix4(transform);
    }
    if (rtcCenter) {
      modelMatrix = modelMatrix
        ? modelMatrix.translate(rtcCenter)
        : new Matrix4().translate(rtcCenter);
    }

    if (modelMatrix) {
      transformProps.modelMatrix = modelMatrix;
    }

    return transformProps;
  }

  _getPositionProps(tileHeader) {
    const {isWGS84} = this.props;
    if (isWGS84) {
      return {
        getPosition: (...args) => this._getPosition(tileHeader, ...args)
      };
    }
    return {
      instancePositions: tileHeader.content && tileHeader.content.positions
    };
  }

  _renderPointCloud3DTileLayer(tileHeader) {
    const {color} = this.props;
    const {positions, colors, normals} = tileHeader.content;
    const {pointsCount} = tileHeader.userData;

    const transformProps = this._resolveTransformProps(tileHeader);
    const positionProps = this._getPositionProps(tileHeader);

    return (
      positions &&
      new PointCloudLayer({
        id: `3d-point-cloud-tile-layer-${tileHeader.contentUri}`,
        data: {
          positions,
          colors: {value: colors, size: 4},
          normals: {value: positions, size: 3},
          length: positions.length / 3
        },
        numInstances: pointsCount,
        ...positionProps,
        getColor: colors
          ? (...args) => {
              return this._getColor(tileHeader, ...args);
            }
          : color || [255, 255, 0, 200],
        getNormal: normals ? (...args) => this._getNormal(...args) : [0, 1, 0],
        opacity: 0.8,
        pointSize: 1.5,
        ...transformProps
      })
    );
  }

  _getPosition(tileHeader, object, {index, data, target}) {
    const {transform} = tileHeader.userData;
    const {rtcCenter} = tileHeader.content;
    const {isWGS84} = this.props;
    target[0] = data.positions[index * 3];
    target[1] = data.positions[index * 3 + 1];
    target[2] = data.positions[index * 3 + 2];

    // TODO
    // How to tell if this is WGS84 crs or not?
    // How to transform data point using GPU?
    if (isWGS84) {
      let matrix = new Matrix4();
      if (transform) {
        matrix = matrix.multiplyRight(transform);
      }
      if (rtcCenter) {
        matrix = matrix.translate(rtcCenter);
      }
      target = matrix.transformVector3(target);
      Ellipsoid.WGS84.cartesianToCartographic(target, target);
    }

    return target;
  }

  _getNormal(object, {index, data, target}) {
    target[0] = data.normals.value[index * 3];
    target[1] = data.normals.value[index * 3 + 1];
    target[2] = data.normals.value[index * 3 + 2];
  }

  /* eslint-disable max-statements */
  _getColor(tileHeader, object, {index, data, target}) {
    const {colors, isRGB565, constantRGBA} = tileHeader.content;
    const {batchIds, batchTable} = tileHeader.userData;

    if (colors) {
      if (isRGB565) {
        const color = parseRGB565(data.colors.value[index]);
        target[0] = color[0];
        target[1] = color[1];
        target[2] = color[2];
        target[3] = 255;
      } else {
        target[0] = data.colors.value[index * 3];
        target[1] = data.colors.value[index * 3 + 1];
        target[2] = data.colors.value[index * 3 + 2];
        target[3] = data.colors.size === 4 ? data.colors[index * 3 + 4] : 255;
      }

      return target;
    }

    if (constantRGBA) {
      return constantRGBA;
    }

    if (batchIds && batchTable) {
      const batchId = batchIds[index];
      // TODO figure out what is `dimensions` used for
      const dimensions = batchTable.getProperty(batchId, 'dimensions');
      const color = dimensions.map(d => d * 255);
      return [...color, 255];
    }

    return [255, 255, 255];
  }

  renderLayers() {
    const {layers} = this.state;
    return layers;
  }
}

Tileset3DLayer.layerName = 'Tileset3DLayer';
Tileset3DLayer.defaultProps = defaultProps;
