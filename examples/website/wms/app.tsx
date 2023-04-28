// loaders.gl, MIT license

import React, {PureComponent} from 'react';
import {createRoot} from 'react-dom/client';
// import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react/typed';
import {MapController} from '@deck.gl/core/typed';
import {_WMSLayer as WMSLayer} from '@deck.gl/geo-layers/typed';

import type {ImageSourceMetadata} from '@loaders.gl/wms';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
  
import ControlPanel from './components/control-panel';
import {INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE, EXAMPLES} from './examples';

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

export const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

export default class App extends PureComponent {
  state: {
    viewState;
    selectedCategory: string;
    selectedExample: string;
    loading: true;
    metadata: string | '';
    error: string | '';
  } = {
    // CURRENT VIEW POINT / CAMERA POSITIO
    viewState: INITIAL_VIEW_STATE,

    // EXAMPLE STATE
    selectedCategory: INITIAL_CATEGORY_NAME,
    selectedExample: INITIAL_EXAMPLE_NAME,

    loading: true,
    metadata: ''
  };

  constructor(props) {
    super(props);

    this._onExampleChange = this._onExampleChange.bind(this);
    this._onViewStateChange = this._onViewStateChange.bind(this);
  }

  _onViewStateChange({viewState}) {
    this.setState({viewState});
  }

  _onExampleChange({selectedCategory, selectedExample, example}) {
    const {viewState} = example;
    this.setState({selectedCategory, selectedExample, viewState});
  }

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

  _renderLayer() {
    const {selectedExample, selectedCategory} = this.state;

    const example =
      EXAMPLES[selectedCategory][selectedExample] ||
      EXAMPLES[INITIAL_CATEGORY_NAME][INITIAL_EXAMPLE_NAME];
    if (!example) {
      return;
    }

    const {service, serviceType, layers, opacity = 1} = EXAMPLES[selectedCategory][selectedExample];

    return [
      new WMSLayer({
        data: service,
        serviceType,
        layers,

        pickable: true,
        opacity,

        onImageLoadStart: () => this.setState({loading: true}),
        onImageLoad: () => this.setState({loading: false}),

        onMetadataLoadStart: () => this.setState({metadata: 'Loading metadata...'}),
        onMetadataLoad: (metadata: ImageSourceMetadata) => {
          globalThis.document.title = metadata.title || 'WMS';
          this.setState({metadata: JSON.stringify(metadata, null, 2)});
        },

        onClick: async ({bitmap, layer}) => {
          if (this.state.featureInfo) {
            this.setState({featureInfo: null});
          } else if (bitmap) {
            const x = bitmap.pixel[0];
            const y = bitmap.pixel[1];
            const featureInfo = await layer.getFeatureInfoText(x, y);
            console.log('Click in imagery layer', x, y, featureInfo);
            this.setState({featureInfo});
          }
        }
      })
    ];
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
          onError={(error: Error) => this.setState({error: error.message})}
          controller={{type: MapController, maxPitch: 85}}
          getTooltip={({object}) =>
            this.state.featureInfo && {
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
}

export function renderToDOM(container = document.body) {
  createRoot(container).render(<App />);
}
