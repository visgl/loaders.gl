import '@babel/polyfill';

import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator} from '@deck.gl/core';

import Tile3DLayer from './tile-3d-layer/tile-3d-layer';

import ControlPanel from './components/control-panel';
import fileDrop from './components/file-drop';
import StatsPanel, {STATS_IDS} from './components/stats-panel';

import {loadExampleIndex, DATA_URI} from './examples';

export const INITIAL_EXAMPLE_CATEGORY = 'additional';
export const INITIAL_EXAMPLE_NAME = 'Mount St Helens (Cesium Ion PointCloud)';

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const MAP_STYLES = {
  'Satellite Base Map': 'mapbox://styles/mapbox/satellite-v9',
  'Light Base Map': 'mapbox://styles/mapbox/light-v9',
  'Dark Base Map': 'mapbox://styles/mapbox/dark-v9'
};

const INITIAL_MAP_STYLE = MAP_STYLES['Dark Base Map'];
const TRANSITION_DURAITON = 3000;
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
    fileDrop(this._deckRef.deckCanvas, (promise, file) => {
      // eslint-disable-next-line
      alert('File drop of tilesets not yet implemented');
      // this.setState({ droppedFile: file, tile: null });
      // load(promise, Tile3DLoader).then(this._onLoad);
    });

    await this._loadExampleIndex();
    await this._loadInitialTileset();
  }

  // load the index file that lists example tilesets
  async _loadExampleIndex() {
    const examplesByCategory = await loadExampleIndex();
    this.setState({examplesByCategory});
  }

  async _loadInitialTileset() {
    /* global URL */
    const parsedUrl = new URL(window.location.href);
    const ionAccessToken = parsedUrl.searchParams.get('ionAccessToken');
    const ionAssetId = parsedUrl.searchParams.get('ionAssetId');
    if (ionAccessToken && ionAssetId) {
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

    // TODO - unify this as part of cleanup
    let tilesetUrl;
    let tilesetExampleProps;
    switch (category) {
      case 'additional':
      case 'vricon':
        tilesetExampleProps = examplesByCategory[category].examples[name];
        break;
      default:
        const selectedExample = examplesByCategory[category].examples[name];
        if (selectedExample && selectedExample.tileset) {
          tilesetUrl = `${DATA_URI}/${selectedExample.path}/${selectedExample.tileset}`;
          tilesetExampleProps = {
            tilesetUrl
          };
        }
    }
    this.setState({tilesetExampleProps});
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
    this._statsPanelRef.setStats(STATS_IDS.TILESET, tileset.stats);

    // Recenter to cover the tileset
    // TODO - transition?
    const {cartographicCenter, zoom} = tileset;
    this.setState({
      viewState: {
        ...this.state.viewState,
        longitude: cartographicCenter[0],
        latitude: cartographicCenter[1],
        zoom,
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      }
    });
  }

  // Called by Tile3DLayer whenever an individual tile in the current tileset is load or unload
  _onTilesetChange(tileHeader) {
    // Updates stats, called every frame
    this._statsPanelRef.update(STATS_IDS.TILESET);
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
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:{' '}
          {viewState.zoom.toFixed(2)}
        </div>
      </ControlPanel>
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
        {this._renderControlPanel()}
        <StatsPanel ref={_ => (this._statsPanelRef = _)} />
        <DeckGL
          ref={_ => (this._deckRef = _)}
          layers={[tile3DLayer]}
          initialViewState={INITIAL_VIEW_STATE}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
          onAfterRender={() => this._statsPanelRef.updateAll()}
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
