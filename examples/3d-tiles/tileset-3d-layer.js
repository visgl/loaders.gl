import {CompositeLayer} from '@deck.gl/core';
import {Vector3, Matrix4} from 'math.gl';

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {createGLTFObjects} from '@luma.gl/addons';

import '@loaders.gl/polyfills';
import {postProcessGLTF} from '@loaders.gl/gltf';
import {registerLoaders} from '@loaders.gl/core';
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
  tilesetJson: null,
  tilesetUrl: null,
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

    if (props.tilesetJson !== oldProps.tilesetJson) {
      const tileset3d = new Tileset3D(props.tilesetJson, props.tilesetUrl);
      this.setState({
        layerMap: {},
        layers: [],
        tileset3d
      });
    }

    // traverse, proceess requested tiles, process selected tiles
    const {tileset3d, zoom} = this.state;
    tileset3d.traverse(tileHeader => this._loadTile3D(tileHeader), tileset3d.root, zoom);
  }

  async _loadTile3D(tileHeader) {
    if (!tileHeader.contentUnloaded) {
      return;
    }

    await tileHeader.loadContent();
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
          console.error('Error unpacking 3D tile', content.type, content);
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
    const {gl} = this._deckRef.deck.animationLoop;

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

  _resolveCoordinateProps(tileHeader) {
    if (!tileHeader || !tileHeader.content) {
      return {};
    }

    const {coordinateSystem, coordinateOrigin} = this.props;
    const {rtcCenter} = tileHeader.content;

    const coordinateProps = {
      coordinateSystem: coordinateSystem || COORDINATE_SYSTEM.LNGLAT,
      coordinateOrigin
    };

    if (rtcCenter) {
      coordinateProps.coordinateSystem = COORDINATE_SYSTEM.METER_OFFSETS;
      coordinateProps.coordinateOrigin = Ellipsoid.WGS84.cartesianToCartographic(
        new Vector3(rtcCenter)
      );
    }

    return coordinateProps;
  }

  _renderPointCloud3DTileLayer(tileHeader) {
    const {positions, colors, normals} = tileHeader.content;
    const {pointsCount, transform} = tileHeader.userData;

    const coordinateProps = this._resolveCoordinateProps(tileHeader);
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
        ...coordinateProps,
        numInstances: pointsCount,
        getPosition: (object, {index, data, target}) => {
          target[0] = data.positions[index * 3];
          target[1] = data.positions[index * 3 + 1];
          target[2] = data.positions[index * 3 + 2];

          if (transform && coordinateProps.coordinateSystem === COORDINATE_SYSTEM.LNGLAT) {
            target = new Matrix4().multiplyRight(transform).transformVector3(target);
            Ellipsoid.WGS84.cartesianToCartographic(target, target);
          }

          return target;
        },
        getColor: (...args) => {
          return this._getColor(tileHeader, ...args);
        },
        getNormal: normals
          ? (object, {index, data, target}) => {
              target[0] = data.normals[index * 3];
              target[1] = data.normals[index * 3 + 1];
              target[2] = data.normals[index * 3 + 2];
              return target;
            }
          : [0, 1, 0],
        opacity: 0.8,
        pointSize: 1.5
      })
    );
  }

  /* eslint-disable max-statements */
  _getColor(tileHeader, object, {index, data, target}) {
    if (!tileHeader) {
      return null;
    }

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
