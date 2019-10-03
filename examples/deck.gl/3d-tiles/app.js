/* global URL */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';

import {MapController, FlyToInterpolator} from '@deck.gl/core';
// import {Tile3DLayer} from '@deck.gl/geo-layers';
import Tile3DLayer from './3d-tile-layer/tile-3d-layer';

import {lumaStats} from '@luma.gl/core';
import {StatsWidget} from '@probe.gl/stats-widget';

// To manage dependencies and bundle size, the app must decide which supporting loaders to bring in
import {registerLoaders} from '@loaders.gl/core';
import {DracoWorkerLoader} from '@loaders.gl/draco';
import {GLTFLoader} from '@loaders.gl/gltf';

import ControlPanel from './components/control-panel';
import fileDrop from './components/file-drop';

import {loadExampleIndex, INITIAL_EXAMPLE_CATEGORY, INITIAL_EXAMPLE_NAME} from './examples';

registerLoaders([GLTFLoader, DracoWorkerLoader]);

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const MAP_STYLES = {
  'Base Map: Satellite': 'mapbox://styles/mapbox/satellite-v9',
  'Base Map: Light': 'mapbox://styles/mapbox/light-v9',
  'Base Map: Dark': 'mapbox://styles/mapbox/dark-v9'
};

const INITIAL_MAP_STYLE = MAP_STYLES['Base Map: Dark'];
const TRANSITION_DURAITON = 4000;
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
  zoom: 3 // Start zoomed out on US, tileset will center via "fly-to" on load
};

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      // CURRENT VIEW POINT / CAMERA POSITIO
      viewState: INITIAL_VIEW_STATE,

      // MAP STATE
      selectedMapStyle: INITIAL_MAP_STYLE,

      // EXAMPLE STATE
      droppedFile: null,
      examplesByCategory: null,
      selectedExample: {},
      category: INITIAL_EXAMPLE_CATEGORY,
      name: INITIAL_EXAMPLE_NAME,
      attributions: []
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

    // Check if a tileset is specified in the query params
    if (this._selectTilesetFromQueryParams()) {
      return;
    }

    // if not, select the default example tileset
    const {category, name} = this.state;
    const {examplesByCategory} = this.state;
    const selectedExample = examplesByCategory[category].examples[name];
    this.setState({selectedExample});
  }

  // load the index file that lists example tilesets
  async _loadExampleIndex() {
    const examplesByCategory = await loadExampleIndex();
    this.setState({examplesByCategory});
  }

  // Check URL query params and select the "custom example" if appropriate
  _selectTilesetFromQueryParams() {
    const parsedUrl = new URL(window.location.href);
    const ionAccessToken = parsedUrl.searchParams.get('ionAccessToken');
    const ionAssetId = parsedUrl.searchParams.get('ionAssetId');
    if (ionAccessToken && ionAssetId) {
      this.setState({
        selectedExample: {ionAccessToken, ionAssetId},
        category: 'custom',
        name: 'ION Tileset'
      });
      return true;
    }

    const tilesetUrl = parsedUrl.searchParams.get('tileset');
    if (tilesetUrl) {
      this.setState({
        selectedExample: {tilesetUrl},
        category: 'custom',
        name: 'URL Tileset'
      });
      return true;
    }

    return false;
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();
    this._tilesetStatsWidget.update();
  }

  // Called by ControlPanel when user selects a new example
  async _onSelectExample({example, category, name}) {
    this.setState({selectedExample: example, category, name});
  }

  // Called by ControlPanel when user selects a new map style
  _onSelectMapStyle({selectedMapStyle}) {
    this.setState({selectedMapStyle});
  }

  // Called by Tile3DLayer when a new tileset is loaded
  _onTilesetLoad(tileset) {
    this.setState({description: tileset.description, attributions: tileset.credits.attributions});
    this._tilesetStatsWidget.setStats(tileset.stats);
    this._centerViewOnTileset(tileset);
  }

  // Recenter view to cover the new tileset, with a fly-to transition
  _centerViewOnTileset(tileset) {
    const {cartographicCenter, zoom} = tileset;
    this.setState({
      viewState: {
        ...this.state.viewState,

        // Update deck.gl viewState, moving the camera to the new tileset
        longitude: cartographicCenter[0],
        latitude: cartographicCenter[1],
        zoom: zoom + 1.5, // TODO - remove adjustment when Tileset3D calculates correct zoom
        bearing: INITIAL_VIEW_STATE.bearing,
        pitch: INITIAL_VIEW_STATE.pitch,

        // Tells deck.gl to animate the camera move to the new tileset
        transitionDuration: TRANSITION_DURAITON,
        transitionInterpolator: new FlyToInterpolator()
      }
    });
  }

  // Called by Tile3DLayer whenever an individual tile in the current tileset is load or unload
  _onTilesetChange(tileHeader) {
    this._updateStatWidgets();
  }

  // Called by DeckGL when user interacts with the map
  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _renderControlPanel() {
    const {
      examplesByCategory,
      category,
      name,
      viewState,
      selectedMapStyle,
      attributions,
      description
    } = this.state;
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
        description={description}
        attributions={attributions}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        onExampleChange={this._onSelectExample.bind(this)}
      >
        <div style={{textAlign: 'center'}}>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:{' '}
          {viewState.zoom.toFixed(2)}
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
    const {selectedExample} = this.state;
    if (!selectedExample) {
      return null;
    }

    const {tilesetUrl, ionAssetId, ionAccessToken} = selectedExample;

    return new Tile3DLayer({
      id: 'tile-3d-layer',
      data: tilesetUrl,
      _ionAssetId: ionAssetId,
      _ionAccessToken: ionAccessToken,
      pointSize: 2,
      getPointColor: [115, 112, 202],
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
