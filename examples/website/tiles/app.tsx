// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import DeckGL from '@deck.gl/react';
import {MapView} from '@deck.gl/core';

import {TileSourceLayer} from './components/tile-source-layer';

import type {TileSource} from '@loaders.gl/loader-utils';
import {load} from '@loaders.gl/core';
import {PMTilesSource, PMTilesMetadata} from '@loaders.gl/pmtiles';
import {MVTSource, GeoJSONTileSource} from '@loaders.gl/mvt';

import {ControlPanel} from './components/control-panel';
import {
  Example,
  INITIAL_CATEGORY_NAME,
  INITIAL_EXAMPLE_NAME,
  INITIAL_MAP_STYLE,
  EXAMPLES
} from './examples';
import {GeoJSONLoader} from '../../../modules/json/src/geojson-loader';

const INITIAL_VIEW_STATE = {
  latitude: 47.65,
  longitude: 7,
  zoom: 4.5,
  maxZoom: 20,
  maxPitch: 89,
  bearing: 0
};

const COPYRIGHT_LICENSE_STYLE = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  backgroundColor: 'hsla(0,0%,100%,.5)',
  padding: '0 5px',
  font: '12px/20px Helvetica Neue,Arial,Helvetica,sans-serif'
};

const LINK_STYLE = {
  textDecoration: 'none',
  color: 'rgba(0,0,0,.75)',
  cursor: 'grab'
};

function createTileSource(example: Example): TileSource<any> {
  switch (example.format) {
    case 'pmtiles':
      return new PMTilesSource({
        url: example.data,
        attributions: example.attributions,
        loadOptions: {tilejson: {maxValues: 10}}
      });

    case 'mvt':
      return new MVTSource({url: example.data});

    case 'geojson':
      // GeoJSONTileSource can be created synchronously with a promise
      const geojsonTablePromise = load(example.data, GeoJSONLoader);
      return new GeoJSONTileSource(geojsonTablePromise);

    default:
      throw new Error(`Unknown source format ${example.format}`);
  }
}

export default function App({showTileBorders = false, onTilesLoad = null}) {

  const [selectedCategory, setSelectedCategory] = useState(INITIAL_CATEGORY_NAME);
  const [selectedExample, setSelectedExample] = useState(INITIAL_EXAMPLE_NAME);
  const [example, setExample] = useState<Example | null>(
    EXAMPLES[selectedCategory][selectedExample]
  );
  const [tileSource, setTileSource] = useState<PMTilesSource | null>(null);
  const [metadata, setMetadata] = useState<PMTilesMetadata | null>(null);
  const [viewState, setViewState] = useState<Record<string, number>>(INITIAL_VIEW_STATE);

  useEffect(() => {
    let tileSource = createTileSource(example);
    setTileSource(tileSource);
    setMetadata(null);

    (async () => {
      const metadata = await tileSource.metadata;
      setMetadata(metadata);
    })();
  }, [example]);

  useEffect(() => {
    let initialViewState = {...viewState, ...example.viewState};
    if (metadata) {
      initialViewState = {
        ...initialViewState,
        zoom: (metadata.maxZoom + metadata.minZoom) / 2
      };
      if (metadata.center && metadata.center[0] !== 0 && metadata.center[1] !== 0) {
        initialViewState = {
          ...initialViewState,
          longitude: metadata.center[0],
          latitude: metadata.center[1]
        };
      }
      console.log('initialViewState', initialViewState);
    }
    setViewState(initialViewState);
  }, [metadata, example]);

  const tileLayer =
    tileSource && new TileSourceLayer({
      tileSource, 
      showTileBorders: true,
      metadata, 
      onTilesLoad, 
      pickable: true, 
      autoHighlight: true, 
    });

  return (
    <div style={{position: 'relative', height: '100%'}}>
      {renderControlPanel({
        metadata,
        selectedCategory,
        selectedExample,
        onExampleChange({selectedCategory, selectedExample, example}) {
          // setViewState({...initialViewState, ...example.viewState})
          setSelectedCategory(selectedCategory);
          setSelectedExample(selectedExample);
          setExample(example);
        }
      })}

      <DeckGL
        layers={[tileLayer]}
        views={new MapView({repeat: true})}
        initialViewState={viewState}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} />
        <div style={COPYRIGHT_LICENSE_STYLE}>
          {metadata?.attributions?.map((attribution) => <div key={attribution}>{attribution}</div>)}
        </div>
      </DeckGL>

    </div>
  );
}

function renderControlPanel(props) {
  const {selectedExample, selectedCategory, onExampleChange, loading, metadata, error, viewState} =
    props;

  return (
    <ControlPanel
      title="Tileset Metadata"
      metadata={metadata ? JSON.stringify(metadata, null, 2) : ''}
      examples={EXAMPLES}
      selectedExample={selectedExample}
      selectedCategory={selectedCategory}
      onExampleChange={onExampleChange}
      loading={loading}
    >
      {error ? <div style={{color: 'red'}}>{error}</div> : ''}
      <pre style={{textAlign: 'center', margin: 0}}>
        {/* long/lat: {viewState.longitude.toFixed(5)}, {viewState.latitude.toFixed(5)}, zoom:{' '} */}
        {/* viewState.zoom.toFixed(2) */}
      </pre>
    </ControlPanel>
  );
}

function getTooltip(info) {
  if (info.tile) {
    const {x, y, z} = info.tile.index;
    return `tile: x: ${x}, y: ${y}, z: ${z}`;
  }
  return null;
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
