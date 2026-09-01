// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {PureComponent} from 'react';
import {createRoot} from 'react-dom/client';
import {Map as BaseMap} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import styled from 'styled-components';

import {luma} from '@luma.gl/core';
import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {Tile3DSourceLayer} from '@loaders.gl/deck-layers';
import {StatsWidget} from '@probe.gl/stats-widget';
import {createDeckFullscreenWidget, createDeckStatsWidget} from '../shared/create-deck-stats-widget';

// To manage dependencies and bundle size, the app must decide which supporting loaders to bring in
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {I3SLoader} from '@loaders.gl/i3s';
import type {RequestCredential} from '@loaders.gl/loader-utils';
import {createCesiumIonCredential} from '@loaders.gl/services/authentication';

import ControlPanel from './components/control-panel.jsx';
import {loadExampleIndex, INITIAL_EXAMPLE_CATEGORY, INITIAL_EXAMPLE_NAME} from './examples';
import {INITIAL_MAP_STYLE} from './constants';
import {TileFoldExtension, type TileFoldExtensionProps} from './tile-fold-extension';

const TILESET_SERVER_URL = 'https://assets.ion.cesium.com';

const DREAM_SEQUENCE_DURATION = 11000;
const TILE_FOLD_EXTENSION = new TileFoldExtension();
const EXAMPLES_VIEWSTATE = {
  latitude: 40.04248558075302,
  longitude: -75.61213987669433
};

export const INITIAL_VIEW_STATE = {
  ...EXAMPLES_VIEWSTATE,
  pitch: 45,
  bearing: 0,
  minZoom: 2,
  maxPitch: 85,
  maxZoom: 30,
  zoom: 3 // Start zoomed out on US, tileset will center via "fly-to" on load
};

const StatsWidgetContainer = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  max-width: 270px;
  color: #fff;
  display: flex;
  flex-direction: column;
  
  > div {
    position: unset !important;
    z-index: 1 !important;
  }
`;

const ErrorContainer = styled.div`
  position: absolute;
  right: 12px;
  bottom: 12px;
  max-width: 360px;
  padding: 12px 16px;
  background: rgba(32, 32, 32, 0.92);
  color: #fff;
  z-index: 100;
  line-height: 1.4;
`;

const FoldControls = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(133, 181, 255, 0.35);
  line-height: 1.25;
`;

const FoldHeader = styled.div`
  display: grid;
  gap: 10px;
`;

const FoldTitle = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const FoldBadge = styled.span`
  color: #8ac7ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const FoldButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const FoldButton = styled.button`
  padding: 9px 10px;
  border: 1px solid rgba(138, 199, 255, 0.65);
  border-radius: 999px;
  background: rgba(36, 92, 156, 0.34);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;

  &:hover {
    background: rgba(64, 137, 218, 0.5);
  }
`;

const FoldControl = styled.label`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 3px 12px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;

  input,
  select {
    grid-column: 1 / -1;
    width: 100%;
  }

  input[type='range'] {
    accent-color: #7cbcff;
  }
`;

const FoldCredit = styled.div`
  display: grid;
  gap: 6px;
  margin: 0 0 16px;
  padding: 14px;
  border: 1px solid rgba(138, 199, 255, 0.5);
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(45, 106, 179, 0.42), rgba(18, 38, 68, 0.7));
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
  line-height: 1.4;

  strong {
    color: #fff;
    font-size: 18px;
    line-height: 1.1;
  }

  a {
    color: #8ac7ff;
    font-weight: 800;
  }
