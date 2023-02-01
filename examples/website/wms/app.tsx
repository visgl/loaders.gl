// loaders.gl, MIT license

import React, {PureComponent} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';

import DeckGL from '@deck.gl/react/typed';
import {MapController} from '@deck.gl/core/typed';
import {ImageryLayer} from './imagery-layer';

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
  constructor(props) {
    super(props);

    this.state = {
      // CURRENT VIEW POINT / CAMERA POSITIO
      viewState: INITIAL_VIEW_STATE,

      // EXAMPLE STATE
      selectedExample: INITIAL_EXAMPLE_NAME,
      selectedCategory: INITIAL_CATEGORY_NAME,
      uploadedFile: null
    };

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
    const {selectedExample, viewState, selectedCategory} = this.state;

    return (
      <ControlPanel
        examples={EXAMPLES}
        selectedExample={selectedExample}
        selectedCategory={selectedCategory}
        onExampleChange={this._onExampleChange}
      >
        <div style={{textAlign: 'center'}}>
          long/lat: {viewState.longitude.toFixed(5)},{viewState.latitude.toFixed(5)}, zoom:
          {viewState.zoom.toFixed(2)}
        </div>
      </ControlPanel>
    );
  }

  _renderLayer() {
    const {selectedExample, selectedCategory, uploadedFile} = this.state;

    let layerData;
    if (uploadedFile) {
      layerData = uploadedFile;
    } else if (EXAMPLES[selectedCategory][selectedExample]) {
      layerData = EXAMPLES[selectedCategory][selectedExample].data;
    } else {
      layerData = EXAMPLES[INITIAL_CATEGORY_NAME][INITIAL_EXAMPLE_NAME].data;
    }

    return [
      new ImageryLayer({serviceUrl: 'https://ows.terrestris.de/osm/service'})
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
          controller={{type: MapController, maxPitch: 85}}
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
