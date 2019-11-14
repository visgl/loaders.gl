/* eslint-disable */
/* global URL */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';

import {Vector3} from 'math.gl';
import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator} from '@deck.gl/core';
import I3S3DLayer from './i3s-3d-layer';

import {centerMap, cesiumRender, cesiumUnload} from './cesium';

const TEST_DATA_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';

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

  _onTilesetLoad(tileset) {
    const bbox = tileset.json.store.extent;
    const longitude = (bbox[0] + bbox[2]) / 2;
    const latitude = (bbox[1] + bbox[3]) / 2;

    const viewState = {
      ...this.state.viewState,
      zoom: 14,
      longitude,
      latitude
    };

    this.setState({
      tileset,
      viewState: {
        ...viewState,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      }
    });

    // await tileset.update({viewState});

    // render with cesium
    centerMap(viewState);
  }

  _onTileLoad(tile) {
    const {viewState} = this.state;
    cesiumRender(viewState, tile);
  }

  _onTileUnload(tile) {
    cesiumUnload(tile);
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
    centerMap(viewState);
  }

  _renderLayers() {
    return [
      new I3S3DLayer({
        data: TEST_DATA_URL,
        onTilesetLoad: this._onTilesetLoad.bind(this),
        onTileLoad: this._onTileLoad.bind(this),
        onTileUnload: this._onTileUnload.bind(this)
      })
    ];
  }

  render() {
    const layers = this._renderLayers();

    return (
      <div>
        <DeckGL
          ref={_ => (this._deckRef = _)}
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
render(<App />, deckViewer);
