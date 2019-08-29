/* global fetch */
import '@loaders.gl/polyfills';

import {COORDINATE_SYSTEM, CompositeLayer} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {parse, registerLoaders} from '@loaders.gl/core';
import {
  Tileset3DLoader,
  Tile3DLoader,
  Tileset3D,
  _getIonTilesetMetadata
} from '@loaders.gl/3d-tiles';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader, DracoWorkerLoader} from '@loaders.gl/draco';

import {getFrameState} from './get-frame-state';

// TODO - simply registering the DracoLoader should be enough to make it available to gltf/3d-tiles
registerLoaders([Tile3DLoader, Tileset3DLoader, GLTFLoader]);

const defaultProps = {
  tilesetUrl: null,
  ionAssetId: null,
  ionAccessToken: null,
  color: [155, 155, 155, 200],
  depthLimit: Number.MAX_SAFE_INTEGER,
  onTilesetLoad: () => {},
  onTileLoad: () => {}
};

export default class Tile3DLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layerMap: {},
      layers: [],
      tileset3d: null
    };
  }

  shouldUpdateState({changeFlags}) {
    return changeFlags.somethingChanged;
  }

  async updateState({props, oldProps}) {
    if (props.tilesetUrl && props.tilesetUrl !== oldProps.tilesetUrl) {
      await this._loadTileset(props.tilesetUrl);
    } else if (
      (props.ionAccessToken || props.ionAssetId) &&
      (props.ionAccessToken !== oldProps.ionAccessToken || props.ionAssetId !== oldProps.ionAssetId)
    ) {
      await this._loadTilesetFromIon(props.ionAccessToken, props.ionAssetId);
    }

    const {tileset3d} = this.state;
    this._updateTileset(tileset3d);
  }

  async _loadTileset(tilesetUrl, fetchOptions, ionMetadata) {
    let tileset3d = null;

    if (tilesetUrl) {
      const response = await fetch(tilesetUrl, fetchOptions);
      const tilesetJson = await response.json();

      tileset3d = new Tileset3D(tilesetJson, tilesetUrl, {
        onTileLoad: tileHeader => {
          this.props.onTileLoad(tileHeader);
          this._updateTileset(tileset3d);
        },
        DracoLoader: DracoWorkerLoader, // TODO: should not be needed, see registerLoaders above
        fetchOptions,
        ...ionMetadata
      });
    }

    this.setState({
      tileset3d,
      layerMap: {},
      layers: []
    });

    if (tileset3d) {
      // TODO: Remove these after sse traversal is working since this is just to prevent full load of tileset and loading of root
      tileset3d.depthLimit = this.props.depthLimit;
      this.props.onTilesetLoad(tileset3d);
    }
  }

  async _loadTilesetFromIon(ionAccessToken, ionAssetId) {
    const ionMetadata = await _getIonTilesetMetadata(ionAccessToken, ionAssetId);
    const {url, headers} = ionMetadata;
    return await this._loadTileset(url, {headers}, ionMetadata);
  }

  _updateTileset(tileset3d) {
    const {animationProps, viewport} = this.context;
    if (!animationProps || !viewport || !tileset3d) {
      return;
    }

    const frameState = getFrameState(viewport, animationProps);
    tileset3d.update(frameState, DracoWorkerLoader);

    this._updateLayers();
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
        if (layer && layer.props && !layer.props.visible) {
          // Still has GPU resource but visibility is turned off so turn it back on so we can render it.
          layer = layer.clone({visible: true});
          layerMap[tile.contentUri].layer = layer;
        }
        selectedLayers.push(layer);
      } else if (tile.contentUnloaded) {
        // Was cleaned up from tileset cache. We no longer need to track it.
        delete layerMap[tile.contentUri];
      } else if (layer && layer.props && layer.props.visible) {
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
  _updateLayers() {
    const {tileset3d, layerMap} = this.state;
    const {selectedTiles} = tileset3d;

    const tilesWithoutLayer = selectedTiles.filter(tile => !(tile.contentUri in layerMap));

    for (const tile of tilesWithoutLayer) {
      this._unpackTile(tile);

      const layer = this._create3DTileLayer(tile);

      tileset3d.addTileToCache(tile); // Add and remove on main thread

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
    const {pointCount, positions} = tileHeader.content;

    tileHeader.userData = {
      pointCount,
      positions
    };
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
    if (tileHeader.content.gltfArrayBuffer) {
      tileHeader.userData = {
        gltfUrl: parse(tileHeader.content.gltfArrayBuffer, {DracoLoader, decompress: true})
      };
    }
    if (tileHeader.content.gltfUrl) {
      const gltfUrl = tileHeader.tileset.getTileUrl(tileHeader.content.gltfUrl);
      tileHeader.userData = {gltfUrl};
    }
  }

  _create3DTileLayer(tileHeader) {
    if (!tileHeader.content || !tileHeader.userData) {
      return null;
    }

    let layer;
    switch (tileHeader.content.type) {
      case 'pnts':
        layer = this._createPointCloud3DTileLayer(tileHeader);
        break;
      case 'i3dm':
      case 'b3dm':
        layer = this._createInstanced3DTileLayer(tileHeader);
        break;
      default:
    }
    if (!layer) {
      throw new Error(`Tile3DLayer: Failed to render layer of type ${tileHeader.content.type}`);
    }
    return layer;
  }

  _createInstanced3DTileLayer(tileHeader) {
    const {gltfUrl} = tileHeader.userData;
    const {instances, cartographicOrigin, modelMatrix} = tileHeader.content;

    return new ScenegraphLayer({
      id: `3d-model-tile-layer-${tileHeader.contentUri}`,
      data: instances || [{}],
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      coordinateOrigin: cartographicOrigin,

      pickable: true,
      scenegraph: gltfUrl,
      sizeScale: 1,
      getPosition: row => [0, 0, 0],
      // TODO fix scenegraph modelMatrix
      getTransformMatrix: d =>
        d.modelMatrix ? modelMatrix.clone().multiplyRight(d.modelMatrix) : modelMatrix,
      getColor: d => [255, 255, 255, 100],
      // TODO: Does not seem to take effect, maybe an opacity bug in ScenegraphLayer?
      opacity: 1.0,

      // enable gltf pbr model
      _lighting: 'pbr'
    });
  }

  _createPointCloud3DTileLayer(tileHeader) {
    const {positions, normals, colors} = tileHeader.content.attributes;
    const {pointCount} = tileHeader.content;
    const {colorRGBA} = tileHeader.userData;
    const {cartographicOrigin, modelMatrix} = tileHeader.content;

    return (
      positions &&
      new PointCloudLayer({
        id: `3d-point-cloud-tile-layer-${tileHeader.contentUri}`,
        data: {
          header: {
            vertexCount: pointCount
          },
          attributes: {
            POSITION: positions,
            NORMAL: normals,
            COLOR_0: colors
          }
        },
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        coordinateOrigin: cartographicOrigin,
        modelMatrix,

        getColor: colorRGBA || this.props.color,
        pickable: true,
        numInstances: pointCount,
        opacity: 1.0,
        pointSize: 1
      })
    );
  }

  renderLayers() {
    // TODO - reuse the same layer list
    const layers = Object.values(this.state.layerMap).map(layer => layer.layer);
    // const {layers} = this.state;
    return layers;
  }
}

Tile3DLayer.layerName = 'Tile3DLayer';
Tile3DLayer.defaultProps = defaultProps;
