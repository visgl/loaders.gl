import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {HuePicker, MaterialPicker} from 'react-color';

import {lumaStats} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {
  FlyToInterpolator,
  View,
  MapView,
  WebMercatorViewport,
  COORDINATE_SYSTEM
} from '@deck.gl/core';
import {LineLayer, ScatterplotLayer} from '@deck.gl/layers';
import {Tile3DLayer} from '@deck.gl/geo-layers';

import {load} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {ImageLoader} from '@loaders.gl/images';
import {StatsWidget} from '@probe.gl/stats-widget';

import {buildMinimapData} from './helpers/build-minimap-data';
import {INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';
import AttributesPanel from './components/attributes-panel';
import DebugPanel from './components/debug-panel';
import ControlPanel from './components/control-panel';
import SemanticValidator from './components/semantic-validator';

import {
  INITIAL_MAP_STYLE,
  CONTRAST_MAP_STYLES,
  INITIAL_TILE_COLOR_MODE,
  INITIAL_BOUNDING_VOLUME_COLOR_MODE,
  INITIAL_BOUNDING_VOLUME_TYPE
} from './constants';
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
  wireframe: false
};
const STATS_WIDGET_STYLE = {
  wordBreak: 'break-word',
  padding: 12,
  zIndex: '10000',
  maxWidth: 300,
  background: '#000',
  color: '#fff',
  alignSelf: 'flex-start'
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
    controller: true
  }),
  new MapView({
    id: 'minimap',

    // Position on top of main map
    x: '80%',
    y: '80%',
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

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this._tilesetStatsWidget = null;
    this._colorMap = null;
    this._uvDebugTexture = null;
    this.state = {
      url: null,
      token: null,
      tileset: null,
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
      selectedTileId: null,
      coloredTilesMap: {},
      warnings: []
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
    this._onSelectTileset(tileset);
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

  async _onSelectTileset(tileset) {
    const params = parseTilesetUrlParams(tileset.url, tileset);
    const {tilesetUrl, token, name, metadataUrl} = params;
    this.setState({tilesetUrl, name, token});
    this.handleClearWarnings();
    const metadata = await fetch(metadataUrl).then((resp) => resp.json());
    this.setState({metadata});
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();
    this._tilesetStatsWidget.update();
  }

  _onTileLoad(tile) {
    this.removeFeatureIdsFromTile(tile);
    this._updateStatWidgets();
    this.validateTile(tile);
    this.setState({frameNumber: this.state.tileset.frameNumber});
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

    this.setState({
      tileset,
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

    const {
      debugOptions: {minimapViewport, loadTiles}
    } = this.state;
    const viewportTraversersMap = {main: 'main', minimap: minimapViewport ? 'minimap' : 'main'};
    tileset.setOptions({
      viewportTraversersMap,
      loadTiles
    });
    this._tilesetStatsWidget.setStats(tileset.stats);
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
      this.setState({coloredTilesMap: {}, selectedTileId: null});
    }

    const {
      tileset,
      debugOptions: {showUVDebugTexture}
    } = this.state;
    if (debugOptions.showUVDebugTexture !== showUVDebugTexture) {
      if (debugOptions.showUVDebugTexture) {
        selectDebugTextureForTileset(tileset, this._uvDebugTexture);
      } else {
        selectOriginalTextureForTileset(tileset);
      }
    }

    const {minimapViewport, loadTiles} = debugOptions;
    const viewportTraversersMap = {main: 'main', minimap: minimapViewport ? 'minimap' : 'main'};
    tileset.setOptions({
      viewportTraversersMap,
      loadTiles
    });
    tileset.update();
    this.setState({debugOptions});
  }

  // Remove featureIds to enable instance picking mode.
  removeFeatureIdsFromTile(tile) {
    delete tile.content.featureIds;
    // Remove segmentationData after i3s-content-worker will be published
    delete tile.content.segmentationData;
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
    const {selectedTileId, coloredTilesMap, debugOptions} = this.state;
    const {tileColorMode} = debugOptions;

    return (
      this._colorMap.getColor(tile, {
        coloredBy: tileColorMode,
        selectedTileId,
        coloredTilesMap
      }) || DEFAULT_COLOR
    );
  }

  _renderMainOnMinimap() {
    const {
      tileset,
      debugOptions: {minimapViewport}
    } = this.state;
    if (!minimapViewport) {
      return null;
    }
    let data = [];
    if (tileset) {
      data = buildMinimapData(tileset.tiles);
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
      tilesetUrl,
      token,
      viewState,
      debugOptions: {boundingVolume, boundingVolumeType, pickable, wireframe},
      tileset,
      normalsDebugData,
      trianglesPercentage,
      normalsLength
    } = this.state;
    const loadOptions = {};

    if (token) {
      loadOptions.token = token;
    }

    this._colorMap = this._colorMap || new ColorMap();
    const tiles = (tileset || {}).tiles || [];
    const viewport = new WebMercatorViewport(viewState.main);
    const frustumBounds = getFrustumBounds(viewport);

    return [
      new Tile3DLayer({
        data: tilesetUrl,
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
      }),
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
        modelMatrix: normalsDebugData.modelMatrix,
        coordinateOrigin: normalsDebugData.cartographicOrigin,
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        getWidth: 1
      }),
      this._renderMainOnMinimap()
    ];
  }

  _renderDebugPanel() {
    const {warnings, debugOptions} = this.state;
    const isClearButtonDisabled = !warnings.length || !debugOptions.semanticValidator;

    return (
      <DebugPanel
        onDebugOptionsChange={this._setDebugOptions}
        clearWarnings={this.handleClearWarnings}
        isClearButtonDisabled={isClearButtonDisabled}
        debugTextureImage={UV_DEBUG_TEXTURE_URL}
        debugOptions={debugOptions}
      >
        {this._renderStats()}
      </DebugPanel>
    );
  }

  _renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return <div style={STATS_WIDGET_STYLE} ref={(_) => (this._statsWidgetContainer = _)} />;
  }

  _renderControlPanel() {
    const {name, tileset, token, metadata, selectedMapStyle} = this.state;
    return (
      <ControlPanel
        tileset={tileset}
        name={name}
        metadata={metadata}
        token={token}
        onExampleChange={this._onSelectTileset}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        selectedMapStyle={selectedMapStyle}
      />
    );
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
    // TODO add more tile info to panel.
    const tileInfo = getTileDebugInfo(info.object);
    this.setState({tileInfo, selectedTileId: info.object.id, normalsDebugData: []});
  }

  handleClosePanel() {
    this.setState({tileInfo: null, selectedTileId: null, normalsDebugData: []});
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
      padding: '6px 12px',
      color: 'white',
      background: isResetButtonDisabled ? 'gray' : 'red',
      alignItems: 'center',
      height: '20px',
      marginTop: '10px',
      cursor: isResetButtonDisabled ? 'auto' : 'pointer'
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
      tileset,
      normalsDebugData,
      trianglesPercentage,
      normalsLength
    } = this.state;
    const isShowColorPicker = debugOptions.tileColorMode === COLORED_BY.CUSTOM;
    const tileId = tileInfo['Tile Id'];
    const tileSelectedColor = makeRGBObjectFromColor(coloredTilesMap[tileId]);
    const isResetButtonDisabled = !coloredTilesMap[tileId];
    const currenTile = tileset._tiles[tileId];
    const title = `Tile: ${tileId}`;

    return (
      <AttributesPanel
        title={title}
        handleClosePanel={this.handleClosePanel}
        attributesObject={tileInfo}
        selectTileColor={this.handleSelectTileColor}
      >
        <TileValidator
          tile={currenTile}
          showNormals={Boolean(normalsDebugData.length)}
          trianglesPercentage={trianglesPercentage}
          normalsLength={normalsLength}
          handleShowNormals={this.handleShowNormals}
          handleChangeTrianglesPercentage={this.handleChangeTrianglesPercentage}
          handleChangeNormalsLength={this.handleChangeNormalsLength}
        />
        {isShowColorPicker && (
          <div>
            <h3>{TILE_COLOR_SELECTOR}</h3>
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
    return <SemanticValidator warnings={warnings} />;
  }

  render() {
    const layers = this._renderLayers();
    const {selectedMapStyle, tileInfo, debugOptions} = this.state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {this._renderDebugPanel()}
        {tileInfo ? this._renderAttributesPanel() : this._renderControlPanel()}
        {debugOptions.semanticValidator && this._renderSemanticValidator()}
        <DeckGL
          layers={layers}
          viewState={this._getViewState()}
          views={this._getViews()}
          layerFilter={this._layerFilter}
          onViewStateChange={this._onViewStateChange.bind(this)}
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
