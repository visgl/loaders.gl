import {CompositeLayer} from '@deck.gl/core';
import {Matrix4} from 'math.gl';

import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {createGLTFObjects, GLTFScenegraphLoader} from '@luma.gl/addons';

import '@loaders.gl/polyfills';
import {load, registerLoaders} from '@loaders.gl/core';
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

registerLoaders([Tile3DLoader, Tileset3DLoader, GLTFScenegraphLoader]);

addVersionToShader(source) {
  if (isWebGL2(this.context.gl)) {
    return `#version 300 es\n${source}`;
  }

  return source;
}


function getLoadOptions(props = {}) {
  const modules = ['project32', 'picking'];
  const {_lighting, _imageBasedLightingEnvironment} = this.props;

  if (_lighting === 'pbr') {
    modules.push(pbr);
  }

  let env = null;
  if (_imageBasedLightingEnvironment) {
    if (typeof _imageBasedLightingEnvironment === 'function') {
      env = _imageBasedLightingEnvironment({gl: this.context.gl, layer: this});
    } else {
      env = _imageBasedLightingEnvironment;
    }
  }

  return {
    gl: this.context.gl,
    waitForFullLoad: true,
    imageBasedLightingEnvironment: env,
    modelOptions: {
      vs: this.addVersionToShader(vs),
      fs: this.addVersionToShader(fs),
      modules,
      isInstanced: true
    },
    // tangents are not supported
    useTangents: false
  };
}

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
      layers: []
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

    if (tileset3d) {
      this.props.onTilesetLoaded();
    }
  }

  shouldUpdateState({changeFlags}) {
    return changeFlags.somethingChanged;
  }

  updateState({props, oldProps, context, changeFlags}) {
    if (props.tilesetUrl !== oldProps.tilesetUrl) {
      this.setState({
        layerMap: {},
        layers: []
      });
      const options = {
        onTileLoad: this.props.onTileLoaded
      };
      this._loadTileset(props.tilesetUrl, options);
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
      distanceMagic: zoomMap * zoomMagic, // TODO: zoom doesn't seem to update accurately? like it stays at the same number after a scroll wheel tick
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
        if (!layer.visible) {
          layer = layer.clone({visible: true});
          layerMap[tile.contentUri].layer = layer;
        }
        selectedLayers.push(layer);
      } else if (tile.contentUnloaded) {
        // Was cleaned up from tileset cache. We no longer need to track it.
        layerMap.delete(tile.contentUri);
      } else if (layer.visible) {
        // Still in tileset cache, keep the GPU resource bound but don't render it.
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
    if (tileHeader.content.gltf) {
      // const {gl} = this.context.animationProps;
      // const json = postProcessGLTF(tileHeader.content.gltf);
      // const gltfObjects = createGLTFObjects(gl, json);
      // tileHeader.userData = {gltfObjects};
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
          const origin = modelMatrix.transform([0, 0, 0]);
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

    let scenegraphProps = { scenegraph: gltfUrl };

    const { gltfArrayBuffer } = tileHeader.content;


    if (!gltfUrl) {
      scenegraphProps = {
        scenegraph: '3d-tile',
        fetch: (url, { propName, layer }) => {
          if (url === '3d-tile') {
            // return Promise.resolve(gltfArrayBuffer);
            const blob = new Blob([gltfArrayBuffer]);
            const blobUrl = URL.createObjectURL(blob);
            load(blobUrl, GLTFScenegraphLoader, layer.getLoadOptions());
          }
        }
      };
    }

    return new ScenegraphLayer({
      id: `3d-model-tile-layer-${tileHeader.contentUri}`,
      data: [{}, {}],
      coordinateSystem: COORDINATE_SYSTEM.METERS,
      pickable: true,
      ...scenegraphProps,
      sizeScale: 2,
      getPosition: row => [0, 0, 0],
      getOrientation: d => [0, 0, 0],
      getTranslation: [0, 0, 0],
      getScale: [10000, 10000, 1000],
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
