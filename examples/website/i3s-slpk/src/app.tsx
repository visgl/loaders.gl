import React, {useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {MapController} from '@deck.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import type {MapViewState} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {SourceLayer} from '@loaders.gl/deck-layers';
import {createArchiveSource} from './archive-source';
import type {ArchiveFormat} from './archive-source';
import type {Tileset3D} from '@loaders.gl/tiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map from 'react-map-gl/maplibre';

import {ControlPanel} from './components/control-panel';
import {I3SMeshExtension} from './i3s-mesh-extension';

const I3S_MESH_EXTENSION = new I3SMeshExtension();

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

type ArchiveInput = string | File;

/** Returns a concise display label for an archive input. */
function getSourceLabel(input: ArchiveInput | null): string | null {
  if (!input) {
    return null;
  }
  return typeof input === 'string' ? input : input.name;
}

/** Renders local and remote SLPK/3TZ archives through the same source-backed layer. */
export default function App() {
  const currentSource = useRef<ReturnType<typeof createArchiveSource> | null>(null);
  const [source, setSource] = useState<ReturnType<typeof createArchiveSource> | null>(null);
  const [selectionNumber, setSelectionNumber] = useState(0);
  const [input, setInput] = useState<ArchiveInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);

  /** Select a new archive and clear errors from the previous source. */
  function handleSourceSelected(selectedInput: ArchiveInput, format: ArchiveFormat = 'auto'): void {
    try {
      const nextSource = createArchiveSource(selectedInput, format);
      setError(null);
      setInput(selectedInput);
      currentSource.current = nextSource;
      setSource(nextSource);
      setSelectionNumber(previous => previous + 1);
    } catch (selectionError) {
      setError(selectionError instanceof Error ? selectionError.message : String(selectionError));
    }
  }

  /** Move the camera to the archive after its root tileset loads. */
  function handleTilesetLoad(tileset: Tileset3D): void {
    const [longitude = INITIAL_VIEW_STATE.longitude, latitude = INITIAL_VIEW_STATE.latitude] =
      tileset.cartographicCenter || [];
    const volume = tileset.root?.boundingVolume;
    const center = volume?.center;
    const halfAxes = volume?.halfAxes;
    const radius =
      volume?.radius ??
      (halfAxes
        ? Math.hypot(
            halfAxes[0] + halfAxes[3] + halfAxes[6],
            halfAxes[1] + halfAxes[4] + halfAxes[7],
            halfAxes[2] + halfAxes[5] + halfAxes[8]
          )
        : NaN);
    // The camera moves to the tile height below, so fit geometry without adding elevation again.
    const zoom =
      Number.isFinite(radius) && radius > 0
        ? Math.log2(Ellipsoid.WGS84.radii[2] / radius)
        : tileset.zoom;
    const height = center
      ? Ellipsoid.WGS84.cartesianToCartographic(center)[2]
      : tileset.cartographicCenter?.[2] || 0;
    setViewState({
      ...INITIAL_VIEW_STATE,
      longitude,
      latitude,
      zoom,
      position: [0, 0, Number.isFinite(height) ? height : 0]
    });
  }

  /** Surface tile loading failures in the example controls. */
  function handleTileError(error: unknown): void {
    setError(
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unable to load this archive.'
    );
  }

  const layers = source
    ? [
        new SourceLayer<unknown>({
          id: `tile-archive-${selectionNumber}`,
          data: source,
          _subLayerProps: {
            'tile-3d': {_subLayerProps: {mesh: {extensions: [I3S_MESH_EXTENSION]}}}
          },
          onTilesetLoad: tileset => {
            if (currentSource.current === source) handleTilesetLoad(tileset);
          },
          onError: error => {
            if (currentSource.current === source) handleTileError(error);
            return true;
          },
          onTileError: (tile: unknown, message?: unknown) => {
            if (currentSource.current === source) handleTileError(message || tile);
          }
        })
      ]
    : [];

  return (
    <div
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) handleSourceSelected(file);
      }}
      style={{position: 'relative', height: '100%'}}
    >
      <DeckGL initialViewState={viewState} layers={layers} controller={MAP_CONTROLLER}>
        <Map
          reuseMaps
          mapStyle="https://tiles.openfreemap.org/styles/dark"
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

/** Mount the tile archive example in a standalone HTML page. */
export function renderToDOM(container: HTMLElement): void {
  createRoot(container).render(<App />);
}