`;

type DreamKeyframe = {
  progress: number;
  foldAmount: number;
  bearingOffset: number;
  pitch: number;
  zoomOffset: number;
};

const DREAM_KEYFRAMES: DreamKeyframe[] = [
  {progress: 0, foldAmount: 0, bearingOffset: -8, pitch: 58, zoomOffset: 0.35},
  {progress: 0.22, foldAmount: 0, bearingOffset: 2, pitch: 76, zoomOffset: 1.1},
  {progress: 0.64, foldAmount: 1, bearingOffset: 18, pitch: 82, zoomOffset: 0.85},
  {progress: 0.82, foldAmount: 1, bearingOffset: 58, pitch: 74, zoomOffset: 0.45},
  {progress: 1, foldAmount: 0.92, bearingOffset: 118, pitch: 62, zoomOffset: 0.1}
];

function interpolate(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function smoothStep(amount: number): number {
  return amount * amount * (3 - 2 * amount);
}

function getDreamKeyframe(progress: number): Omit<DreamKeyframe, 'progress'> {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  let endIndex = DREAM_KEYFRAMES.findIndex((keyframe) => keyframe.progress >= clampedProgress);
  endIndex = Math.max(endIndex, 1);
  const start = DREAM_KEYFRAMES[endIndex - 1];
  const end = DREAM_KEYFRAMES[endIndex];
  const segmentProgress = smoothStep(
    (clampedProgress - start.progress) / Math.max(end.progress - start.progress, 0.0001)
  );

  return {
    foldAmount: interpolate(start.foldAmount, end.foldAmount, segmentProgress),
    bearingOffset: interpolate(start.bearingOffset, end.bearingOffset, segmentProgress),
    pitch: interpolate(start.pitch, end.pitch, segmentProgress),
    zoomOffset: interpolate(start.zoomOffset, end.zoomOffset, segmentProgress)
  };
}

type AppProps = {
  /** Whether to hide the example controls, statistics, and descriptive overlay. */
  hideChrome?: boolean;
};

type SelectedExample = {
  format?: 'i3s';
  ionAssetId?: string | number;
  ionAccessToken?: string;
  maximumScreenSpaceError?: number;
  tilesetUrl?: string;
  viewState?: {
    bearing?: number;
    latitude?: number;
    longitude?: number;
    pitch?: number;
    zoom?: number;
  };
};

type ExampleCategoryMap = Record<
  string,
  {name: string; examples: Record<string, SelectedExample>}
>;

type AppState = {
  viewState: any;
  tileset: any;
  error: string | null;
  selectedMapStyle: string;
  droppedFile: File | null;
  examplesByCategory: any;
  selectedExample: SelectedExample | null;
  category: string;
  name: string;
  foldAmount: number;
  foldBearing: number;
  foldGroundAltitude: number;
  foldHinge: number;
  foldLength: number;
  isDreamSequencePlaying: boolean;
  sequenceBaseViewState: any;
  sequenceProgress: number;
};

export default class App extends PureComponent<AppProps, AppState> {
  private _deckStatsWidget: any = null;
  private _dreamAnimationFrame: number | null = null;
  private _dreamSequenceStartedAt = 0;
  /** Cached ion credential providers, keyed by asset, so endpoint tokens survive React renders. */
  private _ionCredentials = new Map<string | number, RequestCredential>();
  private _memWidget?: StatsWidget;
  private _statsWidgetContainer: HTMLDivElement | null = null;
  private _tilesetStatsWidget?: StatsWidget;

  constructor(props: AppProps) {
    super(props);

    this.state = {
      // CURRENT VIEW POINT / CAMERA POSITIO
      viewState: INITIAL_VIEW_STATE,

      // current tileset
      tileset: null,
      error: null,

      // MAP STATE
      selectedMapStyle: INITIAL_MAP_STYLE,

      // EXAMPLE STATE
      droppedFile: null,
      examplesByCategory: null,
      selectedExample: null,
      category: INITIAL_EXAMPLE_CATEGORY,
      name: INITIAL_EXAMPLE_NAME,

      // DREAMFOLD-INSPIRED DEFORMATION
      foldAmount: 0,
      foldBearing: 0,
      foldGroundAltitude: 0,
      foldHinge: 120,
      foldLength: 1400,
      isDreamSequencePlaying: false,
      sequenceBaseViewState: INITIAL_VIEW_STATE,
      sequenceProgress: 0
    };

    this._onTilesetLoad = this._onTilesetLoad.bind(this);
    this._onTilesetChange = this._onTilesetChange.bind(this);
    this._onTilesetError = this._onTilesetError.bind(this);
  }

  componentDidMount() {
    if (!this.props.hideChrome) {
      const container = this._statsWidgetContainer || undefined;
      // TODO - This is noisy. Default formatters should already be pre-registered on the stats object
      // TODO - Revisit after upgrade luma to use most recent StatsWidget API
      this._memWidget = new StatsWidget(luma.stats.get('Memory Usage'), {
        framesPerUpdate: 1,
        formatters: {
          'GPU Memory': 'memory',
          'Buffer Memory': 'memory',
          'Renderbuffer Memory': 'memory',
          'Texture Memory': 'memory'
        },
        container
      });

      this._tilesetStatsWidget = new StatsWidget(null as any, {container});
    }

    this._loadExampleIndex();
  }

  componentWillUnmount() {
    this._stopDreamSequence();
  }

  // load the index file that lists example tilesets
  async _loadExampleIndex() {
    const examplesByCategory = (await loadExampleIndex()) as ExampleCategoryMap;
    this.setState({examplesByCategory});

    // Check if a tileset is specified in the query params
    if (this._selectTilesetFromQueryParams()) {
      return;
    }

    // if not, select the default example tileset
    const {category, name} = this.state;
    const selectedExample = examplesByCategory[category].examples[name];
    this.setState({selectedExample});
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
    this._memWidget?.update();
    this._tilesetStatsWidget?.update();
  }

  // Called by ControlPanel when user selects a new example
  _onSelectExample({
    example,
    category,
    name
  }: {
    example: SelectedExample;
    category: string;
    name: string;
  }) {
    this._stopDreamSequence();
    const preferredViewState = example.viewState
      ? {
          ...INITIAL_VIEW_STATE,
          ...example.viewState
        }
      : null;
    this.setState({
      selectedExample: example,
      category,
      name,
      error: null,
      tileset: null,
      foldAmount: 0,
      foldBearing: preferredViewState?.bearing ?? this.state.foldBearing,
      sequenceBaseViewState: preferredViewState ?? this.state.sequenceBaseViewState,
      sequenceProgress: 0,
      viewState: preferredViewState ?? this.state.viewState
    });
  }

  // Called by ControlPanel when user selects a new map style
  _onSelectMapStyle({selectedMapStyle}: {selectedMapStyle: string}) {
    this.setState({selectedMapStyle});
  }

  // Called by Tile3DLayer when a new tileset is loaded
  _onTilesetLoad(tileset: any) {
    this.setState({tileset, error: null});
    this._tilesetStatsWidget?.setStats(tileset.stats);
    this._centerViewOnTileset(tileset);
  }

  // Recenter view to cover the new tileset, with a fly-to transition
  _centerViewOnTileset(tileset: any) {
    const {cartographicCenter, zoom} = tileset;
    const preferredViewState = this.state.selectedExample?.viewState;
    const sequenceBaseViewState = {
      ...INITIAL_VIEW_STATE,
      longitude: cartographicCenter[0],
      latitude: cartographicCenter[1],
      zoom: preferredViewState?.zoom ?? zoom,
      bearing: preferredViewState?.bearing ?? INITIAL_VIEW_STATE.bearing,
      pitch: preferredViewState?.pitch ?? INITIAL_VIEW_STATE.pitch
    };
    this.setState({
      foldAmount: 0,
      foldBearing: sequenceBaseViewState.bearing,
      foldGroundAltitude: cartographicCenter[2] || 0,
      sequenceBaseViewState,
      sequenceProgress: 0,
      viewState: sequenceBaseViewState
    });
  }

  _setDreamSequenceProgress(progress: number, baseViewState = this.state.sequenceBaseViewState) {
    const keyframe = getDreamKeyframe(progress);
    this.setState({
      foldAmount: keyframe.foldAmount,
      foldBearing: baseViewState.bearing + 8,
      sequenceProgress: progress,
      viewState: {
        ...baseViewState,
        bearing: baseViewState.bearing + keyframe.bearingOffset,
        pitch: keyframe.pitch,
        zoom: baseViewState.zoom + keyframe.zoomOffset
      }
    });
  }

  _startDreamSequence() {
    if (this.state.isDreamSequencePlaying) {
      this._stopDreamSequence();
      return;
    }

    const {transitionDuration, transitionInterpolator, ...viewState} = this.state.viewState;
    const sequenceBaseViewState = {
      ...viewState,
      bearing: viewState.bearing - getDreamKeyframe(this.state.sequenceProgress).bearingOffset,
      pitch: INITIAL_VIEW_STATE.pitch,
      zoom: viewState.zoom - getDreamKeyframe(this.state.sequenceProgress).zoomOffset
    };
    this._dreamSequenceStartedAt = performance.now() - this.state.sequenceProgress * DREAM_SEQUENCE_DURATION;
    this.setState({isDreamSequencePlaying: true, sequenceBaseViewState});

    const animate = (time: number) => {
      const progress = Math.min(
        (time - this._dreamSequenceStartedAt) / DREAM_SEQUENCE_DURATION,
        1
      );
      this._setDreamSequenceProgress(progress, sequenceBaseViewState);

      if (progress < 1) {
        this._dreamAnimationFrame = requestAnimationFrame(animate);
      } else {
        this._dreamAnimationFrame = null;
        this.setState({isDreamSequencePlaying: false});
      }
    };

    this._dreamAnimationFrame = requestAnimationFrame(animate);
  }

  _stopDreamSequence() {
    if (this._dreamAnimationFrame !== null) {
      cancelAnimationFrame(this._dreamAnimationFrame);
      this._dreamAnimationFrame = null;
    }
    if (this.state?.isDreamSequencePlaying) {
      this.setState({isDreamSequencePlaying: false});
    }
  }

  _resetDreamSequence() {
    this._stopDreamSequence();
    this._setDreamSequenceProgress(0);
  }

  // Called by Tile3DLayer whenever an individual tile in the current tileset is load or unload
  _onTilesetChange(_tileHeader: unknown) {
    this._updateStatWidgets();
  }

  _onTilesetError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.setState({error: message, tileset: null});
  }

  // Called by DeckGL when user interacts with the map
  _onViewStateChange({viewState, interactionState}: {viewState: any; interactionState: any}) {
    if (interactionState?.isDragging || interactionState?.isZooming) {
      this._stopDreamSequence();
    }
    this.setState({viewState});
  }

  _renderControlPanel() {
    const {
      examplesByCategory,
      category,
      name,
      viewState,
      tileset,
      selectedMapStyle,
      foldAmount,
      foldBearing,
      foldHinge,
      foldLength,
      isDreamSequencePlaying,
      sequenceProgress
    } = this.state;
    if (!examplesByCategory) {
      return null;
    }

    return (
      <ControlPanel
        data={examplesByCategory}
        category={category}
        header={
          <FoldHeader>
            <FoldTitle>
              Tile Fold <FoldBadge>GPU deformation</FoldBadge>
            </FoldTitle>
            <FoldButtons>
              <FoldButton onClick={() => this._startDreamSequence()}>
                {isDreamSequencePlaying ? 'Pause dream' : 'Play dream'}
              </FoldButton>
              <FoldButton onClick={() => this._resetDreamSequence()}>Reset</FoldButton>
            </FoldButtons>
            <FoldCredit>
              <strong>Inspired by Dreamfold</strong>
              <span>
                Inspired by David Ronai’s extraordinary{' '}
                <a href="https://dreamfold.netlify.app" target="_blank" rel="noreferrer">
                  Dreamfold
                </a>
                . Study the{' '}
                <a
                  href="https://github.com/Makio64/dreamfold"
                  target="_blank"
                  rel="noreferrer"
                >
                  original MIT-licensed source
                </a>
                .
              </span>
            </FoldCredit>
          </FoldHeader>
        }
        name={name}
        tileset={tileset}
        onMapStyleChange={this._onSelectMapStyle.bind(this)}
        onExampleChange={this._onSelectExample.bind(this)}
        selectedMapStyle={selectedMapStyle}
      >
        <div style={{textAlign: 'center'}}>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:{' '}
          {viewState.zoom.toFixed(2)}
        </div>
        <FoldControls>
          <FoldControl>
            <span>Sequence</span>
            <span>{Math.round(sequenceProgress * 100)}%</span>
            <input
              aria-label="Dream sequence progress"
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={sequenceProgress}
              onChange={(event) => {
                this._stopDreamSequence();
                this._setDreamSequenceProgress(Number(event.target.value));
              }}
            />
          </FoldControl>
          <FoldControl>
            <span>Fold</span>
            <span>{foldAmount.toFixed(2)}</span>
            <input
              aria-label="Fold amount"
              type="range"
              min="0"
              max="1"
              step="0.001"
              value={foldAmount}
              onChange={(event) => {
                this._stopDreamSequence();
                this.setState({foldAmount: Number(event.target.value)});
              }}
            />
          </FoldControl>
          <FoldControl>
            <span>Fold length</span>
            <span>{Math.round(foldLength)} m</span>
            <input
              aria-label="Fold length"
              type="range"
              min="80"
              max="4000"
              step="10"
              value={foldLength}
              onChange={(event) => this.setState({foldLength: Number(event.target.value)})}
            />
          </FoldControl>
          <FoldControl>
            <span>Hinge</span>
            <span>{Math.round(foldHinge)} m</span>
            <input
              aria-label="Fold hinge distance"
              type="range"
              min="0"
              max="1200"
              step="10"
              value={foldHinge}
              onChange={(event) => this.setState({foldHinge: Number(event.target.value)})}
            />
          </FoldControl>
          <FoldControl>
            <span>Direction</span>
            <span>{Math.round(foldBearing)}°</span>
            <input
              aria-label="Fold bearing"
              type="range"
              min="-180"
              max="180"
              step="1"
              value={foldBearing}
              onChange={(event) => this.setState({foldBearing: Number(event.target.value)})}
            />
          </FoldControl>
        </FoldControls>
      </ControlPanel>
    );
  }

  _renderStats() {
    // TODO - too verbose, get more default styling from stats widget?
    return (
      <StatsWidgetContainer
        ref={(element) => {
          this._statsWidgetContainer = element;
        }}
      />
    );
  }

  /** Lazily creates the deck.gl stats widget used by the example. */
  _getDeckWidgets() {
    if (!this._deckStatsWidget) {
      this._deckStatsWidget = createDeckStatsWidget('3d-tiles-deck-stats');
    }

    return [createDeckFullscreenWidget('3d-tiles-fullscreen'), this._deckStatsWidget];
  }

  _renderTile3DLayer() {
    const {
      selectedExample,
      viewState,
      foldAmount,
      foldBearing,
      foldGroundAltitude,
      foldHinge,
      foldLength
    } = this.state;
    if (!selectedExample) {
      return null;
    }

    const {format, ionAssetId, ionAccessToken, maximumScreenSpaceError, tilesetUrl} =
      selectedExample;
    const dataUrl = ionAssetId ? `${TILESET_SERVER_URL}/${ionAssetId}/tileset.json` : tilesetUrl;
    if (!dataUrl) {
      return null;
    }
    const loadOptions: any = {};
    if (ionAssetId && ionAccessToken) {
      // Vite does not inject a published loaders.gl version into nested worker URLs. Decode the
      // showcase's Draco point tiles with the locally bundled parser instead of `@latest` on CDN.
      loadOptions.worker = false;
      let ionCredential = this._ionCredentials.get(ionAssetId);
      if (!ionCredential) {
        ionCredential = createCesiumIonCredential({
          accessToken: ionAccessToken,
          assetId: ionAssetId
        });
        this._ionCredentials.set(ionAssetId, ionCredential);
      }
      loadOptions.core = {credentials: [ionCredential]};
    }
    if (maximumScreenSpaceError) {
      loadOptions.tileset = {maximumScreenSpaceError};
    }

    const tileFoldProps: TileFoldExtensionProps = {
      tileFoldCenter: [viewState.longitude, viewState.latitude, foldGroundAltitude],
      tileFoldAmount: foldAmount,
      tileFoldBearing: foldBearing,
      tileFoldHinge: foldHinge,
      tileFoldLength: foldLength,
      tileFoldShape: 'fold'
    };
    const selectedLoader = format === 'i3s' ? I3SLoader : Tiles3DLoader;

    return new Tile3DSourceLayer({
      id: 'tile-3d-layer',
      data: dataUrl,
      // The candidate list is both an explicit format hint and a fallback for opaque service URLs.
      loaders: [selectedLoader],
      loadOptions,
      extensions: [TILE_FOLD_EXTENSION],
      ...tileFoldProps,
      pickable: true,
      pointSize: 2,
      getPointColor: [115, 112, 202],
      onTilesetLoad: this._onTilesetLoad,
      onTileLoad: this._onTilesetChange,
      onTileUnload: this._onTilesetChange,
      onTileError: this._onTilesetChange
    });
  }

  _renderError() {
    const {error} = this.state;
    if (!error) {
      return null;
    }

    return <ErrorContainer>{error}</ErrorContainer>;
  }

  render() {
    const {foldAmount, viewState, selectedMapStyle} = this.state;
    const tile3DLayer = this._renderTile3DLayer();

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {!this.props.hideChrome && this._renderStats()}
        {!this.props.hideChrome && this._renderControlPanel()}
        <DeckGL
          layers={[tile3DLayer]}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange.bind(this)}
          controller={{type: MapController, maxPitch: 85, inertia: true} as any}
          widgets={this.props.hideChrome ? [] : this._getDeckWidgets()}
          onAfterRender={() => this._updateStatWidgets()}
        >
          <BaseMap
            reuseMaps
            mapLib={maplibregl}
            mapStyle={selectedMapStyle}
            style={{opacity: Math.max(1 - foldAmount * 2.5, 0)}}
          />
        </DeckGL>
        {this._renderError()}
      </div>
    );
  }
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}
