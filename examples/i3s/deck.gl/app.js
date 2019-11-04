/* eslint-disable */
/* global URL */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';

import {Vector3} from 'math.gl';
import GL from '@luma.gl/constants';
import {Geometry} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator, COORDINATE_SYSTEM} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {I3SSLPKLoader, I3STileset} from '@loaders.gl/i3s';

import {centerMap, cesiumRender, cesiumUnload} from './cesium';

const TEST_DATA_SLPK =
  'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/i3s/test/data/DA12_subset.slpk';

const TEST_DATA_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0'
;

const scratchOffset = new Vector3(0, 0, 0);

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const TRANSITION_DURAITON = 4000;

const INITIAL_VIEW_STATE = {
  longitude: -122.43751306035713,
  latitude: 37.78249440803938,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      layerMap: {},
      layers: [],
      viewState: INITIAL_VIEW_STATE
    };
  }

  async componentDidMount() {
    const tilesetJson = await fetch(TEST_DATA_URL)
    .then(result => result.json());

    const tileset = new I3STileset(
      tilesetJson,
      TEST_DATA_URL,
      {
        onTileLoad: (tile) => this._onTileLoad(tile),
        onTileUnload: (tile) => this._onTileUnload(tile)
      }
    );

    this.setState({tileset});

    const bbox = tilesetJson.store.extent;
    const longitude = (bbox[0] + bbox[2]) / 2;
    const latitude = (bbox[1] + bbox[3]) / 2;

    const viewState = {
      ...this.state.viewState,
      zoom: 14,
      longitude,
      latitude
    };

    this.setState({
      viewState: {
        ...viewState,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      }
    });

    await tileset.update({viewState});

    // render with cesium
    centerMap(viewState);
  }

  _onTileLoad(tile) {
    const {viewState, layerMap} = this.state;
    cesiumRender(viewState, tile);

    let layer = layerMap[tile.id];
    if (layer) {
      if (layer && layer.props && !layer.props.visible) {
        // Still has GPU resource but visibility is turned off so turn it back on so we can render it.
        layer = layer.clone({visible: true});
        layerMap[tile.id] = layer;

        this.setState({layers: Object.values(layerMap)});
      }
      return;
    }

    const {attributes, matrix, cartographicOrigin, texture, id} = tile;
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

    layer = new SimpleMeshLayer({
      id: `mesh-layer-${tile.id}`,
      mesh: geometry,
      data: [{}],
      getPosition: [0, 0, 0],
      getColor: [255, 255, 255],
      texture,
      coordinateOrigin: cartographicOrigin,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
    });

    layerMap[id] = layer;

    this.setState({layers: Object.values(layerMap)});
  };

  _onTileUnload(tile) {
    cesiumUnload(tile);

    const {layerMap} = this.state;
    let layer = layerMap[tile.id];
    if (layer && layer.props && layer.props.visible) {
      // Still has GPU resource but visibility is turned off so turn it back on so we can render it.
      layer = layer.clone({visible: false});
      layerMap[tile.id] = layer;
      this.setState({layers: Object.values(layerMap)});
    }
  };

  _onViewStateChange({viewState}) {
    // centerMap(viewState);
    this.setState({viewState});
    this._updateTileset(viewState);
  }

  async _updateTileset(viewState) {
    const tileset = this.state.tileset;
    if (tileset) {
      await tileset.update({viewState});
    }
  }

  _renderMeshLayers() {
    return this.state.layers;
  }

  _renderLayers() {
    return this._renderMeshLayers();
  }

  render() {
    const layers = this._renderLayers();

    return (
      <div>
        <DeckGL
          layers={layers}
          initialViewState={INITIAL_VIEW_STATE}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
        >
          <StaticMap
            mapStyle={'mapbox://styles/mapbox/dark-v9'}
            mapboxApiAccessToken={MAPBOX_TOKEN}
            preventStyleDiffing
          />
        </DeckGL>
      </div>
    );
  }
}

const deckViewer = document.getElementById('deck-viewer');
render(<App/>, deckViewer);
