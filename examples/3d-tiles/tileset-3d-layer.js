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

export default class Tileset3DLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layerMap: {},
      layers: [],
      lastUpdateStateTick: -1
    };
  }

  async _loadTileset(tilesetUrl, options) {
    let tileset3d = null;
    if (tilesetUrl) {
      const tilesetJson = await load(tilesetUrl);
      tileset3d = new Tileset3D(tilesetJson, tilesetUrl, options);

      // TODO: Remove this after sse traversal is working since this is just to prevent full load of tileset
      tileset3d.depthLimit = this.props.depthLimit;
    }
    this.setState({tileset3d});
  }

  // context.animationProps.tick should have something like frameState.frameNumber
  // animationProps.aspect, width, and height holds screen info
  // context.viewport.cameraPosition, cameraDirection, cameraUp
  updateState({props, oldProps, context, changeFlags}) {
    if (props.tilesetUrl !== oldProps.tilesetUrl) {
      this.setState({
        layerMap: {},
        layers: []
      });
      const options = {
        onTileLoad: this.props.onTileLoaded,
      };
      this._loadTileset(props.tilesetUrl, options);
    }

    const {tileset3d} = this.state;
    const {animationProps, viewport} = context;
    if (!context.animationProps || !context.viewport || !tileset3d) {
      return;
    }

    // Traverse and and request. Update _selectedTiles so that we know what to render.
    const {height, tick} = animationProps;
    const {cameraPosition, cameraDirection, cameraUp, zoom} = viewport;

    // Map zoom 0-1
    // const min = 12; const max = 24; const zoomMagic = 1000;// tilesetpoints
    const min = 15; const max = 20; const zoomMagic = 10000;// royalexhibition 15, 19, 1000 got intermediate to load around zoom18

    let zoomMap = Math.max(Math.min(zoom, max), min);
    zoomMap = (zoomMap - min) / (max - min);
    zoomMap = Math.max(Math.min(1.0 - zoomMap, 1), 0);

    // setup frameState so that tileset-3d-traverser can do it's job
    const frameState = {
      camera: {
        position: cameraPosition,
        direction: cameraDirection,
        up: cameraUp,
      },
      height: height,
      frameNumber: tick,
      distanceMagic: zoomMap * zoomMagic, // zoom doesn't seem to update accurately? like it stays at the same number after a scroll wheel tick
      sseDenominator: 1.15, // Assumes fovy = 60 degrees
      /*******************************************
        From cesium:
        frustum.fov = CesiumMath.toRadians(60.0);
        frustum._fovy = (frustum.aspectRatio <= 1) ? frustum.fov : Math.atan(Math.tan(frustum.fov * 0.5) / frustum.aspectRatio) * 2.0;
        frustum._sseDenominator = 2.0 * Math.tan(0.5 * frustum._fovy);
       *******************************************/
    };

    tileset3d.update(frameState, DracoWorkerLoader);

    // Add layer for any renderable tile
    const selectedTiles = tileset3d._selectedTiles;
    for (const tile of selectedTiles) {
      this._updateLayer(tile, frameState);
    }

    this._selectLayers(frameState);
    console.log(zoom + ' ' + this.state.layers.length);
  }

  // Grab only those layers who were seleted this frame
  _selectLayers(frameState) {
    const {layerMap} = this.state;
    const {frameNumber} = frameState;
    const selectedLayers = [];
    const layerMapValues = Object.values(layerMap);
    for (const value of layerMapValues) {
      if (value.selectedFrame === frameNumber) {
        selectedLayers.push(value.layer);
      }
    }
    this.setState({
      layers: selectedLayers,
      lastUpdateStateTick: frameNumber
    });
  }

  // Layer is created and added to the map if it doesn't exist in map
  // If it exists, update its selected frame.
  _updateLayer(tileHeader, frameState) {
    // Check if already in map
    let {layerMap} = this.state;
    const {lastUpdateStateTick} = this.state;
    const {frameNumber} = frameState;
    if (tileHeader.contentUri in layerMap) {
        const value  = layerMap[tileHeader.contentUri];
        if (tileHeader._selectedFrame === frameNumber && value.selectedFrame === lastUpdateStateTick) { // Was rendered last frame and needs to render again
          value.selectedFrame = frameNumber;
          return;
        }
    }

    this._unpackTile(tileHeader);

    const layer = this._render3DTileLayer(tileHeader);

    layerMap = {
      ...layerMap,
      [tileHeader.contentUri]: {
        layer: layer,
        selectedFrame: tileHeader._selectedFrame
      }
    };

    this.setState({
      layerMap
    });
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
      parsedColors = new Uint8Array(pointsCount * 4);
      for (let i = 0; i < pointsCount; i++) {
        const color = parseRGB565(colors[i]);
        parsedColors[i * 4] = color[0];
        parsedColors[i * 4 + 1] = color[1];
        parsedColors[i * 4 + 2] = color[2];
        parsedColors[i * 4 + 3] = 255;
      }
    }

    if (colors && colors.length === pointsCount * 3) {
      parsedColors = new Uint8Array(pointsCount * 4);
      for (let i = 0; i < pointsCount; i++) {
        parsedColors[i * 4] = colors[i * 3];
        parsedColors[i * 4 + 1] = colors[i * 3 + 1];
        parsedColors[i * 4 + 2] = colors[i * 3 + 2];
        parsedColors[i * 4 + 3] = 255;
      }
    }

    if (batchIds && batchTable) {
      parsedColors = new Uint8Array(pointsCount * 4);
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
        const origin = new Matrix4()
          .multiplyRight(transformProps.modelMatrix)
          .transformVector3([0, 0, 0]);
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

Tileset3DLayer.layerName = 'Tileset3DLayer';
Tileset3DLayer.defaultProps = defaultProps;
