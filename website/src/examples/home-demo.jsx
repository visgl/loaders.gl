import React from 'react';

import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import DeckGL from '@deck.gl/react';

import {Tile3DLayer} from '@deck.gl/geo-layers';
import {COORDINATE_SYSTEM, I3SLoader} from '@loaders.gl/i3s';

const INITIAL_VIEW_STATE = {
  transitionDuration: 0,
  longitude: -122.401,
  latitude: 37.796,
  pitch: 40,
  bearing: 0,
  zoom: 16.5
};

export default function App() {

  function renderLayers() {
    const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};
    const layers = new Tile3DLayer({
      data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
      loader: I3SLoader,
      loadOptions
    });
    return layers;
  }

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL initialViewState={INITIAL_VIEW_STATE} layers={renderLayers()} controller={false}>
        <Map
          reuseMaps
          mapLib={maplibregl}
          mapStyle={'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json'}
          preventStyleDiffing
          preserveDrawingBuffer
        />
      </DeckGL>
    </div>
  );
}
