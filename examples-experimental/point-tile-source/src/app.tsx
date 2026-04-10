import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import {DeckGL} from '@deck.gl/react';
import {MapViewState} from '@deck.gl/core';
import {PotreeSource} from '@loaders.gl/potree';

import {PointTileSourceLayer} from './point-tile-source-layer';

export const TRANSITION_DURAITON = 4000;

const INITIAL_VIEW_STATE = {
  longitude: 5.9822,
  latitude: 51.805,
  pitch: 0,
  maxPitch: 90,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 15
};

export default function App() {
  const [viewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  function renderLayers() {
    const layers = new PointTileSourceLayer({
      data: 'https://raw.githubusercontent.com/visgl/deck.gl-data/refs/heads/master/formats/potree/1.8/3dm_32_291_5744_1_nw-converted',
      pointSize: 1,
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
          mapStyle={'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'}
          preserveDrawingBuffer
        />
      </DeckGL>
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
