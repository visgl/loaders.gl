import {CompositeLayer} from '@deck.gl/core';
import {Matrix4} from 'math.gl';

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {createGLTFObjects, GLTFScenegraphLoader} from '@luma.gl/addons';

import '@loaders.gl/polyfills';
import {load, registerLoaders} from '@loaders.gl/core';
import {postProcessGLTF} from '@loaders.gl/gltf';
import {DracoWorkerLoader} from '@loaders.gl/draco';
import {Ellipsoid} from '@math.gl/geospatial';

import {
  Tileset3D,
  Tile3DLoader,
  Tile3DFeatureTable,
  Tile3DBatchTable,
  parseRGB565,
  Tileset3DLoader
} from '@loaders.gl/3d-tiles';

registerLoaders([Tile3DLoader, Tileset3DLoader, GLTFScenegraphLoader]);

const DEFAULT_POINT_COLOR = [255, 0, 0, 255];

const defaultProps = {
  // TODO - the tileset json should be an async prop.
  tilesetUrl: null,
  isWGS84: false,
  color: DEFAULT_POINT_COLOR,
  depthLimit: Number.MAX_SAFE_INTEGER,
  coordinateSystem: null,
  coordinateOrigin: null,
  onTileLoaded: () => {}
};

export default class Tile3DLayer extends CompositeLayer {
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
          this._unpackInstanced3DTile(tileHeader);
          break;
        case 'b3dm':
          this._unpackBatched3DTile(tileHeader);
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

    this._loadColors(tileHeader);
  }

  /* eslint-disable max-statements, complexity */
  _loadColors(tileHeader) {
    const {batchIds, colors, isRGB565, constantRGBA} = tileHeader.content;

    if (constantRGBA) {
      tileHeader.userData.color = constantRGBA;
    }

    const {batchTable, pointsCount} = tileHeader.userData;
    let parsedColors = colors;

    if (isRGB565) {
      parsedColors = new Uint8ClampedArray(pointsCount * 4);
      for (let i = 0; i < pointsCount; i++) {
        const color = parseRGB565(colors[i]);
        parsedColors[i * 4] = color[0];
        parsedColors[i * 4 + 1] = color[1];
        parsedColors[i * 4 + 2] = color[2];
        parsedColors[i * 4 + 3] = 255;
      }
    }

    if (colors && colors.length === pointsCount * 3) {
      parsedColors = new Uint8ClampedArray(pointsCount * 4);
      for (let i = 0; i < pointsCount; i++) {
        parsedColors[i * 4] = colors[i * 3];
        parsedColors[i * 4 + 1] = colors[i * 3 + 1];
        parsedColors[i * 4 + 2] = colors[i * 3 + 2];
        parsedColors[i * 4 + 3] = 255;
      }
    }

    if (batchIds && batchTable) {
      parsedColors = new Uint8ClampedArray(pointsCount * 4);
      for (let i = 0; i < pointsCount; i++) {
        const batchId = batchIds[i];
        // TODO figure out what is `dimensions` used for
        const dimensions = batchTable.getProperty(batchId, 'dimensions');
        const color = dimensions.map(d => d * 255);
        parsedColors[i * 4] = color[0];
        parsedColors[i * 4 + 1] = color[1];
        parsedColors[i * 4 + 2] = color[2];
        parsedColors[i * 4 + 3] = 255;
      }
    }

    tileHeader.userData.colors = parsedColors;
  }

  _unpackInstanced3DTile(tileHeader) {
    const {gl} = this.context.animationProps;

    if (tileHeader.content.gltf) {
      const json = postProcessGLTF(tileHeader.content.gltf);
      const gltfObjects = createGLTFObjects(gl, json);
      tileHeader.userData = {gltfObjects};
    }

    if (tileHeader.content.gltfUrl) {
      const gltfUrl = tileHeader.tileset.getTileUrl(tileHeader.content.gltfUrl);
      tileHeader.userData = {gltfUrl};
    }
  }

  _unpackBatched3DTile(tileHeader) {
    const {gl} = this.context.animationProps;
    const json = postProcessGLTF(tileHeader.content.gltf);
    const gltfObjects = createGLTFObjects(gl, json);
    tileHeader.userData = {gltfObjects};
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

    if (isWGS84) {
      transformProps.coordinateSystem = coordinateSystem || COORDINATE_SYSTEM.METER_OFFSETS;
      transformProps.coordinateOrigin = coordinateOrigin;
      if (!coordinateOrigin) {
        const origin = new Matrix4().multiplyRight(transformProps.modelMatrix).transform([0, 0, 0]);
        transformProps.coordinateOrigin = Ellipsoid.WGS84.cartesianToCartographic(origin, origin);
        delete transformProps.modelMatrix;
      }
    }

    if (rtcCenter) {
      transformProps.coordinateSystem =
        transformProps.coordinateSystem || COORDINATE_SYSTEM.METER_OFFSETS;
    }

    return transformProps;
  }

  _getColorProps(tileHeader) {
    const {colors, color} = tileHeader.userData;
    if (colors) {
      return {
        instanceColors: colors
      };
    }
    return {
      getColor: () => color || this.props.color || DEFAULT_POINT_COLOR
    };
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
    const {gltfObjects, gltfUrl} = tileHeader.userData;

    const transformProps = this._resolveTransformProps(tileHeader);

    return new ScenegraphLayer({
      id: `3d-model-tile-layer-${tileHeader.contentUri}`,
      data: [{}, {}],
      coordinateSystem: COORDINATE_SYSTEM.METERS,
      pickable: true,
      scenegraph: gltfUrl ? gltfUrl : gltfObjects.scenes[0],
      sizeScale: 2,
      getPosition: row => [0, 0, 0],
      getOrientation: d => [0, 0, 0],
      getTranslation: [0, 0, 0],
      getScale: [1, 1, 1],
      getColor: [255, 255, 255, 255],
      opacity: 0.8,
      ...transformProps
    });
  }

  _renderPointCloud3DTileLayer(tileHeader) {
    const {positions, normals} = tileHeader.content;
    const {pointsCount} = tileHeader.userData;

    const transformProps = this._resolveTransformProps(tileHeader);
    const colorProps = this._getColorProps(tileHeader);

    return (
      positions &&
      new PointCloudLayer({
        id: `3d-point-cloud-tile-layer-${tileHeader.contentUri}`,
        data: {
          length: positions.length / 3
        },
        numInstances: pointsCount,
        instancePositions: positions,
        ...colorProps,
        instanceNormals: normals,
        opacity: 0.8,
        pointSize: 1.5,
        ...transformProps
      })
    );
  }

  renderLayers() {
    const {layers} = this.state;
    return layers;
  }
}

Tile3DLayer.layerName = 'Tile3DLayer';
Tile3DLayer.defaultProps = defaultProps;
