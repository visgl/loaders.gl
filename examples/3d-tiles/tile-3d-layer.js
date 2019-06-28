import {CompositeLayer} from '@deck.gl/core';
import {Matrix4, Vector3} from 'math.gl';

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {GLTFLoader} from '@loaders.gl/gltf';

import '@loaders.gl/polyfills';
import {load, parse, registerLoaders} from '@loaders.gl/core';
// import {postProcessGLTF} from '@loaders.gl/gltf';
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

registerLoaders([Tile3DLoader, Tileset3DLoader, GLTFLoader]);

const DEFAULT_POINT_COLOR = [255, 0, 0, 255];

const defaultProps = {
  // TODO - the tileset json should be an async prop.
  tilesetUrl: null,
  isWGS84: false,
  color: DEFAULT_POINT_COLOR,
  depthLimit: Number.MAX_SAFE_INTEGER,
  coordinateSystem: null,
  coordinateOrigin: null,
  onTileLoaded: () => {},
  onTilesetLoaded: () => {}
};

export default class Tile3DLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layerMap: {},
      layers: [],
      tileset3d: null
    };
  }

  async _loadTileset(tilesetUrl, options) {
    let tileset3d = null;
    if (tilesetUrl) {
      const tilesetJson = await load(tilesetUrl);
      tileset3d = new Tileset3D(tilesetJson, tilesetUrl, options);

      // TODO: Remove these after sse traversal is working since this is just to prevent full load of tileset and loading of root
      // The alwaysLoadRoot is better solved by moving the camera to the newly selected asset.
      tileset3d.depthLimit = this.props.depthLimit;
      tileset3d.alwaysLoadRoot = true;
    }

    this.setState({
      tileset3d,
      layerMap: {},
      layers: []
    });

    if (tileset3d) {
      this.props.onTilesetLoaded(tileset3d);
    }
  }

  shouldUpdateState({changeFlags}) {
    return changeFlags.somethingChanged;
  }

  updateState({props, oldProps, context, changeFlags}) {
    if (props.tilesetUrl !== oldProps.tilesetUrl) {
      this._loadTileset(props.tilesetUrl, {
        onTileLoad: this.props.onTileLoaded
      });
    }

    const {tileset3d} = this.state;
    const {animationProps, viewport} = context;
    if (!animationProps || !viewport || !tileset3d) {
      return;
    }

    // Traverse and and request. Update _selectedTiles so that we know what to render.
    const {height, tick} = animationProps;
    const {cameraPosition, cameraDirection, cameraUp, zoom} = viewport;

    // Map zoom 0-1
    // const min = 12; const max = 24; const zoomMagic = 1000;// tilesetpoints
    const min = 15;
    const max = 20;
    const zoomMagic = 10000; // royalexhibition
    let zoomMap = Math.max(Math.min(zoom, max), min);
    zoomMap = (zoomMap - min) / (max - min);
    zoomMap = Math.max(Math.min(1.0 - zoomMap, 1), 0);

    // Setup frameState so that tileset-3d-traverser can do it's job
    // TODO: make a file for this and document what needs to be attached to this so that traversal can function
    const frameState = {
      camera: {
        position: cameraPosition,
        direction: cameraDirection,
        up: cameraUp
      },
      height,
      frameNumber: tick,
      distanceMagic: zoomMap * zoomMagic,
      sseDenominator: 1.15 // Assumes fovy = 60 degrees
    };

    tileset3d.update(frameState, DracoWorkerLoader);
    this._updateLayers(frameState);
    this._selectLayers(frameState);
  }

  // Grab only those layers who were selected this frame.
  _selectLayers(frameState) {
    const {layerMap} = this.state;
    const {frameNumber} = frameState;
    const selectedLayers = [];
    const layerMapValues = Object.values(layerMap);

    for (const value of layerMapValues) {
      const {tile} = value;
      let {layer} = value;

      if (tile.selectedFrame === frameNumber) {
        if (!layer.props.visible) {
          // Still has GPU resource but visibilty is turned off so turn it back on so we can render it.
          layer = layer.clone({visible: true});
          layerMap[tile.contentUri].layer = layer;
        }
        selectedLayers.push(layer);
      } else if (tile.contentUnloaded) {
        // Was cleaned up from tileset cache. We no longer need to track it.
        layerMap.delete(tile.contentUri);
      } else if (layer.props.visible) {
        // Still in tileset cache but doesn't need to render this frame. Keep the GPU resource bound but don't render it.
        layer = layer.clone({visible: false});
        layerMap[tile.contentUri].layer = layer;
      }
    }

    this.setState({
      layers: selectedLayers
    });
  }

  // Layer is created and added to the map if it doesn't exist yet.
  _updateLayers(frameState) {
    const {tileset3d, layerMap} = this.state;
    const {selectedTiles} = tileset3d;

    const tilesWithoutLayer = selectedTiles.filter(tile => !(tile.contentUri in layerMap));

    for (const tile of tilesWithoutLayer) {
      this._unpackTile(tile);

      const layer = this._render3DTileLayer(tile);

      layerMap[tile.contentUri] = {
        layer,
        tile
      };
    }
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
          throw new Error(`Tile3DLayer: Error unpacking 3D tile ${content.type}`);
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
    if (tileHeader.content.gltfArrayBuffer) {
      tileHeader.userData = {gltfUrl: parse(tileHeader.content.gltfArrayBuffer)};
    }

    if (tileHeader.content.gltfUrl) {
      const gltfUrl = tileHeader.tileset.getTileUrl(tileHeader.content.gltfUrl);
      tileHeader.userData = {gltfUrl};
    }
  }

  _unpackBatched3DTile(tileHeader) {
    // const {gl} = this.context.animationProps;
    // const json = postProcessGLTF(tileHeader.content.gltf);
    // const gltfObjects = createGLTFObjects(gl, json);
    // tileHeader.userData = {gltfObjects};
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
      modelMatrix = modelMatrix || new Matrix4();
      modelMatrix.translate(rtcCenter);
      transformProps.coordinateSystem =
        transformProps.coordinateSystem || COORDINATE_SYSTEM.METER_OFFSETS;
    }

    if (isWGS84) {
      transformProps.coordinateSystem = coordinateSystem || COORDINATE_SYSTEM.METER_OFFSETS;
      transformProps.coordinateOrigin = coordinateOrigin;
      // TODO - Heuristics to get a coordinateOrigin from the tile
      // verify with spec
      if (!coordinateOrigin) {
        if (modelMatrix) {
          const origin = new Vector3();
          modelMatrix.transform(origin, origin);
          transformProps.coordinateOrigin = Ellipsoid.WGS84.cartesianToCartographic(origin, origin);
          modelMatrix = null;
        } else {
          // No model matrix, so assume bounding volume center
          transformProps.coordinateOrigin = tileHeader.boundingVolume.center;
        }
      }
    }

    if (modelMatrix) {
      transformProps.modelMatrix = modelMatrix;
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

    let layer;
    switch (tileHeader.content.type) {
      case 'pnts':
        layer = this._renderPointCloud3DTileLayer(tileHeader);
        break;
      case 'i3dm':
      case 'b3dm':
        layer = this._renderInstanced3DTileLayer(tileHeader);
        break;
      default:
    }
    if (!layer) {
      throw new Error(`Tile3DLayer: Failed to render layer of type ${tileHeader.content.type}`);
    }
    return layer;
  }

  _renderInstanced3DTileLayer(tileHeader) {
    const {gltfUrl} = tileHeader.userData;

    const transformProps = this._resolveTransformProps(tileHeader);

    return new ScenegraphLayer({
      id: `3d-model-tile-layer-${tileHeader.contentUri}`,
      data: [{}, {}],
      coordinateSystem: COORDINATE_SYSTEM.METERS,
      pickable: true,
      scenegraph: gltfUrl,
      sizeScale: 1,
      // getPosition: row => [0, 0, 0],
      // getOrientation: d => [0, 45, 0],
      // getTranslation: [0, 0, 0],
      // getScale: [1, 1, 1],
      // white is a bit hard to see
      getColor: [0, 0, 100, 100],
      opacity: 0.6,
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
    const layers = Object.values(this.state.layerMap).map(layer => layer.layer);
    // const {layers} = this.state;
    return layers;
  }
}

Tile3DLayer.layerName = 'Tile3DLayer';
Tile3DLayer.defaultProps = defaultProps;
