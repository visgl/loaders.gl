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
import {MVTSource, TableTileSource} from '@loaders.gl/mvt';

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
  zoom: 2,
  maxZoom: 20,
  maxPitch: 89,
  bearing: 0
};

/**
 * 
 * @param example 
 * @returns 
 */
function createTileSource(example: Example): TileSource<any> {
  switch (example.sourceType) {

    case 'pmtiles':
      return new PMTilesSource({
        url: example.data,
        attributions: example.attributions,
        // Make the Schema more presentable by limiting the number of values per column the field metadata
        loadOptions: {tilejson: {maxValues: 10}}
      });

    case 'mvt':
      return new MVTSource({url: example.data});

    case 'table':
      const tablePromise = load(example.data, GeoJSONLoader);
      // TableTileSource can be created with a promise, no need to wait for table to load.
      return new TableTileSource(tablePromise, {
        // To support multi-tile feature highlighting, each feature must have a unique id.
        generateId: true
      });

    default:
      throw new Error(`Unknown source type ${example.sourceType}`);
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
      const metadata = await tileSource.metadata; // getMetadata();
      setMetadata(metadata);
    })();
  }, [example]);

  useEffect(() => {
    // Apply the examples view state, if it overrides
    let initialViewState = {...viewState, ...example.viewState};
    if (metadata) {
      initialViewState = adjustViewStateToMetadata(initialViewState, metadata);
    }
    setViewState(initialViewState);
  }, [metadata, example]);

  const tileLayer =
    tileSource && new TileSourceLayer({
      data: tileSource,
      tileSource, 
      showTileBorders: true,
      metadata, 
      onTilesLoad, 
      pickable: true, 
      autoHighlight: true, 
      layerMode: 'mvt',
      // custom props
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
        <Attributions attributions={metadata?.attributions} />
      </DeckGL>

    </div>
  );
}

function getTooltip(info) {
  if (info.tile) {
    const {x, y, z} = info.tile.index;
    return `tile: x: ${x}, y: ${y}, z: ${z}`;
  }
  return null;
}

export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />);
}

/** 
 * Helper function to adjust view state based on tileset metadata, keep zoom in visible range etc 
 * TODO - perhaps TileSourceLayer could provide a callback to let app adjust view state to fit within available tile levels
 */
function adjustViewStateToMetadata(viewState, metadata) {
  // Copy to make sure we don't modify input
  viewState = {...viewState};

  // Ensure we are zoomed in to an available zoom level
  if (metadata.minZoom < viewState.zoom) {
    // TODO - basemap seems to get out of sync at too low zooms, so apply a lower bottom.
    viewState.zoom = Math.max(metadata.minZoom, 1.2);
  }
  if (metadata.minZoom > viewState.zoom) {
    viewState.zoom = metadata.maxZoom;
  }
  // If the tileset has a center, user it
  if (typeof metadata.center?.[0] === 'number' && typeof metadata.center?.[1] === 'number') {
    viewState = {
      ...viewState,
      longitude: metadata.center[0],
      latitude: metadata.center[1]
    };
  }
  console.log('viewState', viewState);
  return viewState;
}

// EXAMPLE CONTROL PANEL, CAN BE CUT IF THIS CODE IS COPIED

const COPYRIGHT_LICENSE_STYLE = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  backgroundColor: 'hsla(0,0%,100%,.5)',
  padding: '0 5px',
  font: '12px/20px Helvetica Neue,Arial,Helvetica,sans-serif'
};

/** TODO - check that these are visible. For which datasets? */
function Attributions(props: {attributions?: string[]}) {
  return (
    <div style={COPYRIGHT_LICENSE_STYLE}>
      {props.attributions?.map((attribution) => <div key={attribution}>{attribution}</div>)}
    </div>
  )
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
