/* global fetch */
import '@babel/polyfill';

import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {lumaStats} from '@luma.gl/core';
import {StatsWidget} from '@probe.gl/stats-widget';

import Tile3DLayer from './tile-3d-layer/tile-3d-layer';

import ControlPanel from './components/control-panel';
import fileDrop from './components/file-drop';

const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';
const INDEX_FILE = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

// eslint-disable-next-line
const ION_ACCESS_TOKEN_1 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2NhMzkwYi0zNWM4LTRjNTYtYWE3Mi1jMDAxYzhlOGVmNTAiLCJpZCI6OTYxOSwic2NvcGVzIjpbImFzbCIsImFzciIsImFzdyIsImdjIl0sImlhdCI6MTU2MjE4MTMxM30.OkgVr6NaKYxabUMIGqPOYFe0V5JifXLVLfpae63x-tA';
const ION_ACCESS_TOKEN_2 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzMGY4ODczYy1mNTk4LTRiMDUtYmIxYy0xZWYwOWZmMGY4NjQiLCJpZCI6NDQsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJhc3NldHMiOlsxLDIsMyw0LDYxOTMsNjI3Myw3MTYyLDczNTMsNzE0Ml0sImlhdCI6MTU0MTYxODM0NX0.lWnGs9ySXO4QK3HagcMsDpZ8L01DpmUDQm38-2QAQuE';
// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const MAP_STYLES = {
  'Satellite Base Map': 'mapbox://styles/mapbox/satellite-v9',
  'Light Base Map': 'mapbox://styles/mapbox/light-v9',
  'Dark Base Map': 'mapbox://styles/mapbox/dark-v9'
};

const INITIAL_MAP_STYLE = MAP_STYLES['Dark Base Map'];

const ADDITIONAL_EXAMPLES = {
  name: 'additional',
  examples: {
    'Royal Exhibition Building (Github Pages)': {
      tilesetUrl:
        'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/3d-tiles/RoyalExhibitionBuilding/tileset.json',
      color: [115, 101, 152, 200]
    },
    '6193 (Cesium Ion Batched)': {ionAssetId: 6193, ionAccessToken: ION_ACCESS_TOKEN_2},
    '7162 (Cesium Ion Batched)': {ionAssetId: 7162, ionAccessToken: ION_ACCESS_TOKEN_2},
    'Mount St Helens (Cesium Ion PointCloud)': {
      ionAssetId: 33301,
      ionAccessToken: ION_ACCESS_TOKEN_1
    },
    'Montreal (Cesium Ion PointCloud)': {ionAssetId: 28945, ionAccessToken: ION_ACCESS_TOKEN_1}
  }
};

const INITIAL_EXAMPLE_CATEGORY = 'additional';
const INITIAL_EXAMPLE_NAME = 'Mount St Helens (Cesium Ion PointCloud)';

const EXAMPLES_VIEWSTATE = {
  latitude: 40.04248558075302,
  longitude: -75.61213987669433
};

