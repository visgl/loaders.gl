import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import styled from 'styled-components';

import {lumaStats} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator} from '@deck.gl/core';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {I3SLoader, loadFeatureAttributes} from '@loaders.gl/i3s';
import {StatsWidget} from '@probe.gl/stats-widget';

import ControlPanel from './components/control-panel';
import AttributesPanel from './components/attributes-panel';
import {parseTilesetUrlFromUrl, parseTilesetUrlParams} from './url-utils';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faSpinner} from '@fortawesome/free-solid-svg-icons';
import {INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';
import {INITIAL_MAP_STYLE} from './constants';
import { Color, Flex, Font } from './components/styles';

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
  top: 125px;
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
    this.state = {
      url: null,
      token: null,
      name: INITIAL_EXAMPLE_NAME,
      viewState: INITIAL_VIEW_STATE,
      selectedMapStyle: INITIAL_MAP_STYLE,
      selectedFeatureAttributes: null,
      selectedFeatureIndex: -1,
      isAttributesLoading: false,
      showMemory: true
    };
    this._onSelectTileset = this._onSelectTileset.bind(this);
    this.handleClosePanel = this.handleClosePanel.bind(this);
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
  }

  async _onSelectTileset(tileset) {
    const params = parseTilesetUrlParams(tileset.url, tileset);
    const {tilesetUrl, token, name, metadataUrl} = params;
    this.setState({tilesetUrl, name, token});
    const metadata = await fetch(metadataUrl).then((resp) => resp.json());
    this.setState({metadata, selectedFeatureAttributes: null});
  }

  // Updates stats, called every frame
  _updateStatWidgets() {
    this._memWidget.update();
    this._tilesetStatsWidget.update();
  }

  _onTilesetLoad(tileset) {
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter;

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

    this._tilesetStatsWidget.setStats(tileset.stats);
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _onSelectMapStyle({selectedMapStyle}) {
    this.setState({selectedMapStyle});
  }

  _renderLayers() {
    const {tilesetUrl, token, selectedFeatureIndex} = this.state;
    // TODO: support compressed textures in GLTFMaterialParser
    const loadOptions = {};
    if (token) {
      loadOptions.i3s = {token};
    }
    return [
      new Tile3DLayer({
        data: tilesetUrl,
        loader: I3SLoader,
        onTilesetLoad: this._onTilesetLoad.bind(this),
        onTileLoad: () => this._updateStatWidgets(),
        onTileUnload: () => this._updateStatWidgets(),
        pickable: true,
        loadOptions,
        highlightedObjectIndex: selectedFeatureIndex
      })
    ];
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
    this.setState({selectedFeatureAttributes, selectedFeatureIndex: info.index});
  }

  _renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return <StatsWidgetContainer ref={(_) => (this._statsWidgetContainer = _)} />;
  }

  _renderControlPanel() {
    const {name, selectedMapStyle, showMemory} = this.state;
    return (
      <ControlPanel
        name={name}
        onExampleChange={this._onSelectTileset}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        selectedMapStyle={selectedMapStyle}>
        <StatsWidgetWrapper showMemory={showMemory}>
          {this._renderStats()}
        </StatsWidgetWrapper>
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

  renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return <StatsWidgetContainer ref={(_) => (this._statsWidgetContainer = _)} />;
  }

  _renderMemory() {
    const {showMemory} = this.state;
    return (
      <StatsWidgetWrapper showMemory={showMemory}>
       {this._renderStats()}
      </StatsWidgetWrapper>
    );
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
          controller={{type: MapController, maxPitch: 85, inertia: true}}
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
