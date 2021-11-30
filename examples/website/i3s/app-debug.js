import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {HuePicker, MaterialPicker} from 'react-color';
import styled from 'styled-components';

import {lumaStats} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {
  FlyToInterpolator,
  MapController,
  View,
  MapView,
  WebMercatorViewport,
  COORDINATE_SYSTEM
} from '@deck.gl/core';
import {LineLayer, ScatterplotLayer} from '@deck.gl/layers';
import {TerrainLayer} from '@deck.gl/geo-layers';

import {load} from '@loaders.gl/core';
import {I3SLoader, I3SBuildingSceneLayerLoader} from '@loaders.gl/i3s';
import {ImageLoader} from '@loaders.gl/images';
import {StatsWidget} from '@probe.gl/stats-widget';

import {buildMinimapData} from './helpers/build-minimap-data';
import AttributesPanel from './components/attributes-panel';
import DebugPanel from './components/debug-panel';
import ControlPanel from './components/control-panel';
import MapInfoPanel from './components/map-info';
import SemanticValidator from './components/semantic-validator';
import ToolBar from './components/tool-bar';

import {
  INITIAL_MAP_STYLE,
  CONTRAST_MAP_STYLES,
  INITIAL_TILE_COLOR_MODE,
  INITIAL_BOUNDING_VOLUME_COLOR_MODE,
  INITIAL_BOUNDING_VOLUME_TYPE
} from './constants';
import {INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';
import {COLORED_BY, makeRGBObjectFromColor, getRGBValueFromColorObject} from './color-map';
import {getFrustumBounds} from './frustum-utils';
import BoundingVolumeLayer from './bounding-volume-layer';
import ColorMap from './color-map';
import AttributesTooltip from './components/attributes-tooltip';
import {getTileDebugInfo, getShortTileDebugInfo, validateTile} from './tile-debug';
import {parseTilesetUrlFromUrl, parseTilesetUrlParams} from './url-utils';
import TileValidator from './components/tile-validator';
import {
  generateBinaryNormalsDebugData,
  getNormalSourcePosition,
  getNormalTargetPosition
} from './normals-utils';
import {
  selectDebugTextureForTile,
  selectDebugTextureForTileset,
  selectOriginalTextureForTile,
  selectOriginalTextureForTileset
} from './utils/texture-selector-utils';
import {Color, Flex, Font} from './components/styles';
import {buildSublayersTree} from './helpers/sublayers';
import {initStats, sumTilesetsStats} from './helpers/stats';

import {default as Tile3DLayer} from './deckgl/tile-3d-layer-tmp';

const TRANSITION_DURAITON = 4000;
const DEFAULT_TRIANGLES_PERCENTAGE = 30; // Percentage of triangles to show normals for.
const DEFAULT_NORMALS_LENGTH = 20; // Normals length in meters
const NORMALS_COLOR = [255, 0, 0];
const DEFAULT_COLOR = [255, 255, 255];
const DEFAULT_BG_OPACITY = 100;
const UV_DEBUG_TEXTURE_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/images/uv-debug-texture.jpg';

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

const INITIAL_DEBUG_OPTIONS_STATE = {
  // Show minimap
  minimap: true,
  // Use separate traversal for the minimap viewport
  minimapViewport: false,
  // Show bounding volumes
  boundingVolume: false,
  // Tile coloring mode selector
  tileColorMode: INITIAL_TILE_COLOR_MODE,
  // Bounding volume coloring mode selector
  boundingVolumeColorMode: INITIAL_BOUNDING_VOLUME_COLOR_MODE,
  // Bounding volume geometry shape selector
  boundingVolumeType: INITIAL_BOUNDING_VOLUME_TYPE,
  // Select tiles with a mouse button
  pickable: false,
  // Load tiles after traversal.
  // Use this to freeze loaded tiles and see on them from different perspective
  loadTiles: true,
  // Show the semantic validation warnings window
  semanticValidator: false,
  // Use "uv-debug-texture" texture to check UV coordinates
  showUVDebugTexture: false,
  // Enable/Disable wireframe mode
  wireframe: false,
  // Show statswidget
  showMemory: false,
  // Show control panel
  controlPanel: true,
  // Show debug panel
  debugPanel: false,
  // Show map info
  showFullInfo: false
};

const MATERIAL_PICKER_STYLE = {
  default: {
    material: {
      height: 'auto',
      width: 'auto'
    }
  }
};

const VIEWS = [
  new MapView({
    id: 'main',
    controller: {inertia: true}
  }),
  new MapView({
    id: 'minimap',

    // Position on top of main map
    x: '79%',
    y: '79%',
    width: '20%',
    height: '20%',

    // Minimap is overlaid on top of an existing view, so need to clear the background
    clear: true,

    controller: {
      maxZoom: 9,
      minZoom: 9,
      dragRotate: false,
      keyboard: false
    }
  })
];

const TILE_COLOR_SELECTOR = 'Tile Color Selector';

const HEADER_STYLE = {
  color: 'white'
};

const CURSOR_STYLE = {
  cursor: 'pointer'
};

const StatsWidgetWrapper = styled.div`
  display: ${(props) => (props.showMemory ? 'inherit' : 'none')};
`;

const StatsWidgetContainer = styled.div`
  ${Flex}
  ${Color}
  ${Font}
  color: rgba(255, 255, 255, .6);
  z-index: 3;
  top: 10px;
  right: 10px;
  word-break: break-word;
  padding: 24px;
  border-radius: 8px;
  width: 250px;
  max-height: calc(100% - 10px);
  line-height: 135%;
  overflow: auto;

  @media (max-width: 768px) {
    top: ${(props) => (props.renderControlPanel ? '85px' : '10px')};
    max-height: ${(props) =>
      props.renderControlPanel ? 'calc(100% - 145px)' : 'calc(100% - 70px)'};
    right: 0px;
    border-radius: 0px;
  }
`;

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this._tilesetStatsWidget = null;
    this._colorMap = null;
    this._uvDebugTexture = null;
    this._loadedTilesets = [];
    this.state = {
      url: null,
      token: null,
      mainTileset: null,
      frameNumber: 0,
      name: INITIAL_EXAMPLE_NAME,
      viewState: {
        main: INITIAL_VIEW_STATE,
        minimap: {
          latitude: INITIAL_VIEW_STATE.latitude,
          longitude: INITIAL_VIEW_STATE.longitude,
          zoom: 9,
          pitch: 0,
          bearing: 0
        }
      },
      selectedMapStyle: INITIAL_MAP_STYLE,
      debugOptions: {...INITIAL_DEBUG_OPTIONS_STATE},
      normalsDebugData: [],
      trianglesPercentage: DEFAULT_TRIANGLES_PERCENTAGE,
      normalsLength: DEFAULT_NORMALS_LENGTH,
      tileInfo: null,
      selectedTile: null,
      coloredTilesMap: {},
      warnings: [],
      flattenedSublayers: [],
      sublayers: [],
      sublayersUpdateCounter: 0,
      tilesetsStats: initStats(),
      useTerrainLayer: false
    };
    this._onSelectTileset = this._onSelectTileset.bind(this);
    this._setDebugOptions = this._setDebugOptions.bind(this);
    this._layerFilter = this._layerFilter.bind(this);
    this.handleClosePanel = this.handleClosePanel.bind(this);
    this.handleSelectTileColor = this.handleSelectTileColor.bind(this);
    this.handleClearWarnings = this.handleClearWarnings.bind(this);
    this.handleShowNormals = this.handleShowNormals.bind(this);
    this.handleChangeTrianglesPercentage = this.handleChangeTrianglesPercentage.bind(this);
    this.handleChangeNormalsLength = this.handleChangeNormalsLength.bind(this);
    this._updateSublayerVisibility = this._updateSublayerVisibility.bind(this);
    this._onToggleBuildingExplorer = this._onToggleBuildingExplorer.bind(this);
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
    let mainTileset;
    const tilesetUrl = parseTilesetUrlFromUrl();
    if (tilesetUrl) {
      mainTileset = {url: tilesetUrl};
    } else {
      mainTileset = EXAMPLES[INITIAL_EXAMPLE_NAME];
    }
    this.setState({tilesetsStats: initStats(tilesetUrl)});
    this._onSelectTileset(mainTileset);
    load(UV_DEBUG_TEXTURE_URL, ImageLoader).then((image) => (this._uvDebugTexture = image));
  }

  _getViewState() {
    const {viewState, debugOptions} = this.state;
    return debugOptions.minimap ? viewState : {main: viewState.main};
  }

  _getViews() {
    const {debugOptions} = this.state;
    return debugOptions.minimap ? VIEWS : [VIEWS[0]];
  }

  async _onSelectTileset(mainTileset) {
    const params = parseTilesetUrlParams(mainTileset.url, mainTileset);
    const {tilesetUrl, token, name, metadataUrl} = params;
    this.setState({tilesetUrl, name, token, sublayers: []});
    this.handleClearWarnings();
    const metadata = await fetch(metadataUrl).then((resp) => resp.json());
    const flattenedSublayers = await this.getFlattenedSublayers(tilesetUrl);
    this.setState({metadata, tileInfo: null, normalsDebugData: [], flattenedSublayers});
    this._loadedTilesets = [];
    this.needTransitionToTileset = true;
    const tilesetsStats = initStats(tilesetUrl);
    this._tilesetStatsWidget.setStats(tilesetsStats);
    this.setState({tilesetsStats});
  }

  /**
   * Tries to get Building Scene Layer sublayer urls if exists.
   * @param {string} tilesetUrl
   * @returns {string[]} Sublayer urls or tileset url.
   * TODO Add filtration mode for sublayers which were selected by user.
   */
  async getFlattenedSublayers(tilesetUrl) {
    try {
      const mainTileset = await load(tilesetUrl, I3SBuildingSceneLayerLoader);
      const sublayersTree = buildSublayersTree(mainTileset.header.sublayers);
      this.setState({sublayers: sublayersTree.sublayers});
      const sublayers = mainTileset?.sublayers.filter((sublayer) => sublayer.name !== 'Overview');
      return sublayers;
    } catch (e) {
      return [{url: tilesetUrl, visibility: true}];
    }
  }

  /**
   * Get elevation data for TerrainLayer
   * Docs - https://github.com/tilezen/joerd/tree/master/docs
   */
   getTerrainLayerData() {
    // https://github.com/tilezen/joerd/blob/master/docs/use-service.md#additional-amazon-s3-endpoints
    const MAPZEN_TERRAIN_IMAGE = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`
    const ARCGIS_STREET_MAP_SURFACE_IMAGE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const MAX_ZOOM = 15;

    // https://github.com/tilezen/joerd/blob/master/docs/formats.md#terrarium
    const MAPZEN_ELEVATION_DECODER = {
      rScaler: 256,
      gScaler: 1,
      bScaler: 1 / 256,
      offset: -32768
    };

    return {
      elevationData: MAPZEN_TERRAIN_IMAGE,
      texture: ARCGIS_STREET_MAP_SURFACE_IMAGE,
      elevationDecoder: MAPZEN_ELEVATION_DECODER,
      maxZoom: MAX_ZOOM
    };
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();

    const {tilesetsStats} = this.state;
    sumTilesetsStats(this._loadedTilesets, tilesetsStats);
    this._tilesetStatsWidget.update();
  }

  _onTileLoad(tile) {
    this.removeFeatureIdsFromTile(tile);
    this._updateStatWidgets();
    this.validateTile(tile);

    if (this.state.debugOptions.showUVDebugTexture) {
      selectDebugTextureForTile(tile, this._uvDebugTexture);
    } else {
      selectOriginalTextureForTile(tile);
    }
  }

  _onTileUnload() {
    this._updateStatWidgets();
  }

  _onTilesetLoad(tileset) {
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter;

    this._loadedTilesets = [...this._loadedTilesets, tileset];
    if (this.needTransitionToTileset) {
      this.setState({
        viewState: {
          main: {
            ...this.state.viewState.main,
            zoom: zoom + 2.5,
            longitude,
            latitude,
            transitionDuration: TRANSITION_DURAITON,
            transitionInterpolator: new FlyToInterpolator()
          },
          minimap: {
            ...this.state.viewState.minimap,
            longitude,
            latitude
          }
        },
        debugOptions: {...INITIAL_DEBUG_OPTIONS_STATE}
      });
      this.needTransitionToTileset = false;
    }

    const {
      debugOptions: {minimapViewport, loadTiles}
    } = this.state;
    const viewportTraversersMap = {main: 'main', minimap: minimapViewport ? 'minimap' : 'main'};
    tileset.setOptions({
      viewportTraversersMap,
      loadTiles
    });
  }

  _onViewStateChange({viewState, viewId}) {
    const oldViewState = this.state.viewState;
    if (viewId === 'minimap') {
      this.setState({
        viewState: {
          main: {
            ...oldViewState.main,
            longitude: viewState.longitude,
            latitude: viewState.latitude
          },
          minimap: viewState
        }
      });
    } else {
      this.setState({
        viewState: {
          main: viewState,
          minimap: {
            ...oldViewState.minimap,
            longitude: viewState.longitude,
            latitude: viewState.latitude
          }
        }
      });
    }
  }

  _onSelectMapStyle({selectedMapStyle}) {
    this.setState({selectedMapStyle});
  }

  _setDebugOptions(newDebugOptions) {
    const {debugOptions: oldDebugOptions} = this.state;
    const debugOptions = {...oldDebugOptions, ...newDebugOptions};

    if (debugOptions.tileColorMode !== COLORED_BY.CUSTOM) {
      this.setState({coloredTilesMap: {}, selectedTile: null});
    }

    const {
      debugOptions: {showUVDebugTexture}
    } = this.state;
    if (debugOptions.showUVDebugTexture !== showUVDebugTexture) {
      this._loadedTilesets.forEach((tileset) => {
        if (debugOptions.showUVDebugTexture) {
          selectDebugTextureForTileset(tileset, this._uvDebugTexture);
        } else {
          selectOriginalTextureForTileset(tileset);
        }
      });
    }

    const {minimapViewport, loadTiles} = debugOptions;
    const viewportTraversersMap = {main: 'main', minimap: minimapViewport ? 'minimap' : 'main'};

    this._loadedTilesets.forEach((tileset) => {
      tileset.setOptions({
        viewportTraversersMap,
        loadTiles
      });
      tileset.update();
    });

    const {debugPanel} = this.state;
    const {debugPanel: newDebugPanel} = debugOptions;
    if (debugPanel !== newDebugPanel && newDebugPanel) {
      debugOptions.buildingExplorer = false;
    }

    this.setState({debugOptions});
  }

  // Remove featureIds to enable instance picking mode.
  removeFeatureIdsFromTile(tile) {
    delete tile.content.featureIds;
  }

  validateTile(tile) {
    const {warnings} = this.state;
    const newWarnings = validateTile(tile);

    if (newWarnings.length) {
      this.setState({
        warnings: [...warnings, ...newWarnings]
      });
    }
  }

  getBoundingVolumeColor(tile) {
    const {boundingVolumeColorMode} = this.state.debugOptions;
    const color =
      this._colorMap.getColor(tile, {coloredBy: boundingVolumeColorMode}) || DEFAULT_COLOR;

    return [...color, DEFAULT_BG_OPACITY];
  }

  getMeshColor(tile) {
    const {selectedTile, coloredTilesMap, debugOptions} = this.state;
    const {tileColorMode} = debugOptions;

    return (
      this._colorMap.getColor(tile, {
        coloredBy: tileColorMode,
        selectedTileId: selectedTile?.id,
        coloredTilesMap
      }) || DEFAULT_COLOR
    );
  }

  _getAllTilesFromTilesets(tilesets) {
    const allTiles = tilesets.map((tileset) => tileset.tiles);
    return allTiles.flat();
  }

  _toggleTerrain() {
    const {useTerrainLayer} = this.state;
    this.setState({useTerrainLayer: !useTerrainLayer});
  }

  _renderTerrainLayer() {
    const {elevationDecoder, texture, elevationData, maxZoom} = this.getTerrainLayerData();

    return new TerrainLayer({
      id: 'terrain',
      elevationDecoder,
      maxZoom,
      elevationData,
      texture,
      color: [255, 255, 255]
    });
  }

  _renderMainOnMinimap() {
    const {
      debugOptions: {minimapViewport}
    } = this.state;
    if (!minimapViewport) {
      return null;
    }
    let data = [];

    if (this._loadedTilesets.length) {
      const tiles = this._getAllTilesFromTilesets(this._loadedTilesets);
      data = buildMinimapData(tiles);
    }
    return new ScatterplotLayer({
      id: 'main-on-minimap',
      data,
      pickable: false,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 1,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      getPosition: (d) => d.coordinates,
      getRadius: (d) => d.radius,
      getFillColor: (d) => [255, 140, 0, 100],
      getLineColor: (d) => [0, 0, 0, 120]
    });
  }

  _renderLayers() {
    const {
      flattenedSublayers,
      token,
      viewState,
      debugOptions: {boundingVolume, boundingVolumeType, pickable, wireframe},
      normalsDebugData,
      trianglesPercentage,
      normalsLength,
      useTerrainLayer
    } = this.state;
    const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};
    if (token) {
      loadOptions.i3s = {...loadOptions.i3s, token};
    }

    this._colorMap = this._colorMap || new ColorMap();
    const tiles = this._getAllTilesFromTilesets(this._loadedTilesets);
    const viewport = new WebMercatorViewport(viewState.main);
    const frustumBounds = getFrustumBounds(viewport);

    const tile3dLayers = flattenedSublayers
      .filter((sublayer) => sublayer.visibility)
      .map(
        (sublayer) =>
          new Tile3DLayer({
            id: `tile-layer-${sublayer.id}`,
            data: sublayer.url,
            loader: I3SLoader,
            onTilesetLoad: this._onTilesetLoad.bind(this),
            onTileLoad: this._onTileLoad.bind(this),
            onTileUnload: this._onTileUnload.bind(this),
            loadOptions,
            pickable,
            autoHighlight: true,
            _subLayerProps: {
              mesh: {
                wireframe
              }
            },
            _getMeshColor: this.getMeshColor.bind(this)
          })
      );

    if (useTerrainLayer) {
      const terrainLayer = this._renderTerrainLayer();
      tile3dLayers.push(terrainLayer);
    }

    return [
      ...tile3dLayers,
      new LineLayer({
        id: 'frustum',
        data: frustumBounds,
        getSourcePosition: (d) => d.source,
        getTargetPosition: (d) => d.target,
        getColor: (d) => d.color,
        getWidth: 2
      }),
      new BoundingVolumeLayer({
        id: 'bounding-volume-layer',
        visible: boundingVolume,
        tiles,
        getBoundingVolumeColor: this.getBoundingVolumeColor.bind(this),
        boundingVolumeType
      }),
      new LineLayer({
        id: 'normals-debug',
        data: normalsDebugData,
        getSourcePosition: (_, {index, data}) =>
          getNormalSourcePosition(index, data, trianglesPercentage),
        getTargetPosition: (_, {index, data}) =>
          getNormalTargetPosition(index, data, trianglesPercentage, normalsLength),
        getColor: () => NORMALS_COLOR,
        modelMatrix: normalsDebugData.cartographicModelMatrix,
        coordinateOrigin: normalsDebugData.cartographicOrigin,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        getWidth: 1
      }),
      this._renderMainOnMinimap()
    ];
  }

  _renderStats() {
    const {
      debugOptions: {controlPanel}
    } = this.state;
    // TODO - too verbose, get more default styling from stats widget?
    return (
      <StatsWidgetContainer
        renderControlPanel={controlPanel}
        ref={(_) => (this._statsWidgetContainer = _)}
      />
    );
  }

  _renderMemory() {
    const {
      debugOptions: {showMemory}
    } = this.state;
    return <StatsWidgetWrapper showMemory={showMemory}>{this._renderStats()}</StatsWidgetWrapper>;
  }

  _renderDebugPanel() {
    const {
      debugOptions,
      debugOptions: {controlPanel},
      sublayers
    } = this.state;

    return (
      <DebugPanel
        onDebugOptionsChange={this._setDebugOptions}
        clearWarnings={this.handleClearWarnings}
        debugTextureImage={UV_DEBUG_TEXTURE_URL}
        debugOptions={debugOptions}
        renderControlPanel={controlPanel}
        hasBuildingExplorer={Boolean(sublayers.length)}
      ></DebugPanel>
    );
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

  _onToggleBuildingExplorer(isShown) {
    const newDebugOptions = {buildingExplorer: isShown};
    if (isShown) {
      newDebugOptions.debugPanel = !isShown;
    }
    this._setDebugOptions(newDebugOptions);
  }

  _renderControlPanel() {
    const {
      name,
      selectedMapStyle,
      sublayers,
      debugOptions: {buildingExplorer},
      useTerrainLayer
    } = this.state;
    return (
      <ControlPanel
        debugMode
        name={name}
        onExampleChange={this._onSelectTileset}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        onToggleBuildingExplorer={this._onToggleBuildingExplorer}
        onUpdateSublayerVisibility={this._updateSublayerVisibility}
        selectedMapStyle={selectedMapStyle}
        sublayers={sublayers}
        isBuildingExplorerShown={buildingExplorer}
        useTerrainLayer={useTerrainLayer}
        toggleTerrain={this._toggleTerrain}
      />
    );
  }

  _renderInfo() {
    const {
      debugOptions: {showFullInfo},
      token,
      metadata,
      debugOptions: {minimap}
    } = this.state;
    return (
      <MapInfoPanel
        showFullInfo={showFullInfo}
        metadata={metadata}
        token={token}
        isMinimapShown={minimap}
      />
    );
  }

  _renderToolPanel() {
    const {debugOptions} = this.state;
    return <ToolBar onDebugOptionsChange={this._setDebugOptions} debugOptions={debugOptions} />;
  }

  _layerFilter({layer, viewport}) {
    const {
      debugOptions: {minimapViewport}
    } = this.state;
    const {id: viewportId} = viewport;
    const {
      id: layerId,
      props: {viewportIds = null}
    } = layer;
    if (viewportId !== 'minimap' && (layerId === 'frustum' || layerId === 'main-on-minimap')) {
      // only display frustum in the minimap
      return false;
    }
    if (minimapViewport && viewportId === 'minimap' && layerId.indexOf('obb-debug-') !== -1) {
      return false;
    }
    if (viewportIds && !viewportIds.includes(viewportId)) {
      return false;
    }
    if (viewportId === 'minimap' && layerId === 'normals-debug') {
      return false;
    }
    if (viewportId === 'minimap' && layerId.indexOf('terrain') !== -1) {
      return false;
    }
    return true;
  }

  getTooltip(info) {
    if (!info.object || info.index < 0 || !info.layer) {
      return null;
    }
    const tileInfo = getShortTileDebugInfo(info.object);
    // eslint-disable-next-line no-undef
    const tooltip = document.createElement('div');
    render(<AttributesTooltip data={tileInfo} />, tooltip);

    return {html: tooltip.innerHTML};
  }

  handleClick(info) {
    if (!info.object) {
      this.handleClosePanel();
      return;
    }
    const tileInfo = getTileDebugInfo(info.object);
    this.setState({tileInfo, normalsDebugData: [], selectedTile: info.object});
  }

  handleClosePanel() {
    this.setState({tileInfo: null, selectedTile: null, normalsDebugData: []});
  }

  handleSelectTileColor(tileId, selectedColor) {
    const {coloredTilesMap} = this.state;
    const color = getRGBValueFromColorObject(selectedColor);
    const updatedMap = {
      ...coloredTilesMap,
      ...{[tileId]: color}
    };
    this.setState({coloredTilesMap: updatedMap});
  }

  handleResetColor(tileId) {
    const {coloredTilesMap} = this.state;
    const updatedColoredMap = {...coloredTilesMap};
    delete updatedColoredMap[tileId];

    this.setState({coloredTilesMap: updatedColoredMap});
  }

  getResetButtonStyle(isResetButtonDisabled) {
    return {
      display: 'flex',
      padding: '4px 16px',
      borderRadius: '8px',
      alignItems: 'center',
      height: '27px',
      fontWeight: 'bold',
      marginTop: '10px',
      cursor: isResetButtonDisabled ? 'auto' : 'pointer',
      color: isResetButtonDisabled ? 'rgba(255,255,255,.6)' : 'white',
      background: isResetButtonDisabled ? '#0E111A' : '#4F52CC'
    };
  }

  handleClearWarnings() {
    this.setState({warnings: []});
  }

  handleShowNormals(tile) {
    const {normalsDebugData} = this.state;

    this.setState({
      normalsDebugData: !normalsDebugData.length ? generateBinaryNormalsDebugData(tile) : []
    });
  }

  handleChangeTrianglesPercentage(tile, newValue) {
    const {normalsDebugData} = this.state;

    if (normalsDebugData.length) {
      this.setState({normalsDebugData: generateBinaryNormalsDebugData(tile)});
    }
    const percent = this.validateTrianglesPercentage(newValue);

    this.setState({trianglesPercentage: percent});
  }

  handleChangeNormalsLength(tile, newValue) {
    const {normalsDebugData} = this.state;

    if (normalsDebugData.length) {
      this.setState({normalsDebugData: generateBinaryNormalsDebugData(tile)});
    }

    this.setState({normalsLength: newValue});
  }

  validateTrianglesPercentage(newValue) {
    if (newValue < 0) {
      return 1;
    } else if (newValue > 100) {
      return 100;
    }
    return newValue;
  }

  _renderAttributesPanel() {
    const {
      tileInfo,
      debugOptions,
      coloredTilesMap,
      normalsDebugData,
      trianglesPercentage,
      normalsLength,
      selectedTile
    } = this.state;
    const isShowColorPicker = debugOptions.tileColorMode === COLORED_BY.CUSTOM;
    const tileId = tileInfo['Tile Id'];
    const tileSelectedColor = makeRGBObjectFromColor(coloredTilesMap[tileId]);
    const isResetButtonDisabled = !coloredTilesMap[tileId];
    const title = `Tile: ${selectedTile.id}`;

    return (
      <AttributesPanel
        title={title}
        handleClosePanel={this.handleClosePanel}
        attributesObject={tileInfo}
        selectTileColor={this.handleSelectTileColor}
        isControlPanelShown={debugOptions.controlPanel}
      >
        <TileValidator
          tile={selectedTile}
          showNormals={Boolean(normalsDebugData.length)}
          trianglesPercentage={trianglesPercentage}
          normalsLength={normalsLength}
          handleShowNormals={this.handleShowNormals}
          handleChangeTrianglesPercentage={this.handleChangeTrianglesPercentage}
          handleChangeNormalsLength={this.handleChangeNormalsLength}
        />
        {isShowColorPicker && (
          <div style={CURSOR_STYLE}>
            <h3 style={HEADER_STYLE}>{TILE_COLOR_SELECTOR}</h3>
            <HuePicker
              width={'auto'}
              color={tileSelectedColor}
              onChange={(color) => this.handleSelectTileColor(tileId, color)}
            />
            <MaterialPicker
              styles={MATERIAL_PICKER_STYLE}
              color={tileSelectedColor}
              onChange={(color) => this.handleSelectTileColor(tileId, color)}
            />
            <button
              disabled={isResetButtonDisabled}
              style={this.getResetButtonStyle(isResetButtonDisabled)}
              onClick={() => this.handleResetColor(tileId)}
            >
              Reset
            </button>
          </div>
        )}
      </AttributesPanel>
    );
  }

  _renderSemanticValidator() {
    const {warnings} = this.state;
    return <SemanticValidator warnings={warnings} clearWarnings={this.handleClearWarnings} />;
  }

  render() {
    const layers = this._renderLayers();
    const {
      selectedMapStyle,
      selectedTile,
      tileInfo,
      debugOptions: {debugPanel, showFullInfo, controlPanel, semanticValidator}
    } = this.state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {this._renderToolPanel()}
        {this._renderMemory()}
        {debugPanel && this._renderDebugPanel()}
        {showFullInfo && this._renderInfo()}
        {controlPanel && this._renderControlPanel()}
        {selectedTile && tileInfo && this._renderAttributesPanel()}
        {semanticValidator && this._renderSemanticValidator()}
        <DeckGL
          layers={layers}
          viewState={this._getViewState()}
          views={this._getViews()}
          layerFilter={this._layerFilter}
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
          <StaticMap reuseMaps mapStyle={selectedMapStyle} preventStyleDiffing={true} />
          <View id="minimap">
            <StaticMap
              reuseMaps
              mapStyle={CONTRAST_MAP_STYLES[selectedMapStyle]}
              preventStyleDiffing={true}
            />
          </View>
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container) {
  render(<App />, container);
}
