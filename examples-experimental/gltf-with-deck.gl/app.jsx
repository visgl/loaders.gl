// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {PureComponent} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';

import {MapController, COORDINATE_SYSTEM} from '@deck.gl/core';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';

import {GLTFLoader} from '@loaders.gl/scene/gltf';
import {registerLoaders} from '@loaders.gl/core';

import loadIBLEnvironment from './environment';
import * as maplibregl from 'maplibre-gl';

maplibregl.setWorkerUrl(new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString());

// To manage dependencies/bundle size, the app decides which loaders to bring in
registerLoaders([GLTFLoader]);


const GLTF_BASE_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/';

const GLTF_DEFAULT_MODEL = `${GLTF_BASE_URL}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`;

export const INITIAL_VIEW_STATE = {
  longitude: -75.61213987669433,
  latitude: 40.04248558075302,
  zoom: 12,
  bearing: 0,
  pitch: 45,
  maxPitch: 60
};

const MODEL_ORIGIN = [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude, 0];

export default class App extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      iblEnvironment: null
    };
  }

  componentDidMount() {
    // TODO, implement loading of new glTF on drop
    // fileDrop(this._deckRef.deckCanvas, (promise, file) => {});
  }

  /** Load the lighting environment when deck.gl creates its device. */
  _onDeviceInitialized(device) {
    this.setState({iblEnvironment: loadIBLEnvironment(device)});
  }

  render() {
    return (
      <DeckGL
        height="100%"
        initialViewState={INITIAL_VIEW_STATE}
        controller={{type: MapController}}
        onDeviceInitialized={this._onDeviceInitialized.bind(this)}
        layers={[
          new ScenegraphLayer({
            id: 'tile-3d-layer',
            data: [{}],
            scenegraph: GLTF_DEFAULT_MODEL,
            modelMatrix: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
            _composeModelMatrix: true,
            coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
            coordinateOrigin: MODEL_ORIGIN,
            sizeScale: 1000,
            _pbr: true,
            _imageBasedLightingEnvironment: this.state.iblEnvironment
          })
        ]}
      >
        <Map
          mapStyle={{
            version: 8,
            sources: {},
            layers: [{id: 'background', type: 'background', paint: {'background-color': '#f4f4f4'}}]
          }}
          interactive={false}
          preventStyleDiffing
        />
      </DeckGL>
    );
  }
}

// TODO - hook for integrating into web page
export function renderToDOM(container) {
  createRoot(container).render(<App />);
}

renderToDOM(document.body.appendChild(document.createElement('div')));
