import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

import Map from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import DeckGL from '@deck.gl/react';
import {MapViewState} from '@deck.gl/core';
import {PotreeSource} from '@loaders.gl/potree';

import {PotreeTile3DLayer} from './potree-tile-3d-layer';

export const TRANSITION_DURAITON = 4000;

const INITIAL_VIEW_STATE = {
  longitude: -90,
  latitude: 34,
  pitch: 0,
  maxPitch: 90,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 3
};

export default function App() {
  const [viewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  function renderLayers() {
    const layers = new PotreeTile3DLayer({
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/refs/heads/master/formats/potree/1.8/3dm_32_291_5744_1_nw-converted',
      source: PotreeSource
    });
    return [layers];
  }

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL initialViewState={viewState} layers={renderLayers()} controller={true}>
        <Map
          reuseMaps
          mapLib={maplibregl}
          mapStyle={'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'}
          preventStyleDiffing
          preserveDrawingBuffer
        />
      </DeckGL>
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