export const INITIAL_VIEW_STATE = {
  ...EXAMPLES_VIEWSTATE,
  pitch: 45,
  maxPitch: 60,
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
      tilesetExampleProps: {},
      category: INITIAL_EXAMPLE_CATEGORY,
      name: INITIAL_EXAMPLE_NAME,
      selectedMapStyle: INITIAL_MAP_STYLE
    };

    this._deckRef = null;
    this._onTilesetLoad = this._onTilesetLoad.bind(this);
    this._onTilesetChange = this._onTilesetChange.bind(this);
  }

  async componentDidMount() {
    const container = this._statsWidgetContainer;
    // TODO - This is noisy. Default formatters should already be pre-registered on the stats object
    // TODO - Revisit after upgrade luma to use most recent StatsWidget API
    this._memWidget = new StatsWidget(lumaStats.get('Memory Usage'), {
      framesPerUpdate: 1,
      formatters: {
        'GPU Memory': 'memory',
        'Buffer Memory': 'memory',
        'Renderbuffer Memory': 'memory',
        'Texture Memory': 'memory'
      },
      container
    });

    this._tilesetStatsWidget = new StatsWidget(null, {container});

    fileDrop(this._deckRef.deckCanvas, (promise, file) => {
      // eslint-disable-next-line
      alert('File drop of tilesets not yet implemented');
      // this.setState({ droppedFile: file, tile: null });
      // load(promise, Tile3DLoader).then(this._onLoad);
    });

    await this._loadExampleIndex();
    await this._loadInitialTileset();
  }

  async _loadExampleIndex() {
    // load the index file that lists example tilesets
    const response = await fetch(INDEX_FILE);
    const data = await response.json();
    this.setState({
      examplesByCategory: {
        ...data,
        additional: ADDITIONAL_EXAMPLES,
        custom: {
          name: 'Custom',
          examples: {
            'Custom Tileset': {},
            'ION Tileset': {}
          }
        }
      }
    });
  }

  async _loadInitialTileset() {
    /* global URL */
    const parsedUrl = new URL(window.location.href);
    const ionAssetId = parsedUrl.searchParams.get('ionAssetId');
    let ionAccessToken = parsedUrl.searchParams.get('ionAccessToken');
    if (ionAssetId || ionAccessToken) {
      // load the tileset specified in the URL
      ionAccessToken = ionAccessToken || ION_ACCESS_TOKEN_1;
      await this._loadTilesetFromIonAsset(ionAccessToken, ionAssetId);
      return;
    }

    const tilesetUrl = parsedUrl.searchParams.get('tileset');
    if (tilesetUrl) {
      // load the tileset specified in the URL
      await this._loadTilesetFromUrl(tilesetUrl);
      return;
    }

    // load the default example tileset
    const {category, name} = this.state;
    await this._loadExampleTileset(category, name);
  }

  async _loadExampleTileset(category, name) {
    const {examplesByCategory} = this.state;

    let tilesetUrl;
    let tilesetExampleProps;
    if (category === 'additional') {
      tilesetExampleProps = ADDITIONAL_EXAMPLES.examples[name];
    } else {
      const selectedExample = examplesByCategory[category].examples[name];
      if (selectedExample && selectedExample.tileset) {
        tilesetUrl = `${DATA_URI}/${selectedExample.path}/${selectedExample.tileset}`;
        tilesetExampleProps = {
          tilesetUrl,
          isWGS84: true
        };
      }
    }

    this.setState({
      tilesetExampleProps
    });
  }

  async _loadTilesetFromIonAsset(ionAccessToken, ionAssetId) {
    this.setState({
      tilesetExampleProps: {
        ionAccessToken,
        ionAssetId
      },
      category: 'custom',
      name: 'ION Tileset'
    });
  }

  async _loadTilesetFromUrl(tilesetUrl) {
    this.setState({
      tilesetExampleProps: {
        tilesetUrl
      },
      category: 'custom',
      name: 'Custom Tileset'
    });
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    if (this._tilesetStatsWidget) {
      this._tilesetStatsWidget.update();
    }
    if (this._memWidget) {
      this._memWidget.update();
    }
  }

  // Called by ControlPanel when user selects a new example
  async _onSelectExample({category, name}) {
    this.setState({category, name});
    await this._loadExampleTileset(category, name);
  }

  // Called by ControlPanel when user selects a new map style
  _onSelectMapStyle({selectedMapStyle}) {
    this.setState({selectedMapStyle});
  }

  // Called by Tile3DLayer when a new tileset is load
  _onTilesetLoad(tileset) {
    this._tilesetStatsWidget.setStats(tileset.stats);
    // TODO remove when @probe.gl/stats-widget fix
    this._tilesetStatsWidget.update();

    // Recenter to cover the tileset
    // TODO - transition?
    const {cartographicCenter, zoom} = tileset;
    this.setState({
      viewState: {
        ...this.state.viewState,
        longitude: cartographicCenter[0],
        latitude: cartographicCenter[1],
        zoom
      }
    });
  }

  // Called by Tile3DLayer whenever an individual tile in the current tileset is load or unload
  _onTilesetChange(tileHeader) {
    this._updateStatWidgets();
    this.forceUpdate();
  }

  // Called by DeckGL when user interacts with the map
  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _renderControlPanel() {
    const {examplesByCategory, category, name, viewState, selectedMapStyle} = this.state;
    if (!examplesByCategory) {
      return null;
    }

    return (
      <ControlPanel
        mapStyles={MAP_STYLES}
        selectedMapStyle={selectedMapStyle}
        data={examplesByCategory}
        category={category}
        name={name}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        onExampleChange={this._onSelectExample.bind(this)}
      >
        <div>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}
          zoom: {viewState.zoom.toFixed(2)}
        </div>
      </ControlPanel>
    );
  }

  _renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return (
      <div
        style={{
          position: 'absolute',
          padding: 12,
          zIndex: '10000',
          maxWidth: 300,
          background: '#000',
          color: '#fff'
        }}
        ref={_ => (this._statsWidgetContainer = _)}
      />
    );
  }

  _renderTile3DLayer() {
    const {tilesetExampleProps} = this.state;
    if (!tilesetExampleProps) {
      return null;
    }

    const {tilesetUrl, ionAssetId, ionAccessToken, coordinateOrigin} = tilesetExampleProps;

    return new Tile3DLayer({
      id: 'tile-3d-layer',
      tilesetUrl,
      ionAssetId,
      ionAccessToken,
      coordinateOrigin,
      onTilesetLoad: this._onTilesetLoad,
      onTileLoad: this._onTilesetChange,
      onTileUnload: this._onTilesetChange,
      onTileLoadFail: this._onTilesetChange
    });
  }

  render() {
    const {viewState, selectedMapStyle} = this.state;
    const tile3DLayer = this._renderTile3DLayer();

    return (
      <div>
        {this._renderStats()}
        {this._renderControlPanel()}
        <DeckGL
          ref={_ => (this._deckRef = _)}
          layers={[tile3DLayer]}
          initialViewState={INITIAL_VIEW_STATE}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
          onAfterRender={() => this._updateStatWidgets()}
        >
          <StaticMap
            mapStyle={selectedMapStyle}
            mapboxApiAccessToken={MAPBOX_TOKEN}
            preventStyleDiffing
          />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
