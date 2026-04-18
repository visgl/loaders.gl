// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';

import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';

import {ImageSourceLayer, VectorSourceLayer} from '@loaders.gl/deck-layers';
import {createDataSource} from '@loaders.gl/core';
import {
  _ArcGISFeatureServerSourceLoader,
  _ArcGISImageServerSourceLoader,
  WFSSourceLoader,
  WMSSourceLoader
} from '@loaders.gl/wms';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import {ExamplePanel, Example, MetadataViewer} from './components/example-panel';
import {INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';
import {createDeckStatsWidget} from '../shared/create-deck-stats-widget';

export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const VIEW_STATE = {
  longitude: -122.4,
  latitude: 37.74,
  zoom: 9,
  minZoom: 1,
  maxZoom: 20,
  pitch: 0,
  bearing: 0
};

export const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

/** Application props (used by website MDX pages to configure example */
type AppProps = {
  /** Controls which examples are shown */
  format?: string;
  /** Any informational text to display in the overlay */
  children?: React.Children;
};

const SOURCE_FACTORIES = [
  WMSSourceLoader,
  _ArcGISImageServerSourceLoader,
  _ArcGISFeatureServerSourceLoader,
  WFSSourceLoader
];

type SourceData = any;

/** Application state */
type AppState = {
  /** Currently selected example. */
  example: Example | null;
  /** Currently active source instance. */
  source: SourceData | null;
  /** Metadata loaded from the active source. */
  metadata: string;
  /** Current view state. */
  viewState: Record<string, number>;
  loading: boolean;
  error: string | null;
};

export default function App(props: AppProps = {}) {
  const [state, setState] = useState<AppState>({
    example: null,
    source: null,
    metadata: '',
    viewState: INITIAL_VIEW_STATE,
    loading: true,
    error: null,
  });

  const layers = renderLayer(state.example, state.source);
  const widgets = useMemo(() => [createDeckStatsWidget('wms-stats')], []);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        layers={layers}
        viewState={state.viewState}
        widgets={widgets}
        onViewStateChange={onViewStateChange}
        onError={(error: Error) => setState((state) => ({...state, error: error.message}))}
        getTooltip={getTooltip}
        controller={{type: MapController, maxPitch: 85}}
      >
        <ExamplePanel
          examples={EXAMPLES}
          format={props.format}
          initialCategoryName={INITIAL_CATEGORY_NAME}
          initialExampleName={INITIAL_EXAMPLE_NAME}
          onExampleChange={onExampleChange}
          loading={state.loading}
        >
          <MetadataViewer metadata={state.metadata} />
          {state.error ? <div style={{color: 'red'}}>{state.error}</div> : ''}
          <LngLatZoomView viewState={state.viewState} />
        </ExamplePanel>
        <Map reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} preventStyleDiffing />
      </DeckGL>
    </div>
  );

  function onViewStateChange({viewState}) {
    setState((state) => ({
      ...state,
      viewState
    }));
  }

  function getTooltip({object}) {
    if (!object || !object.properties) {
      return null;
    }

    const entries = Object.entries(object.properties).filter(
      ([, value]) => value !== null && value !== ''
    );
    if (!entries.length) {
      return null;
    }

    return {
      text: entries
        .slice(0, 5)
        .map(([key, value]) => `${formatLabel(key)}: ${String(value)}`)
        .join('\n')
    };
  }

  async function onExampleChange({example}) {
    const {viewState} = example;
    const newViewState = {...state.viewState, ...viewState};
    const source = createDataSource(example.url, SOURCE_FACTORIES, {
      type: example.type
    });

    setState((state) => ({
      ...state,
      example,
      source,
      viewState: newViewState,
      metadata: 'Loading metadata...',
      loading: true,
      error: null
    }));

    try {
      const metadata = await source.getMetadata({formatSpecificMetadata: false});
      const title = metadata?.title || metadata?.name || example.url;
      globalThis.document.title = String(title);
      setState((state) => ({
        ...state,
        metadata: JSON.stringify(metadata, null, 2)
      }));
    } catch (error) {
      setState((state) => ({
        ...state,
        metadata: '',
        error: `Could not load metadata: ${error instanceof Error ? error.message : String(error)}`
      }));
    }
  }

  function renderLayer(example: Example | null, source: SourceData | null) {
    if (!example || !source) {
      return null;
    }

    if (example.type === 'arcgis-feature-server' || example.type === 'wfs') {
      return [
        new VectorSourceLayer({
          id: `${example.type}-${example.url}`,
          data: source,
          layers: example.layers || [],
          onLoadingStateChange: isLoading =>
            setState((state) => ({...state, loading: isLoading})),
          onError: (error: Error) =>
            setState((state) => ({...state, loading: false, error: error.message})),
          geoJsonLayerProps: {
            pickable: true,
            autoHighlight: true,
            ...example.layerProps
          }
        })
      ];
    }

    return [
      new ImageSourceLayer({
        id: `${example.type}-${example.url}`,
        data: source,
        layers: example.layers || [],
        srs:
          example.type === 'wms' || example.type === 'arcgis-image-server'
            ? 'EPSG:4326'
            : 'auto',
        onLoadingStateChange: isLoading =>
          setState((state) => ({...state, loading: isLoading})),
        onImageLoadError: (_requestId: number, error: Error) =>
          setState((state) => ({...state, loading: false, error: error.message})),
        ...example.layerProps
      })
    ];
  }
}

