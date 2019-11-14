/* global fetch */
import {Vector3} from 'math.gl';

import {COORDINATE_SYSTEM, CompositeLayer} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import {I3STileset} from '@loaders.gl/i3s';
import {Geometry} from '@luma.gl/core';
import GL from '@luma.gl/constants';

const scratchOffset = new Vector3(0, 0, 0);
const MAX_LAYERS = 30;

const defaultProps = {
  data: null,
  loadOptions: {throttleRequests: true},
  onTilesetLoad: tileset3d => {},
  onTileLoad: tileHeader => {},
  onTileUnload: tileHeader => {}
};

export default class Tile3DLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layerMap: {},
      tileset3d: null
    };
  }

  shouldUpdateState({changeFlags}) {
    return changeFlags.somethingChanged;
  }

  async updateState({props, oldProps}) {
    if (props.data && props.data !== oldProps.data) {
      await this._loadTileset(props.data);
    }

    const {tileset3d} = this.state;
    await this._updateTileset(tileset3d);
  }

  async _loadTileset(tilesetUrl, fetchOptions) {
    const response = await fetch(tilesetUrl, fetchOptions);
    const tilesetJson = await response.json();

    const tileset3d = new I3STileset(tilesetJson, tilesetUrl, {
      onTileLoad: tile => this.props.onTileLoad(tile),
      onTileUnload: tile => this.props.onTileUnload(tile)
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    if (tileset3d) {
      this.props.onTilesetLoad(tileset3d);
    }
  }

  async _updateTileset(tileset3d) {
    const {timeline, viewport} = this.context;
    if (!timeline || !viewport || !tileset3d) {
      return;
    }

    // TODO use a valid frameState
    const frameState = {viewport};
    await tileset3d.update(frameState);
    this._updateLayerMap();
  }

  _updateLayerMap() {
    const {tileset3d, layerMap} = this.state;

    // create layers for new tiles
    const {selectedTiles} = tileset3d;
    if (selectedTiles) {
      const tilesWithoutLayer = Object.values(selectedTiles).filter(
        tile => !layerMap[tile.id] && tile.attributes
      );

      for (const tile of tilesWithoutLayer) {
        layerMap[tile.id] = {
          layer: this._create3DTileLayer(tile),
          tile
        };
      }
    }

    // only maintain certain layers for performance
    this._deleteLayers();

    // update layer visibility
    this._updateLayers();
  }

  _deleteLayers() {
    const {layerMap} = this.state;
    const layerValues = Object.values(layerMap);
    if (layerValues.length >= MAX_LAYERS) {
      const orders = layerValues.sort((l1, l2) => {
        return l1.tile._priority - l2.tile._priority;
      });
      delete layerMap[orders[0].id];
    }
  }

  // Grab only those layers who were selected this frame.
  _updateLayers() {
    const {layerMap, tileset3d} = this.state;
    const selectedTiles = tileset3d && tileset3d.selectedTiles;
    const layers = [];

    const tileIds = Object.keys(layerMap);
    for (let i = 0; i < tileIds.length; i++) {
      const tileId = tileIds[i];
      let layer = layerMap[tileId].layer;
      if (!selectedTiles[tileId] && layer.props && layer.props.visible) {
        // Still has GPU resource but visibility is turned off so turn it back on so we can render it.
        layer = layer.clone({visible: false});
        layerMap[tileId].layer = layer;
      } else if (selectedTiles[tileId] && layer.props) {
        // Still has GPU resource but visibility is turned off so turn it back on so we can render it.
        if (!layer.props.visible) {
          layer = layer.clone({visible: true});
        }
        layerMap[tileId].layer = layer;
        layers.push(layer);
      }
    }

    this.setState({layers});
  }

  _create3DTileLayer(tile) {
    const {attributes, matrix, cartographicOrigin, texture} = tile;
    const positions = new Float32Array(attributes.position.value.length);
    for (let i = 0; i < positions.length; i += 3) {
      scratchOffset.copy(matrix.transform(attributes.position.value.subarray(i, i + 3)));
      positions.set(scratchOffset, i);
    }

    const geometry = new Geometry({
      drawMode: GL.TRIANGLES,
      attributes: {
        positions,
        normals: attributes.normal,
        texCoords: attributes.uv0
      }
    });

    return new SimpleMeshLayer({
      id: `mesh-layer-${tile.id}`,
      mesh: geometry,
      data: [{}],
      getPosition: [0, 0, 0],
      getColor: [255, 255, 255],
      texture,
      coordinateOrigin: cartographicOrigin,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
    });
  }

  renderLayers() {
    return this.state.layers;
  }
}

Tile3DLayer.layerName = 'Tile3DLayer';
Tile3DLayer.defaultProps = defaultProps;
