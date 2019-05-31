/* global fetch */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {StaticMap} from 'react-map-gl';

import '@loaders.gl/polyfills';
import Tileset3DLayer from './tileset-3d-layer';

import ControlPanel from './components/control-panel';
import fileDrop from './components/file-drop';
import {load} from '@loaders.gl/core';

const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';
const INDEX_FILE = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v9';

export const INITIAL_VIEW_STATE = {
  latitude: 40.04248558075302,
  longitude: -75.61213987669433,
  pitch: 45,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 17,
  height: window.innerHeight,
  width: window.innerWidth
};

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      viewState: INITIAL_VIEW_STATE,
      featureTable: null,
      batchTable: null,
      droppedFile: null,
      examplesByCategory: null,
      tiles: [],
      name: 'TilesetPoints',
      category: 'Tilesets'
    };

    this._deckRef = null;
  }

  componentDidMount() {
    fileDrop(this._deckRef.deckCanvas, (promise, file) => {
      this.setState({droppedFile: file, tile: null});
      // load(promise, Tile3DLoader).then(this._onLoad);
    });

    this._loadIndexAndDefaultTileset();
  }

  async _loadIndexAndDefaultTileset() {
    // load the index file that lists example tilesets
    const response = await fetch(INDEX_FILE);
    const data = await response.json();
    this.setState({examplesByCategory: data});

    // load the default tileset
    const {category, name} = this.state;
    await this._loadSelectedTileset(category, name);
  }

  async _loadSelectedTileset(category, name) {
    const {examplesByCategory} = this.state;
    const selectedExample = examplesByCategory[category].examples[name];
    const tilesetUrl = `${DATA_URI}/${selectedExample.path}/${selectedExample.tileset}`;
    let tilesetJson = null;
    if (selectedExample.tileset) {
      tilesetJson = await load(tilesetUrl);
    }
    this.setState({tilesetJson, tilesetUrl});
  }

  // CONTROL PANEL
  async _onSelectExample({category, name}) {
    this.setState({category, name});
    await this._loadSelectedTileset(category, name);
  }

  _renderControlPanel() {
    const {examplesByCategory, category, name} = this.state;
    if (!examplesByCategory) {
      return null;
    }
    return (
      <ControlPanel
        data={examplesByCategory}
        category={category}
        name={name}
        onChange={this._onSelectExample.bind(this)}
      />
    );
  }

  // MAIN

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _renderLayers() {
    const {tilesetJson, tilesetUrl, viewState} = this.state;
    const {zoom} = viewState;

    return (
      tilesetJson &&
      new Tileset3DLayer({
        id: 'tileset-layer',
        tilesetJson,
        tilesetUrl,
        onTileLoaded: tileHeader => this.forceUpdate(),
        zoom
      })
    );
  }

  render() {
    const {viewState} = this.state;

    return (
      <div>
        {this._renderControlPanel()}
        <DeckGL
          ref={_ => (this._deckRef = _)}
          layers={[this._renderLayers()]}
          initialViewState={INITIAL_VIEW_STATE}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={true}
        >
          <StaticMap
            reuseMaps
            mapStyle={MAPBOX_STYLE}
            preventStyleDiffing={true}
            mapboxApiAccessToken={MAPBOX_TOKEN}
          />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