function LngLatZoomView({viewState}) {
  if (false) {
    // viewState?.longitude === undefined) {
    return (
      <pre style={{textAlign: 'center', margin: 0}}>
        long/lat: {viewState.longitude.toFixed(5)}, {viewState.latitude.toFixed(5)}, zoom:{' '}
        {viewState.zoom.toFixed(2)}
      </pre>
    );
  }
  return <></>;
}

export function renderToDOM(container = document.body) {
  createRoot(container).render(<App />);
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/*
export default function App(props: AppProps = {}) {
  const [state, setState] = useState<AppState>({
    imageSource: null,
    viewState: INITIAL_VIEW_STATE,
    layerProps: {},
    layers: [],
    error: null,
    loading: true,
    metadata: ''
    });

  const wmsLayer = state.imageService &&
    new WMSLayer({
      data: state.imageService, // new WMSService({url: service, wmsParameters: {transparent: true}}),
      layers: state.layers,

      pickable: true,

      ...state.layerProps,

      onImageLoadStart: () => this.setState(state => ({...state, loading: true})),
      onImageLoad: () => this.setState(state => ({...state, loading: false})),

      onMetadataLoadStart: () => this.setState(state => {...state, metadata: 'Loading metadata...'}),
      onMetadataLoad: (metadata: ImageSourceMetadata) => {
        globalThis.document.title = metadata.title || 'WMS';
        this.setState(state => {...state, metadata});
      },

      onClick: async ({bitmap, layer}) => {
        if (this.state.featureInfo) {
          this.setState(state => {...state, featureInfo: null});
        } else if (bitmap) {
          const x = bitmap.pixel[0];
          const y = bitmap.pixel[1];
          const featureInfo = await layer.getFeatureInfoText(x, y);
          console.log('Click in imagery layer', x, y, featureInfo);
          this.setState(state => {...state, featureInfo});
        }
      }
    });


  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ExamplePanel
        title="Tileset Metadata"
        examples={EXAMPLES}
        format={props.format}
        initialCategoryName={INITIAL_CATEGORY_NAME}
        initialExampleName={INITIAL_EXAMPLE_NAME}
        onExampleChange={onExampleChange}
      >
        {props.children}
        {state.error ? <div style={{color: 'red'}}>{state.error}</div> : ''}
        <pre style={{textAlign: 'center', margin: 0}}>
        </pre>
        <MetadataViewer metadata={state.metadata ? JSON.stringify(state.metadata, null, 2) : ''} />

      </ExamplePanel>

      <DeckGL
        layers={[wmsLayer]}
        views={new MapView({repeat: true})}
        initialViewState={state.viewState}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} />
        <Attributions attributions={state.metadata?.attributions || []} />
      </DeckGL>
    </div>
  );

  async function onExampleChange(args: {
    categoryName: string;
    exampleName: string;
    example: Example;
  }) {
    const {categoryName, exampleName, example} = args;

    const url = example.data;
    try {
      let imageSource = createImageSource(example);

      setState((state) => ({
        ...state,
        imageSource,
        layers: example.layers || [],
        metadata: null
      }));

      (async () => {
        const metadata = await imageSource.getMetadata();
        let initialViewState = {...state.viewState, ...example.viewState};
        // initialViewState = adjustViewStateToMetadata(initialViewState, metadata);

        setState((state) => ({
          ...state,
          initialViewState,
          metadata
        }));
      })();
    } catch (error) {
      console.error('Failed to load data', url, error);
      setState((state) => ({...state, error: `Could not load ${exampleName}: ${error.message}`}));
    }
  }

  function getTooltip({object}) {
    return state?.featureInfo && {
      html: `<h2>Feature Info</h2><div>${state.featureInfo}</div>`,
      style: {
        color: '#EEE',
        backgroundColor: '#000',
        fontSize: '0.8em',
        whiteSpace: 'pre-line'
      }
    }
  }
}

function createImageSource(example: Example) {
  const {url, format, layers, tileSize, tileFormat} = example;
  return new WMSSourceLoader({
    url,
    format,
    layers,
    tileSize,
    tileFormat
  });
}
*/


// TODO - cut
/*
  export default class App2 extends PureComponent {

  _renderControlPanel() {
    const {selectedExample, viewState, selectedCategory, loading, metadata, error} = this.state;

    return (
      <ControlPanel
        examples={EXAMPLES}
        selectedExample={selectedExample}
        selectedCategory={selectedCategory}
        onExampleChange={this._onExampleChange}
        loading={loading}
        metadata={metadata}
      >
        {error ? <div style={{color: 'red'}}>{error}</div> : ''}
        <pre style={{textAlign: 'center', margin: 0}}>
          long/lat: {viewState.longitude.toFixed(5)}, {viewState.latitude.toFixed(5)}, zoom:{' '}
          {viewState.zoom.toFixed(2)}
        </pre>
      </ControlPanel>
    );
  }

  render() {
    const {viewState} = this.state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        {this._renderControlPanel()}
        <DeckGL
          layers={this._renderLayer()}
          viewState={viewState}
          onViewStateChange={this._onViewStateChange}
          onError={(error: Error) => this.setState(state => {...state, error: error.message})}
          controller={{type: MapController, maxPitch: 85}}
          getTooltip={({object}) =>
            this.state?.featureInfo && {
              html: `<h2>Feature Info</h2><div>${this.state.featureInfo}</div>`,
              style: {
                color: '#EEE',
                backgroundColor: '#000',
                fontSize: '0.8em',
                whiteSpace: 'pre-line'
              }
            }
          }
        >
          <Map reuseMaps mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} preventStyleDiffing />
        </DeckGL>
      </div>
    );
  }
}*/
