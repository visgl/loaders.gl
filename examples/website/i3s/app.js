import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import styled from 'styled-components';

import {lumaStats} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator, COORDINATE_SYSTEM} from '@deck.gl/core';
import {TerrainLayer} from '@deck.gl/geo-layers';
import {I3SLoader, I3SBuildingSceneLayerLoader, loadFeatureAttributes} from '@loaders.gl/i3s';
import {StatsWidget} from '@probe.gl/stats-widget';

import ControlPanel from './components/control-panel';
import AttributesPanel from './components/attributes-panel';
import {parseTilesetUrlFromUrl, parseTilesetUrlParams} from './url-utils';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';
import {INITIAL_MAP_STYLE} from './constants';
import {Color, Flex, Font} from './components/styles';
import {load} from '@loaders.gl/core';
import {buildSublayersTree} from './helpers/sublayers';
import {initStats, sumTilesetsStats} from './helpers/stats';

import {default as Tile3DLayer} from './deckgl/tile-3d-layer-tmp';

const TRANSITION_DURAITON = 4000;

const INITIAL_VIEW_STATE = {
  longitude: -120,
  latitude: 34,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

const StatsWidgetWrapper = styled.div`
  display: flex;
  @media (max-width: 768px) {
    display: none;
  }
`;

const StatsWidgetContainer = styled.div`
  ${Flex}
  ${Color}
  ${Font}
  color: rgba(255, 255, 255, .6);
  z-index: 3;
  bottom: 15px;
  word-break: break-word;
  padding: 24px;
  border-radius: 8px;
  line-height: 135%;
  bottom: auto;
  width: 277px;
  left: 10px;
  max-height: calc(100% - 125px);
  overflow: auto;
`;

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this._tilesetStatsWidget = null;
    this._loadedTilesets = [];
    this.state = {
      tileset: null,
      url: null,
      token: null,
      name: INITIAL_EXAMPLE_NAME,
      viewState: INITIAL_VIEW_STATE,
      selectedMapStyle: INITIAL_MAP_STYLE,
      selectedFeatureAttributes: null,
      selectedFeatureIndex: -1,
      selectedTilesetBasePath: null,
      isAttributesLoading: false,
      showBuildingExplorer: false,
      flattenedSublayers: [],
      sublayers: [],
      sublayersUpdateCounter: 0,
      tilesetsStats: initStats(),
      useTerrainLayer: false
    };
    this.needTransitionToTileset = true;

    this._onSelectTileset = this._onSelectTileset.bind(this);
    this.handleClosePanel = this.handleClosePanel.bind(this);
    this._onToggleBuildingExplorer = this._onToggleBuildingExplorer.bind(this);
    this._updateSublayerVisibility = this._updateSublayerVisibility.bind(this);
    this._toggleTerrain = this._toggleTerrain.bind(this);
  }

  componentDidMount() {
    this._memWidget = new StatsWidget(lumaStats.get('Memory Usage'), {
      framesPerUpdate: 1,
      formatters: {
        'GPU Memory': 'memory',
        'Buffer Memory': 'memory',
        'Renderbuffer Memory': 'memory',
        'Texture Memory': 'memory'
      },
      container: this._statsWidgetContainer
    });
    this._tilesetStatsWidget = new StatsWidget(null, {
      container: this._statsWidgetContainer
    });

    // Check if a tileset is specified in the query params
    let tileset;
    const tilesetUrl = parseTilesetUrlFromUrl();
    if (tilesetUrl) {
      tileset = {url: tilesetUrl};
    } else {
      tileset = EXAMPLES[INITIAL_EXAMPLE_NAME];
    }
    this.setState({tilesetsStats: initStats(tilesetUrl)});
    this._onSelectTileset(tileset);
  }

  /**
   * Get elevation data for TerrainLayer
   * If MapboxAccessToken is rovided we will use mapbox data.
   * If not we will use Mapzen Terrain Tile and ArcGIS texture.
   * Docs - https://github.com/tilezen/joerd/tree/master/docs
   */
  getTerrainLayerData() {
    const MAPBOX_TOKEN = process.env.MapboxAccessToken;
    const MAPBOX_TERRAIN_IMAGE = `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`;
    const MAPBOX_SURFACE_IMAGE = `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${MAPBOX_TOKEN}`;
    const MAPBOX_ELEVATION_DECODER = {
      rScaler: 6553.6,
      gScaler: 25.6,
      bScaler: 0.1,
      offset: -10000
    };

    // https://github.com/tilezen/joerd/blob/master/docs/use-service.md#additional-amazon-s3-endpoints
    const MAPZEN_TERRAIN_IMAGE = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`
    const ARCGIS_STREET_MAP_SURFACE_IMAGE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    // https://github.com/tilezen/joerd/blob/master/docs/formats.md#terrarium
    const MAPZEN_ELEVATION_DECODER = {
      rScaler: 256,
      gScaler: 1,
      bScaler: 1 / 256,
      offset: -32768
    };

    if (MAPBOX_TOKEN) {
      return {
        elevationData: MAPBOX_TERRAIN_IMAGE,
        texture: MAPBOX_SURFACE_IMAGE,
        elevationDecoder: MAPBOX_ELEVATION_DECODER
      }
    }

    return {
      elevationData: MAPZEN_TERRAIN_IMAGE,
      texture: ARCGIS_STREET_MAP_SURFACE_IMAGE,
      elevationDecoder: MAPZEN_ELEVATION_DECODER
    }
  }

  /**
   * Tries to get Building Scene Layer sublayer urls if exists.
   * @param {string} tilesetUrl
   * @returns {string[]} Sublayer urls or tileset url.
   * TODO Add filtration mode for sublayers which were selected by user.
   */
  async getFlattenedSublayers(tilesetUrl) {
    try {
      const tileset = await load(tilesetUrl, I3SBuildingSceneLayerLoader);
      const sublayersTree = buildSublayersTree(tileset.header.sublayers);
      this.setState({sublayers: sublayersTree.sublayers});
      const sublayers = tileset?.sublayers.filter((sublayer) => sublayer.name !== 'Overview');
      return sublayers;
    } catch (e) {
      return [{url: tilesetUrl, visibility: true}];
    }
  }

  async _onSelectTileset(tileset) {
    const params = parseTilesetUrlParams(tileset.url, tileset);
    const {tilesetUrl, token, name, metadataUrl} = params;
    this.setState({tilesetUrl, name, token, sublayers: []});
    const metadata = await fetch(metadataUrl).then((resp) => resp.json());
    const flattenedSublayers = await this.getFlattenedSublayers(tilesetUrl);
    this.setState({metadata, selectedFeatureAttributes: null, flattenedSublayers});
    this._loadedTilesets = [];
    this.needTransitionToTileset = true;
    const tilesetsStats = initStats(tilesetUrl);
    this._tilesetStatsWidget.setStats(tilesetsStats);
    this.setState({tilesetsStats});
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();

    const {tilesetsStats} = this.state;
    sumTilesetsStats(this._loadedTilesets, tilesetsStats);
    this._tilesetStatsWidget.update();
  }

  _onTilesetLoad(tileset) {
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter;

    this._loadedTilesets = [...this._loadedTilesets, tileset];
    if (this.needTransitionToTileset) {
      const viewState = {
        ...this.state.viewState,
        zoom: zoom + 2.5,
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
      this.needTransitionToTileset = false;
    }
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _onSelectMapStyle({selectedMapStyle}) {
    this.setState({selectedMapStyle});
  }

  _toggleTerrain() {
    const {useTerrainLayer} = this.state;
    this.setState({useTerrainLayer: !useTerrainLayer});
  }

  _renderTerrainLayer() {
    const {elevationDecoder, texture, elevationData } = this.getTerrainLayerData();

    return new TerrainLayer({
      id: 'terrain',
      elevationDecoder,
      elevationData,
      texture,
      color: [255, 255, 255]
    });
  }

  _isLayerPickable() {
    const {tileset} = this.state;
    const layerType = tileset?.tileset?.layerType;

    switch (layerType) {
      case 'IntegratedMesh':
        return false;
      default:
        return true;
    }
  }

  _renderLayers() {
    const {flattenedSublayers, token, selectedFeatureIndex, selectedTilesetBasePath, metadata, useTerrainLayer} = this.state;
    const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};
    if (token) {
      loadOptions.i3s = {...loadOptions.i3s, token};
    }

    const layers = flattenedSublayers
      .filter((sublayer) => sublayer.visibility)
      .map(
        (sublayer) =>
          new Tile3DLayer({
            id: `tile-layer-${sublayer.id}`,
            data: sublayer.url,
            loader: I3SLoader,
            onTilesetLoad: this._onTilesetLoad.bind(this),
            onTileLoad: () => this._updateStatWidgets(),
            onTileUnload: () => this._updateStatWidgets(),
            pickable: this._isLayerPickable(),
            loadOptions,
            highlightedObjectIndex:
              sublayer.url === selectedTilesetBasePath ? selectedFeatureIndex : -1
          })
      );

      if (useTerrainLayer) {
        const terrainLayer = this._renderTerrainLayer();
        layers.push(terrainLayer);
      }

      return layers;
  }

  async handleClick(info) {
    if (!info.object || info.index < 0 || !info.layer) {
      this.handleClosePanel();
      return;
    }

    const {token} = this.state;
    const options = {};

    if (token) {
      options.i3s = {token};
    }

    this.setState({isAttributesLoading: true});
    const selectedFeatureAttributes = await loadFeatureAttributes(info.object, info.index, options);
    this.setState({isAttributesLoading: false});

    const selectedTilesetBasePath = info.object.tileset.basePath;
    this.setState({
      selectedFeatureAttributes,
      selectedFeatureIndex: info.index,
      selectedTilesetBasePath
    });
  }

  _renderStats() {
    const {showBuildingExplorer, sublayers} = this.state;
    const style = {
      display: 'flex',
      top: '150px'
    };
    if (showBuildingExplorer) {
      style.display = 'none';
    }
    if (sublayers.length) {
      style.top = '200px';
    }
    // TODO - too verbose, get more default styling from stats widget?
    return <StatsWidgetContainer style={style} ref={(_) => (this._statsWidgetContainer = _)} />;
  }

  _updateSublayerVisibility(sublayer) {
    if (sublayer.layerType === '3DObject') {
      const {flattenedSublayers, sublayersUpdateCounter} = this.state;
      const flattenedSublayer = flattenedSublayers.find(
        (fSublayer) => fSublayer.id === sublayer.id
      );
      if (flattenedSublayer) {
        flattenedSublayer.visibility = sublayer.visibility;
        this.setState({sublayersUpdateCounter: sublayersUpdateCounter + 1});
        if (!sublayer.visibility) {
          this._loadedTilesets = this._loadedTilesets.filter(
            (tileset) => tileset.basePath !== flattenedSublayer.url
          );
        }
      }
    }
  }

  _renderControlPanel() {
    const {name, selectedMapStyle, sublayers, showBuildingExplorer, useTerrainLayer} = this.state;
    return (
      <ControlPanel
        name={name}
        onExampleChange={this._onSelectTileset}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        onToggleBuildingExplorer={this._onToggleBuildingExplorer}
        onUpdateSublayerVisibility={this._updateSublayerVisibility}
        selectedMapStyle={selectedMapStyle}
        sublayers={sublayers}
        isBuildingExplorerShown={showBuildingExplorer}
        useTerrainLayer={useTerrainLayer}
        toggleTerrain={this._toggleTerrain}
      >
      </ControlPanel>
    );
  }

  getTooltip() {
    const {isAttributesLoading} = this.state;

    if (isAttributesLoading) {
      // eslint-disable-next-line no-undef
      const tooltip = document.createElement('div');
      render(<FontAwesomeIcon icon={faSpinner} />, tooltip);
      return {html: tooltip.innerHTML};
    }

    return null;
  }

  handleClosePanel() {
    this.setState({selectedFeatureAttributes: null, selectedFeatureIndex: -1});
  }

  renderAttributesPanel() {
    const {selectedFeatureAttributes} = this.state;
    const title = selectedFeatureAttributes.NAME || selectedFeatureAttributes.OBJECTID;

    return (
      <AttributesPanel
        title={title}
        handleClosePanel={this.handleClosePanel}
        attributesObject={selectedFeatureAttributes}
        isControlPanelShown
      />
    );
  }

  _renderMemory() {
    const {showBuildingExplorer} = this.state;
    return (
      <StatsWidgetWrapper showMemory={!showBuildingExplorer}>
        {this._renderStats()}
      </StatsWidgetWrapper>
    );
  }

  _onToggleBuildingExplorer(isShown) {
    this.setState({showBuildingExplorer: isShown});
  }

  render() {
    const layers = this._renderLayers();
    const {viewState, selectedMapStyle, selectedFeatureAttributes} = this.state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {this._renderControlPanel()}
        {selectedFeatureAttributes && this.renderAttributesPanel()}
        {this._renderMemory()}
        <DeckGL
          layers={layers}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{
            type: MapController,
            maxPitch: 60,
            inertia: true,
            scrollZoom: {speed: 0.01, smooth: true}
          }}
          onAfterRender={() => this._updateStatWidgets()}
          getTooltip={(info) => this.getTooltip(info)}
          onClick={(info) => this.handleClick(info)}
        >
          <StaticMap mapStyle={selectedMapStyle} preventStyleDiffing />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
