// loaders.gl, MIT license

import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react/typed';
import {MapController} from '@deck.gl/core/typed';
import {ImageryLayer} from './imagery-layer';
import type {_ImageSourceMetadata as ImageSourceMetadata} from '@loaders.gl/wms';

import ControlPanel from './components/control-panel';
import {INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME, INITIAL_MAP_STYLE, EXAMPLES} from './examples';

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
        <div style={{textAlign: 'center'}}>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:{' '}
          {viewState.zoom.toFixed(2)}
        </div>
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
      new ImageryLayer({
        data: service,
        serviceType,
        layers,

        pickable: true,
        opacity,

        onImageLoadStart: () => this.setState({loading: true}),
        onImageLoadComplete: () => this.setState({loading: false}),

        onMetadataLoadStart: () => this.setState({metadata: 'Loading metadata...'}),
        onMetadataLoadComplete: (metadata: ImageSourceMetadata) => {
          globalThis.document.title = metadata.title || 'WMS';
          this.setState({metadata: JSON.stringify(metadata, null, 2)});
        },

        onClick: async ({bitmap, layer}) => {
          if (bitmap) {
            const x = bitmap.pixel[0];
            const y = bitmap.pixel[1];
            // @ts-expect-error
            const featureInfo = await layer.getFeatureInfo(x, y);
            console.log('Click in imagery layer', x, y, featureInfo);
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
            object && {
              html: `<h2>${object.name}</h2><div>${object.message}</div>`,
              style: {
                backgroundColor: '#f00',
                fontSize: '0.8em'
              }
            }
          }
        >
          <StaticMap mapStyle={INITIAL_MAP_STYLE} preventStyleDiffing />
        </DeckGL>
      </div>
    );
  }
}

export function renderToDOM(container = document.body) {
  render(<App />, container);
}
