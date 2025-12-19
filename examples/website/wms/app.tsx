// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
// import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react';
import {MapView, MapController} from '@deck.gl/core';
import {_WMSLayer as WMSLayer} from '@deck.gl/geo-layers';

import type {ImageSource, ImageSourceMetadata} from '@loaders.gl/loader-utils';
import {createDataSource} from '@loaders.gl/core';
import {_ArcGISImageServerSource, WMSSource} from '@loaders.gl/wms';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import {ExamplePanel, Example, MetadataViewer} from './components/example-panel';
import {INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';

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

/** Application state */
type AppState = {
  /** Currently active tile source */
  imageSource: ImageSource;
  /** Metadata loaded from active tile source */
  metadata: string;
  /**Current view state */
  viewState: Record<string, number>;
  loading: boolean;
  error: string | null;
  featureInfo: any;
  example: Example;
};

export default function App(props: AppProps = {}) {
  const [state, setState] = useState<AppState>({
    imageSource: null,
    metadata: '',
    viewState: INITIAL_VIEW_STATE,
    // TODO - handle errors
    loading: true,
    error: null
  });

  const {imageSource, metadata} = state;
  const wmsLayer = renderLayer(state.example);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        layers={wmsLayer}
        viewState={state.viewState}
        onViewStateChange={onViewStateChange}
        onError={(error: Error) => setState((state) => ({...state, error: error.message}))}
        controller={{type: MapController, maxPitch: 85}}
        getTooltip={({object}) =>
          state?.featureInfo && {
            html: `<h2>Feature Info</h2><div>${state.featureInfo}</div>`,
            style: {
              color: '#EEE',
              backgroundColor: '#000',
              fontSize: '0.8em',
              whiteSpace: 'pre-line'
            }
          }
        }
      >
        <ExamplePanel
          examples={EXAMPLES}
          initialCategoryName={INITIAL_CATEGORY_NAME}
          initialExampleName={INITIAL_EXAMPLE_NAME}
          onExampleChange={onExampleChange}
          loading={state.loading}
        >
          <MetadataViewer metadata={metadata} />
          {state.error ? <div style={{color: 'red'}}>{state.error}</div> : ''}
          <LngLatZoomView viewState={state.viewState} />
        </ExamplePanel>
        <Map reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} preventStyleDiffing />
      </DeckGL>
    </div>
  );

  function onViewStateChange({viewState}) {
    setState((state) => ({...state, viewState}));
  }

  function onExampleChange({example}) {
    const {viewState} = example;
    const newViewState = {...state.viewState, ...viewState};

    const imageSource = createDataSource<ImageSource>(
      example.url,
      [WMSSource, _ArcGISImageServerSource],
      {type: 'wms'}
    );

    setState((state) => ({...state, example, viewState: newViewState, imageSource}));
  }

  function renderLayer(example: Example) {
    if (!example) {
      return null;
    }

    // @ts-expect-error
    const {url, type, layers, opacity = 1} = example;

    return [
      new WMSLayer({
        data: url, // new WMSSource({url: service, wmsParameters: {transparent: true}}),
        serviceType: type,
        layers,

        pickable: true,
        opacity,

        onImageLoadStart: () => setState((state) => ({...state, loading: true})),
        onImageLoad: () => setState((state) => ({...state, loading: false})),

        onMetadataLoadStart: () =>
          setState((state) => ({...state, metadata: 'Loading metadata...'})),
        onMetadataLoad: (metadata: ImageSourceMetadata) => {
          globalThis.document.title = metadata.title || 'WMS';
          setState((state) => ({...state, metadata: JSON.stringify(metadata, null, 2)}));
        },

        // @ts-expect-error
        onClick: async ({bitmap, layer}) => {
          if (this.state.featureInfo) {
            setState((state) => ({...state, featureInfo: null}));
          } else if (bitmap) {
            const x = bitmap.pixel[0];
            const y = bitmap.pixel[1];
            const featureInfo = await layer.getFeatureInfoText(x, y);
            console.log('Click in imagery layer', x, y, featureInfo);
            setState((state) => ({...state, featureInfo}));
          }
        }
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
  return new WMSSource({
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
