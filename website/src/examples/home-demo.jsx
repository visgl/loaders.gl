import React, {useEffect, useMemo, useState} from 'react';

import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import DeckGL from '@deck.gl/react';
import {FullscreenWidget} from '@deck.gl/widgets';
import '@deck.gl/widgets/stylesheet.css';

import {SourceLayer} from '@loaders.gl/deck-layers';
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
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const layers = useMemo(() => {
    const loadOptions = {i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}};
    return new SourceLayer({
      data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
      loaders: [I3SLoader],
      loadOptions
    });
  }, []);
  const widgets = useMemo(() => [new FullscreenWidget({id: 'home-demo-fullscreen'})], []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return undefined;
    }

    const startedAt = performance.now();
    let animationFrame = 0;
    const updateView = (time) => {
      const phase = ((time - startedAt) / 32000) * Math.PI * 2;
      setViewState({
        ...INITIAL_VIEW_STATE,
        longitude: INITIAL_VIEW_STATE.longitude + Math.sin(phase) * 0.0012,
        bearing: Math.sin(phase) * 2.4
      });
      animationFrame = requestAnimationFrame(updateView);
    };

    animationFrame = requestAnimationFrame(updateView);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        viewState={viewState}
        layers={layers}
        controller={false}
        widgets={widgets}
      >
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
