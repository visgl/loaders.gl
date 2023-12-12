import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import styled from 'styled-components';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {
  MapController,
  FlyToInterpolator,
  COORDINATE_SYSTEM,
  MapView,
  LinearInterpolator
} from '@deck.gl/core';
import {TerrainLayer, Tile3DLayer} from '@deck.gl/geo-layers';
import {I3SLoader, I3SBuildingSceneLayerLoader, loadFeatureAttributes} from '@loaders.gl/i3s';
import {StatsWidget} from '@probe.gl/stats-widget';

import {lumaStats} from '@luma.gl/core';
import {load, fetchFile} from '@loaders.gl/core';

import ControlPanel from './components/control-panel';
import AttributesPanel from './components/attributes-panel';
import {parseTilesetUrlFromUrl, parseTilesetUrlParams} from './utils/url-utils';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {Color, Flex, Font} from './components/styles';
import {buildSublayersTree} from './helpers/sublayers';
import {initStats, sumTilesetsStats} from './helpers/stats';
import {getElevationByCentralTile} from './helpers/terrain-elevation';
import {INITIAL_MAP_STYLE} from './constants';
import {
  INITIAL_EXAMPLE_NAME,
  EXAMPLES,
  HERO_EXAMPLE_VIEW_STATE,
  HERO_EXAMPLE_MAP_STYLE,
  HERO_EXAMPLE_VIEW,
  HERO_EXAMPLE_URL
} from './examples';

export const TRANSITION_DURAITON = 4000;

const MAP_CONTROLLER = {
  type: MapController,
  maxPitch: 60,
  inertia: true,
  scrollZoom: {speed: 0.01, smooth: true}
};

const MAIN_VIEW = new MapView({
  id: 'main',
  controller: {
    inertia: true
  },
  farZMultiplier: 2.02
});

