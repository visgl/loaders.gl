// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
// import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {_WMSLayer as WMSLayer} from '@deck.gl/geo-layers';

import type {ImageSource, ImageSourceMetadata} from '@loaders.gl/loader-utils';
import {createDataSource} from '@loaders.gl/core';
import {_ArcGISImageServerSource, WMSSource} from '@loaders.gl/wms';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
  
import {ExamplePanel, Example, MetadataViewer} from './components/example-panel';
import {INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';

export const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

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
  loading: true;
  error: string | '';
  featureInfo: any;
  example: Example,
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

    const {viewState} = state;

    return (
      <div style={{position: 'relative', height: '100%'}}>
        <DeckGL
          layers={wmsLayer}
          viewState={viewState}
          onViewStateChange={onViewStateChange}
          onError={(error: Error) => setState(state => ({...state, error: error.message}))}
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
            <pre style={{textAlign: 'center', margin: 0}}>
              long/lat: {viewState.longitude.toFixed(5)}, {viewState.latitude.toFixed(5)}, zoom:{' '}
              {viewState.zoom.toFixed(2)}
            </pre>
          </ExamplePanel>
          <Map reuseMaps mapLib={maplibregl} mapStyle={MAP_STYLE} preventStyleDiffing />
        </DeckGL>
      </div>
    );
  

  function onViewStateChange({viewState}) {
    setState({viewState});
  }

  function onExampleChange({example}) {
    const {viewState} = example;

    const imageSource = createDataSource<ImageSource>(
      example.url,
      [WMSSource, _ArcGISImageServerSource],
      {type: 'wms'}
    );
  
    debugger
    setState(state => ({...state, example, viewState, imageSource}));
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

        onImageLoadStart: () => setState(state => ({...state, loading: true})),
        onImageLoad: () => setState(state => ({...state, loading: false})),

        onMetadataLoadStart: () => setState(state => ({...state, metadata: 'Loading metadata...'})),
        onMetadataLoad: (metadata: ImageSourceMetadata) => {
          globalThis.document.title = metadata.title || 'WMS';
          setState(state => ({...state, metadata: JSON.stringify(metadata, null, 2)}));
        },

        // @ts-expect-error
        onClick: async ({bitmap, layer}) => {
          if (this.state.featureInfo) {
            setState(state => ({...state, featureInfo: null}));
          } else if (bitmap) {
            const x = bitmap.pixel[0];
            const y = bitmap.pixel[1];
            const featureInfo = await layer.getFeatureInfoText(x, y);
            console.log('Click in imagery layer', x, y, featureInfo);
            setState(state => ({...state, featureInfo}));
          }
        }
      })
    ];
  }
}

export function renderToDOM(container = document.body) {
  createRoot(container).render(<App />);
}


// EXPERIMENT WITH SERVICE CATALOG SOURCES
// import {_getArcGISServices, CSWService} from '@loaders.gl/wms';

// export async function loadCSWCatalog(url: string = 'https://gamone.whoi.edu/csw') {
//   const catalogService = new CSWService({url}); // https://deims.org/pycsw/catalogue'});
//   const services = await catalogService.getServiceDirectory();
//   console.log(JSON.stringify(services, null, 2));

//   const examples = EXAMPLES['gamone'] = {};
//   let i = 0;
//   for (const service of services) {
//     examples[`${service.name.replace('-', '')}`] = {
//       service: service.url,
//       serviceType: 'wms',
//       layers: ['THREDDS'],
//       viewState: {
//         longitude: -122.4,
//         latitude: 37.74,
//         zoom: 9,
//         minZoom: 1,
//         maxZoom: 20,
//         pitch: 0,
//         bearing: 0
//       }
//     }
//   }
// }

// loadCSWCatalog();

// export async function loadArcGISCatalog(url: string = 'https://gamone.whoi.edu/csw') {
//   // const services = await _getArcGISServices('https://sampleserver6.arcgisonline.com/arcgis/rest/services'); // /Water_Network_Base_Map/MapServer
//   // console.log(JSON.stringify(services, null, 2));
// }
