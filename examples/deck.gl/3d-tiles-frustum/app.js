/* global window */
import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {MapView, WebMercatorViewport, FlyToInterpolator} from '@deck.gl/core';
import {LineLayer} from '@deck.gl/layers';
import {StatsWidget} from '@probe.gl/stats-widget';
import {lumaStats} from '@luma.gl/core';

// To manage dependencies and bundle size, the app must decide which supporting loaders to bring in
import {registerLoaders} from '@loaders.gl/core';
import {DracoWorkerLoader} from '@loaders.gl/draco';
import {GLTFLoader} from '@loaders.gl/gltf';

import ControlPanel from './components/control-panel';
import {loadExampleIndex, INITIAL_EXAMPLE_CATEGORY, INITIAL_EXAMPLE_NAME} from './examples';
import {INITIAL_MAP_STYLE} from './constants';
import {getCulling, getFrustumBounds} from './frustum-utils';

// enable DracoWorkerLoader when fixed
registerLoaders([GLTFLoader, DracoWorkerLoader]);

// Set your mapbox token here
const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const TRANSITION_DURAITON = 4000;

const EXAMPLES_VIEWSTATE = {
  latitude: -37.8,
  longitude: 145
};

const INITIAL_VIEW_STATE = {
  main: {
    width: window.innerWidth,
    height: window.innerHeight,
    ...EXAMPLES_VIEWSTATE,
    pitch: 45,
    maxPitch: 60,
    bearing: 0,
    minZoom: 2,
    maxZoom: 30,
    zoom: 3 // Start zoomed out on US, tileset will center via "fly-to" on load
  },
  minimap: {
    ...EXAMPLES_VIEWSTATE,
    zoom: 5
  }
};

const MINIMAP_STYLE = {
  width: '100%',
  height: '100%',
  background: '#444',
  border: '2px solid #fff',
  position: 'relative',
  zIndex: -1
};

const LABEL_STYLE = {
  padding: '10px',
  background: 'white',
  border: '1px solid black'
};

const STATS_WIDGET_STYLE = {
  position: 'absolute',
  padding: 12,
  zIndex: '10000',
  maxWidth: 300,
  background: '#000',
  color: '#fff'
};

const VIEWS = [
  new MapView({id: 'main', controller: true}),
  new MapView({id: 'minimap', clear: true, x: '70%', y: '70%', width: '28%', height: '28%'})
];

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      // CURRENT VIEW POINT / CAMERA POSITION
      viewState: INITIAL_VIEW_STATE,

      // current tileset
      tileset: null,

      // MAP STATE
      selectedMapStyle: INITIAL_MAP_STYLE,

      // EXAMPLE STATE
      examplesByCategory: null,
      selectedExample: {},
      category: INITIAL_EXAMPLE_CATEGORY,
      name: INITIAL_EXAMPLE_NAME
    };

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

    await this._loadExampleIndex();

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
    this.setState({tileset});
    this._tilesetStatsWidget.setStats(tileset.stats);
    this._centerViewOnTileset(tileset);
  }

  // Recenter view to cover the new tileset, with a fly-to transition
  _centerViewOnTileset(tileset) {
    const {cartographicCenter, zoom} = tileset;
    this.setState({
      viewState: {
        minimap: {
          ...INITIAL_VIEW_STATE.minimap,
          longitude: cartographicCenter[0],
          latitude: cartographicCenter[1],
          zoom: zoom - 4
        },
        main: {
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
      }
    });
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();
    this._tilesetStatsWidget.update();
  }

  // Called by Tile3DLayer whenever an individual tile in the current tileset is load or unload
  _onTilesetChange(tileHeader) {
    this._updateStatWidgets();
  }

  // Called by DeckGL when user interacts with the map
  _onViewStateChange({viewState}) {
    const minimapViewState = {
      ...INITIAL_VIEW_STATE.minimap,
      latitude: viewState.latitude,
      longitude: viewState.longitude,
      zoom: viewState.zoom - 4
    };
    this.setState({
      viewState: {minimap: minimapViewState, main: viewState}
    });
  }

  _renderControlPanel() {
    const {examplesByCategory, category, name, tileset} = this.state;
    if (!examplesByCategory) {
      return null;
    }

    const viewState = this.state.viewState.main;
    return (
      <ControlPanel
        data={examplesByCategory}
        category={category}
        name={name}
        tileset={tileset}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        onExampleChange={this._onSelectExample.bind(this)}
      >
        <div style={{textAlign: 'center'}}>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:{' '}
          {viewState.zoom.toFixed(2)}
        </div>
        {this._renderCullingStatus()}
      </ControlPanel>
    );
  }

  _renderCullingStatus() {
    const {tileset} = this.state;
    if (!tileset || !tileset.selectedTiles.length) {
      return null;
    }

    const {viewState} = this.state;
    const viewport = new WebMercatorViewport(viewState.main);
    const selectedTiles = tileset.selectedTiles;

    return (
      <div style={LABEL_STYLE}>
        {selectedTiles.map(tileHeader => {
          const {cartographicOrigin} = tileHeader.content;
          const outDir = getCulling(viewport, cartographicOrigin);
          const cullStatus = outDir ? `OUT (${outDir})` : 'IN';
          const style = outDir ? null : {fontWeight: 500};
          const id = tileHeader.id
            .split('/')
            .filter(Boolean)
            .slice(3)
            .join('/');
          return (
            <div key={tileHeader.id} style={style}>
              {id}: {cullStatus}
            </div>
          );
        })}
      </div>
    );
  }

  _renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return <div style={STATS_WIDGET_STYLE} ref={_ => (this._statsWidgetContainer = _)} />;
  }

  _renderTile3DLayer() {
    const {selectedExample} = this.state;
    if (!selectedExample) {
      return null;
    }

    const {tilesetUrl, ionAssetId, ionAccessToken, maximumScreenSpaceError} = selectedExample;
    const loadOptions = maximumScreenSpaceError ? {maximumScreenSpaceError} : {};

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
      onTileError: this._onTilesetChange,
      loadOptions
    });
  }

  _renderFrustumLayer() {
    const {viewState} = this.state;
    const viewport = new WebMercatorViewport(viewState.main);
    const frustomBounds = getFrustumBounds(viewport);

    return new LineLayer({
      id: 'frustum',
      data: frustomBounds,
      getSourcePosition: d => d.source,
      getTargetPosition: d => d.target,
      getColor: d => d.color,
      getWidth: 5
    });
  }

  _renderLayers() {
    return [this._renderTile3DLayer(), this._renderFrustumLayer()];
  }

  render() {
    const {viewState, selectedMapStyle} = this.state;

    return (
      <div>
        {this._renderStats()}
        {this._renderControlPanel()}
        <DeckGL
          layerFilter={({layer, viewport}) => {
            if (viewport.id === 'main' && layer.id === 'frustum') {
              // Do not draw the frustum layer in the main view
              return false;
            }
            return true;
          }}
          layers={this._renderLayers()}
          views={VIEWS}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          onAfterRender={() => this._updateStatWidgets()}
        >
          <MapView id="main">
            <StaticMap
              mapStyle={selectedMapStyle}
              mapboxApiAccessToken={MAPBOX_TOKEN}
              preventStyleDiffing
            />
          </MapView>
          <MapView id="minimap">
            <div style={MINIMAP_STYLE} />
          </MapView>
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