const INITIAL_VIEW_STATE = {
  longitude: -120,
  latitude: 34,
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 90,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

// https://github.com/tilezen/joerd/blob/master/docs/use-service.md#additional-amazon-s3-endpoints
// constants for terrain layer
const MAPZEN_TERRAIN_IMAGES = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`;
const ARCGIS_STREET_MAP_SURFACE_IMAGES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const MAPZEN_ELEVATION_DECODE_PARAMETERS = {
  rScaler: 256,
  gScaler: 1,
  bScaler: 1 / 256,
  offset: -32768
};
const TERRAIN_LAYER_MAX_ZOOM = 15;

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
  padding: 6px;
  border-radius: 8px;
  line-height: 135%;
  bottom: auto;
  width: 277px;
  left: 10px;
  max-height: calc(100% - 125px);
  overflow: auto;

  > div {
    position: unset !important;
    z-index: 1 !important;
    background-color: transparent !important;
  }
`;

class App extends PureComponent {
  constructor(props) {
    super(props);
    this._tilesetStatsWidget = null;
    this._loadedTilesets = [];
    this.state = {
      tileset: null,
      url: null,
      token: null,
      name: INITIAL_EXAMPLE_NAME,
      viewState: this.props.heroExample ? HERO_EXAMPLE_VIEW_STATE : INITIAL_VIEW_STATE,
      selectedMapStyle: this.props.heroExample ? HERO_EXAMPLE_MAP_STYLE : INITIAL_MAP_STYLE,
      selectedFeatureAttributes: null,
      selectedFeatureIndex: -1,
      selectedTilesetBasePath: null,
      isAttributesLoading: false,
      showBuildingExplorer: false,
      flattenedSublayers: [],
      sublayers: [],
      sublayersUpdateCounter: 0,
      tilesetsStats: initStats(),
      useTerrainLayer: false,
      terrainTiles: {}
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
    } else if (this.props.heroExample) {
      tileset = {url: HERO_EXAMPLE_URL};
    } else {
      tileset = EXAMPLES[INITIAL_EXAMPLE_NAME];
    }
    this.setState({tilesetsStats: initStats(tilesetUrl)});
    this._onSelectTileset(tileset);
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
      for (const sublayer of sublayersTree?.sublayers) {
        sublayer.visibility = true;
      }
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
    const metadata = await fetchFile(metadataUrl).then((resp) => resp.json());
    const flattenedSublayers = await this.getFlattenedSublayers(tilesetUrl);
    this.setState({metadata, selectedFeatureAttributes: null, flattenedSublayers});
    this._loadedTilesets = [];
    this.needTransitionToTileset = true;
    const tilesetsStats = initStats(tilesetUrl);
    this._tilesetStatsWidget.setStats(tilesetsStats);
    this.setState({tilesetsStats, showBuildingExplorer: false});
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();

    const {tilesetsStats} = this.state;
    sumTilesetsStats(this._loadedTilesets, tilesetsStats);
    this._tilesetStatsWidget.update();
  }

  _rotateCamera() {
    const {
      viewState: {bearing}
    } = this.state;

    const viewState = {
      ...this.state.viewState
    };

    this.setState({
      viewState: {
        ...viewState,
        bearing: bearing + 30,
        transitionDuration: 10000,
        transitionInterpolator: new LinearInterpolator(['bearing']),
        onTransitionEnd: this._rotateCamera.bind(this)
      }
    });
  }

  _onTilesetLoad(tileset) {
    this._loadedTilesets = [...this._loadedTilesets, tileset];
    if (this.needTransitionToTileset) {
      const {zoom, cartographicCenter} = tileset;
      const [longitude, latitude] = cartographicCenter;
      const viewport = this.currentViewport;
      let pLongitue = longitude;
      let pLatitude = latitude;
      if (viewport) {
        const {
          metadata,
          viewState: {pitch, bearing}
        } = this.state;

        const {zmin = 0} = metadata?.layers?.[0]?.fullExtent || {};
        /**
         * See image in the PR https://github.com/visgl/loaders.gl/pull/2046
         * For elevated tilesets cartographic center position of a tileset is not correct
         * to use it as viewState position because these positions are different.
         * We need to calculate projection of camera direction onto the ellipsoid surface.
         * We use this projection as offset to add it to the tileset cartographic center position.
         */
        const projection = zmin * Math.tan((pitch * Math.PI) / 180);
        /**
         * Convert to world coordinate system to shift the position on some distance in meters
         */
        const projectedPostion = viewport.projectPosition([longitude, latitude]);
        /**
         * Shift longitude
         */
        projectedPostion[0] +=
          projection *
          Math.sin((bearing * Math.PI) / 180) *
          viewport.distanceScales.unitsPerMeter[0];
        /**
         * Shift latitude
         */
        projectedPostion[1] +=
          projection *
          Math.cos((bearing * Math.PI) / 180) *
          viewport.distanceScales.unitsPerMeter[1];
        /**
         * Convert resulting coordinates to catrographic
         */
        [pLongitue, pLatitude] = viewport.unprojectPosition(projectedPostion);
      }

      const viewState = {
        ...this.state.viewState,
        longitude: pLongitue,
        latitude: pLatitude
      };

      if (this.props.heroExample) {
        this.setState({
          tileset,
          viewState: {
            ...HERO_EXAMPLE_VIEW_STATE,
            onTransitionEnd: this._rotateCamera()
          }
        });
      } else {
        this.setState({
          tileset,
          viewState: {
            ...viewState,
            zoom: zoom + 2,
            transitionDuration: TRANSITION_DURAITON,
            transitionInterpolator: new FlyToInterpolator()
          }
        });
      }

      this.needTransitionToTileset = false;
    }
  }

  _onViewStateChange({interactionState, viewState}) {
    let {
      longitude,
      latitude,
      position: [x, y, oldElevation]
    } = viewState;
    const {terrainTiles} = this.state;
    const viewportCenterTerrainElevation =
      getElevationByCentralTile(longitude, latitude, terrainTiles) || 0;
    let cameraTerrainElevation = null;
    if (this.currentViewport) {
      const cameraPosition = this.currentViewport.unprojectPosition(
        this.currentViewport.cameraPosition
      );
      cameraTerrainElevation =
        getElevationByCentralTile(cameraPosition[0], cameraPosition[1], terrainTiles) || 0;
    }
    let elevation =
      cameraTerrainElevation === null || viewportCenterTerrainElevation > cameraTerrainElevation
        ? viewportCenterTerrainElevation
        : cameraTerrainElevation;
    if (!interactionState.isZooming) {
      if (oldElevation - elevation > 5) {
        elevation = oldElevation - 5;
      } else if (elevation - oldElevation > 5) {
        elevation = oldElevation + 5;
      }
    }
    this.setState({viewState: {...viewState, position: [0, 0, elevation]}});
  }

  _onSelectMapStyle({selectedMapStyle}) {
    this.setState({selectedMapStyle});
  }

  _toggleTerrain() {
    const {useTerrainLayer} = this.state;
    this.setState({useTerrainLayer: !useTerrainLayer});
  }

  _onTerrainTileLoad(tile) {
    const {terrainTiles} = this.state;
    const {
      bbox: {east, north, south, west}
    } = tile;
    this.setState({
      terrainTiles: {
        ...terrainTiles,
        [`${east};${north};${south};${west}`]: tile
      }
    });
  }

  _renderTerrainLayer() {
    return new TerrainLayer({
      id: 'terrain',
      maxZoom: TERRAIN_LAYER_MAX_ZOOM,
      elevationDecoder: MAPZEN_ELEVATION_DECODE_PARAMETERS,
      elevationData: MAPZEN_TERRAIN_IMAGES,
      texture: ARCGIS_STREET_MAP_SURFACE_IMAGES,
      onTileLoad: (tile) => this._onTerrainTileLoad(tile),
      color: [255, 255, 255]
    });
  }

  _isLayerPickable() {
    const {tileset} = this.state;
    const layerType = tileset?.tileset?.layerType;
    if (this.props.heroExample) {
      return false;
    }
    switch (layerType) {
      case 'IntegratedMesh':
        return false;
      default:
        return true;
    }
  }

  _renderLayers() {
    const {
      flattenedSublayers,
      token,
      selectedFeatureIndex,
      selectedTilesetBasePath,
      useTerrainLayer
    } = this.state;
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
      ></ControlPanel>
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
    const {viewState, selectedMapStyle, selectedFeatureAttributes, useTerrainLayer} = this.state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {!this.props.hideControlPanel && this._renderControlPanel()}
        {selectedFeatureAttributes && this.renderAttributesPanel()}
        {!this.props.hideStats && this._renderMemory()}
        <DeckGL
          layers={layers}
          viewState={viewState}
          views={[!this.props.heroExample ? MAIN_VIEW : HERO_EXAMPLE_VIEW]}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={!this.props.heroExample ? MAP_CONTROLLER : false}
          onAfterRender={() => this._updateStatWidgets()}
          getTooltip={(info) => this.getTooltip(info)}
          onClick={(info) => this.handleClick(info)}
        >
          {({viewport}) => {
            this.currentViewport = viewport;
          }}
          {!useTerrainLayer && (
            <Map reuseMaps mapLib={maplibregl} mapStyle={selectedMapStyle} preventStyleDiffing />
          )}
        </DeckGL>
      </div>
    );
  }
}

const appFactory = (
  AppComponent,
  extraProps: {hideControlPanel?: boolean; hideStats?: boolean; heroExample?: boolean}
) => {
  return (props) => <AppComponent {...props} {...extraProps} />;
};

export const AppWithPanels = appFactory(App, {});
export const BareApp = appFactory(App, {hideControlPanel: true, hideStats: true});
// app for hero example (website: main page)
export const HeroExample = appFactory(App, {
  hideControlPanel: true,
  hideStats: true,
  heroExample: true
});
export function renderToDOM(container) {
  render(<AppWithPanels />, container);
}
export default AppWithPanels;
