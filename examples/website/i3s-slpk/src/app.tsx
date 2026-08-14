import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {FlyToInterpolator, MapController} from '@deck.gl/core';
import type {MapViewState} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {Tile3DSourceLayer} from '@loaders.gl/deck-layers';
import {I3SLoader, SLPKSource} from '@loaders.gl/i3s';
import type {Tileset3D} from '@loaders.gl/tiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map from 'react-map-gl/maplibre';

import {ControlPanel} from './components/control-panel';

const TRANSITION_DURATION = 4000;

const MAP_CONTROLLER = {
  type: MapController,
  maxPitch: 60,
  inertia: true,
  scrollZoom: {speed: 0.01, smooth: true},
  touchRotate: true,
  dragMode: 'pan' as const
};

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -90,
  latitude: 34,
  pitch: 0,
  maxPitch: 90,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 3
};

type SLPKInput = string | File;

/** Returns a concise display label for an SLPK input. */
function getSourceLabel(input: SLPKInput | null): string | null {
  if (!input) {
    return null;
  }
  return typeof input === 'string' ? input : input.name;
}

/** Renders local and remote SLPK archives through the same source-backed layer. */
export default function App() {
  const [input, setInput] = useState<SLPKInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  const source = useMemo(
    () => (input ? new SLPKSource({url: input, loader: I3SLoader}) : null),
    [input]
  );

  /** Select a new archive and clear errors from the previous source. */
  function handleSourceSelected(selectedInput: SLPKInput): void {
    setError(null);
    setInput(selectedInput);
  }

  /** Move the camera to the archive after its root tileset loads. */
  function handleTilesetLoad(tileset: Tileset3D): void {
    const [longitude = INITIAL_VIEW_STATE.longitude, latitude = INITIAL_VIEW_STATE.latitude] =
      tileset.cartographicCenter || [];
    setViewState({
      ...INITIAL_VIEW_STATE,
      longitude,
      latitude,
      zoom: tileset.zoom + 2,
      transitionDuration: TRANSITION_DURATION,
      transitionInterpolator: new FlyToInterpolator()
    });
  }

  /** Surface tile loading failures in the example controls. */
  function handleTileError(_tile: unknown, url: string, message: string): void {
    setError(message || `Unable to load ${url}`);
  }

  const layers = source
    ? [
        new Tile3DSourceLayer<unknown>({
          id: 'slpk-archive',
          data: source,
          onTilesetLoad: handleTilesetLoad,
          onTileError: handleTileError
        })
      ]
    : [];

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL initialViewState={viewState} layers={layers} controller={MAP_CONTROLLER}>
        <Map
          reuseMaps
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json"
          preserveDrawingBuffer
        />
      </DeckGL>
      <ControlPanel
        selectedSource={getSourceLabel(input)}
        error={error}
        onFileSelected={handleSourceSelected}
        onUrlSelected={handleSourceSelected}
      />
    </div>
  );
}

/** Mount the SLPK example in a standalone HTML page. */
export function renderToDOM(container: HTMLElement): void {
  createRoot(container).render(<App />);
}
