import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

import Map from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import DeckGL from '@deck.gl/react';
import {MapController, FlyToInterpolator, MapViewState} from '@deck.gl/core';

import {COORDINATE_SYSTEM, I3SLoader, parseSLPKArchive} from '@loaders.gl/i3s';
import {Tileset3D} from '@loaders.gl/tiles';
import {ControlPanel} from './components/control-panel';
import {BrowserFile} from './browser-file';
import {ZipFileSystem} from '@loaders.gl/zip';
import {LoaderWithParser} from '@loaders.gl/loader-utils';
import CustomTile3DLayer from './custom-tile-3d-layer';

export const TRANSITION_DURAITON = 4000;

const MAP_CONTROLLER = {
  type: MapController,
  maxPitch: 60,
  inertia: true,
  scrollZoom: {speed: 0.01, smooth: true},
  touchRotate: true,
  dragMode: false
};

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
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [file, setFile] = useState<File | null>(null);
  const [fileSystem, setFileSystem] = useState<ZipFileSystem | null>(null);

  useEffect(() => {
    if (!file) {
      return;
    }

    const createFileSystem = async (file: File) => {
      const fileProvider = new BrowserFile(file);
      const archive = await parseSLPKArchive(fileProvider, undefined, file.name);
      const fileSystem = new ZipFileSystem(archive);
      setFileSystem(fileSystem);
    };

    createFileSystem(file);
  }, [file]);

  function onTilesetLoadHandler(tileset: Tileset3D) {
    const {zoom, cartographicCenter} = tileset;
    const [longitude, latitude] = cartographicCenter || [];
    const newViewState = {
      ...INITIAL_VIEW_STATE,
      zoom: zoom + 2,
      longitude,
      latitude,
      transitionDuration: TRANSITION_DURAITON,
      transitionInterpolator: new FlyToInterpolator()
    };
    setViewState(newViewState);
  }

  function renderLayers() {
    if (!fileSystem) {
      return;
    }
    const loadOptions = {
      i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS},
      fetch: fileSystem.fetch.bind(fileSystem),
      worker: false
    };
    // @ts-expect-error
    const layers = new CustomTile3DLayer({
      data: '',
      loader: I3SLoader as LoaderWithParser,
      onTilesetLoad: onTilesetLoadHandler,
      loadOptions
    });
    return layers;
  }

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL initialViewState={viewState} layers={renderLayers()} controller={MAP_CONTROLLER}>
        <Map
          reuseMaps
          mapLib={maplibregl}
          mapStyle={'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json'}
          preventStyleDiffing
          preserveDrawingBuffer
        />
      </DeckGL>
      <ControlPanel onFileSelected={([file]) => setFile(file)} />
    </div>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
