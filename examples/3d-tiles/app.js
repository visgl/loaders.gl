/* global fetch */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import DeckGL from '@deck.gl/react';
import {StaticMap} from 'react-map-gl';

import '@loaders.gl/polyfills';
import Tileset3DLayer from './tileset-3d-layer';

import ControlPanel from './components/control-panel';
// import fileDrop from './components/file-drop';
import {COORDINATE_SYSTEM} from '@deck.gl/core';

const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';
const INDEX_FILE = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_STYLE = 'mapbox://styles/mapbox/light-v9';

const ADDITIONAL_EXAMPLES = {
  name: 'additional',
  examples: {
    royalExhibitionBuilding: {
      tilesetUrl:
        'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/3d-tiles/RoyalExhibitionBuilding/tileset.json',
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
      coordinateOrigin: [144.97212, -37.805177],
      isWGS84: false,
      depthLimit: 5,
      color: [115, 101, 152, 200]
    }
  }
};

const EXAMPLES_VIEWSTATE = {
  latitude: 40.04248558075302,
  longitude: -75.61213987669433
};

export const INITIAL_VIEW_STATE = {
  ...EXAMPLES_VIEWSTATE,
  pitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 17
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
      tileset3dLayerProps: {},
      name: 'royalExhibitionBuilding',
      category: 'additional'
    };

    this._deckRef = null;
  }

  componentDidMount() {
    // fileDrop(this._deckRef.deckCanvas, (promise, file) => {
    //   this.setState({ droppedFile: file, tile: null });
    // load(promise, Tile3DLoader).then(this._onLoad);
    // });

    this._loadIndexAndDefaultTileset();
  }

  async _loadIndexAndDefaultTileset() {
    // load the index file that lists example tilesets
    const response = await fetch(INDEX_FILE);
    const data = await response.json();
    this.setState({
      examplesByCategory: {
        ...data,
        additional: ADDITIONAL_EXAMPLES
      }
    });

    // load the default tileset
    const {category, name} = this.state;
    await this._loadSelectedTileset(category, name);
  }

  async _loadSelectedTileset(category, name) {
    const {examplesByCategory} = this.state;

    let tilesetUrl;
    let tileset3dLayerProps = {};
    if (category === 'additional') {
      tileset3dLayerProps = ADDITIONAL_EXAMPLES.examples[name];
      const {coordinateOrigin} = tileset3dLayerProps;
      this.setState({
        viewState: {
          ...this.state.viewState,
          longitude: coordinateOrigin[0],
          latitude: coordinateOrigin[1]
        }
      });
    } else {
      const selectedExample = examplesByCategory[category].examples[name];
      if (selectedExample && selectedExample.tileset) {
        tilesetUrl = `${DATA_URI}/${selectedExample.path}/${selectedExample.tileset}`;
        tileset3dLayerProps = {
          tilesetUrl,
          isWGS84: true
        };
      }
    }

    this.setState({
      tileset3dLayerProps
    });
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

  _renderLayer() {
    const {tileset3dLayerProps} = this.state;
    const {
      tilesetUrl,
      coordinateSystem,
      coordinateOrigin,
      isWGS84,
      depthLimit,
      color
    } = tileset3dLayerProps;
    return (
      tileset3dLayerProps &&
      new Tileset3DLayer({
        id: 'tileset-layer',
        tilesetUrl,
        coordinateSystem,
        coordinateOrigin,
        isWGS84,
        depthLimit,
        color,
        onTileLoaded: tileHeader => {
          const {name} = this.state;
          // cannot parse the center from royalExhibitionBuilding dataset
          if (tileHeader.depth === 0 && name !== 'royalExhibitionBuilding') {
            const {center} = tileHeader.boundingVolume;
            this.setState({
              viewState: {
                ...this.state.viewState,
                longitude: center[0],
                latitude: center[1]
              }
            });
          }
          this.forceUpdate();
        }
      })
    );
  }

  render() {
    const {viewState} = this.state;
    const layer = this._renderLayer();

    return (
      <div>
        {this._renderControlPanel()}
        <DeckGL
          ref={_ => (this._deckRef = _)}
          layers={[layer]}
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
