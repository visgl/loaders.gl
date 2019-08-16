/* global fetch */
import '@babel/polyfill';

import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {Vector3} from 'math.gl';
import {StatsWidget} from '@probe.gl/stats-widget';

import Tile3DLayer from './tile-3d-layer';

import ControlPanel from './components/control-panel';
import fileDrop from './components/file-drop';
import {getStatsWidget} from './components/stats-widgets';

const DATA_URI = 'https://raw.githubusercontent.com/uber-web/loaders.gl/master';
const INDEX_FILE = `${DATA_URI}/modules/3d-tiles/test/data/index.json`;

// eslint-disable-next-line
const ION_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxN2NhMzkwYi0zNWM4LTRjNTYtYWE3Mi1jMDAxYzhlOGVmNTAiLCJpZCI6OTYxOSwic2NvcGVzIjpbImFzbCIsImFzciIsImFzdyIsImdjIl0sImlhdCI6MTU2MjE4MTMxM30.OkgVr6NaKYxabUMIGqPOYFe0V5JifXLVLfpae63x-tA';

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v9';
const DEPTH_LIMIT = 10; // TODO: Remove this after sse traversal is working since this is just to prevent full load of tileset

const INITIAL_EXAMPLE_CATEGORY = 'additional';
const INITIAL_EXAMPLE_NAME = 'Mount St Helens (Cesium ion)';

const scratchLongLatZoom = new Vector3();

const ADDITIONAL_EXAMPLES = {
  name: 'additional',
  examples: {
    'Royal Exhibition Building (Github Pages)': {
      tilesetUrl:
        'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/3d-tiles/RoyalExhibitionBuilding/tileset.json',
      depthLimit: DEPTH_LIMIT, // TODO: Remove this after sse traversal is working since this is just to prevent full load of tileset
      color: [115, 101, 152, 200]
    },
    'Mount St Helens (Cesium ion)': {
      ionAssetId: 33301, // St Helen
      ionAccessToken: ION_ACCESS_TOKEN
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
      tilesetExampleProps: {},
      category: INITIAL_EXAMPLE_CATEGORY,
      name: INITIAL_EXAMPLE_NAME,

      // stats (TODO should be managed by Tileset3D)
      tileCount: 0,
      pointCount: 0
    };

    this._deckRef = null;
    this._onTilesetLoaded = this._onTilesetLoaded.bind(this);
    this._onTilesetChanged = this._onTilesetChanged.bind(this);
  }

  async componentDidMount() {
    this._memWidget = getStatsWidget(this._statsWidgetContainer);

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
      ionAccessToken = ionAccessToken || ION_ACCESS_TOKEN;
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

  // CONTROL PANEL
  async _onSelectExample({category, name}) {
    this.setState({category, name});
    await this._loadExampleTileset(category, name);
  }

  _onTilesetLoaded(tileset) {
    const tilesetStatsWidget = new StatsWidget(tileset.stats, {
      framesPerUpdate: 1,
      formatters: {
        'GPU Memory': 'memory',
        'Buffer Memory': 'memory',
        'Renderbuffer Memory': 'memory',
        'Texture Memory': 'memory'
      },
      container: this._statsWidgetContainer
    });

    tileset._getCartographicCenterAndZoom(scratchLongLatZoom);
    this.setState({
      tilesetStatsWidget,
      viewState: {
        ...this.state.viewState,
        longitude: scratchLongLatZoom[0],
        latitude: scratchLongLatZoom[1],
        zoom: scratchLongLatZoom[2]
      }
    });
  }

  _onTilesetChanged(tileHeader) {
    this._updateStatWidgets();
    this.forceUpdate();
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _updateStatWidgets() {
    if (this.state.tilesetStatsWidget) {
      this.state.tilesetStatsWidget.update();
    }
    if (this._memWidget) {
      this._memWidget.update();
    }
  }

  _renderControlPanel() {
    const {examplesByCategory, category, name, viewState} = this.state;
    if (!examplesByCategory) {
      return null;
    }

    // const stats = tileset && tileset.stats;
    // <div>
    //   Loaded {this.state.tileCount | 0} tiles {(this.state.pointCount / 1e6).toFixed(2)} M
    //   points
    // </div>

    return (
      <ControlPanel
        data={examplesByCategory}
        category={category}
        name={name}
        onChange={this._onSelectExample.bind(this)}
      >
        <div>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}
        </div>
        <div>zoom: {viewState.zoom.toFixed(2)} </div>
      </ControlPanel>
    );
  }

  _renderLayer() {
    const {tilesetExampleProps} = this.state;
    if (!tilesetExampleProps) {
      return null;
    }

    const {
      tilesetUrl,
      ionAssetId,
      ionAccessToken,
      coordinateOrigin,
      depthLimit = DEPTH_LIMIT,
      color = [255, 0, 0, 255]
    } = tilesetExampleProps;
    return new Tile3DLayer({
      id: 'tile-3d-layer',
      tilesetUrl,
      ionAssetId,
      ionAccessToken,
      coordinateOrigin,
      depthLimit,
      color,
      onTilesetLoaded: this._onTilesetLoaded,
      onTileLoaded: this._onTilesetChanged,
      onTileUnloaded: this._onTilesetChanged,
      onTileLoadFiled: this._onTilesetChanged
    });
  }

  _renderStats() {
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

  render() {
    const {viewState} = this.state;
    const layer = this._renderLayer();

    return (
      <div>
        {this._renderStats()}
        {this._renderControlPanel()}
        <DeckGL
          ref={_ => (this._deckRef = _)}
          layers={[layer]}
          initialViewState={INITIAL_VIEW_STATE}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85}}
          onAfterRender={() => this._updateStatWidgets()}
        >
          <StaticMap mapStyle={MAPBOX_STYLE} mapboxApiAccessToken={MAPBOX_TOKEN} />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
