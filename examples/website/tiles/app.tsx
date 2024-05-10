// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// React
import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';

// loaders.gl sources and loaders
import type {TileSource, VectorTileSource, ImageTileSource} from '@loaders.gl/loader-utils';
import {load} from '@loaders.gl/core';
import {PMTilesSource, PMTilesMetadata} from '@loaders.gl/pmtiles';
import {MVTSource, TableTileSource} from '@loaders.gl/mvt';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';

// D\deck.gl + layers
import DeckGL from '@deck.gl/react';
import {MapView} from '@deck.gl/core';
import {TileSourceLayer} from './components/tile-source-layer';

// Basemap
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

// CUT IF YOU COPY THIS EXAMPLE
import {Example, ExamplePanel, Attributions} from './components/example-panel';
import {EXAMPLES, INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME} from './examples';
import {INITIAL_MAP_STYLE} from './examples';
// END CUT

/** Arbitrary initial view state */
const INITIAL_VIEW_STATE = {latitude: 47.65, longitude: 7, zoom: 2, maxZoom: 20};

/** Application props (used by website MDX pages to configure example */
type AppProps = {
  /** Controls which examples are shown */
  format?: string;
  /** Show tile borders */
  showTileBorders?: boolean;
  /** On tiles load */
  onTilesLoad?: Function;
  /** Any informational text to display in the overlay */
  children?: React.Children;
};

/** Application state */
type AppState = {
  /** Currently active tile source */
  tileSource: VectorTileSource | ImageTileSource;
  /** Metadata loaded from active tile source */
  metadata: any;
  /**Current view state */
  viewState: Record<string, number>;
};

export default function App(props: AppProps = {}) {
  const [state, setState] = useState<AppState>({
    tileSource: null,
    viewState: INITIAL_VIEW_STATE,
    // TODO - handle errors
    error: null
  });

  const {tileSource, metadata} = state;
  const tileLayer =
    tileSource &&
    new TileSourceLayer({
      data: tileSource,
      tileSource,
      showTileBorders: true,
      // @ts-expect-error
      metadata,
      onTilesLoad: props.onTilesLoad,
      pickable: true,
      autoHighlight: true
      // custom props
    });

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <ExamplePanel
        title="Tileset Metadata"
        examples={EXAMPLES}
        format={props.format}
        initialCategoryName={INITIAL_CATEGORY_NAME}
        initialExampleName={INITIAL_EXAMPLE_NAME}
        onExampleChange={onExampleChange}
        schema={metadata ? JSON.stringify(metadata, null, 2) : ''}
      >
        {props.children}
        {/* error ? <div style={{color: 'red'}}>{error}</div> : '' */}
        <pre style={{textAlign: 'center', margin: 0}}>
          {/* long/lat: {viewState.longitude.toFixed(5)}, {viewState.latitude.toFixed(5)}, zoom:{' '} */}
          {/* viewState.zoom.toFixed(2) */}
        </pre>
      </ExamplePanel>

      <DeckGL
        layers={[tileLayer]}
        views={new MapView({repeat: true})}
        initialViewState={state.viewState}
        controller={true}
        getTooltip={getTooltip}
      >
        <Map mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} />
        <Attributions attributions={metadata?.attributions} />
      </DeckGL>
    </div>
  );

  async function onExampleChange(args: {
    categoryName: string;
    exampleName: string;
    example: Example;
  }) {
    const {categoryName, exampleName, example} = args;

    const url = example.data;
    try {

      let tileSource = createTileSource(example);

      setState((state) => ({
        ...state,
        tileSource,
        metadata: null
      }));

      (async () => {
        const metadata = await tileSource.getMetadata();
        let initialViewState = {...state.viewState, ...example.viewState};
        initialViewState = adjustViewStateToMetadata(initialViewState, metadata);

        setState((state) => ({
          ...state,
          initialViewState,
          metadata
        }));
      })();
    } catch (error) {
      console.error('Failed to load data', url, error);
      setState((state) => ({...state, error: `Could not load ${exampleName}: ${error.message}`}));
    }
  }
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

// Helpers

/**
 * @param example
 * @returns
 */
function createTileSource(example: Example): VectorTileSource | ImageTileSource {
  switch (example?.sourceType || null) {
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

/**
 * Helper function to adjust view state based on tileset metadata, keep zoom in visible range etc
 * TODO - perhaps TileSourceLayer could provide a callback to let app adjust view state to fit within available tile levels
 */
function adjustViewStateToMetadata(viewState, metadata) {
  if (!metadata) {
    return viewState;
  }
  
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
  return viewState;
}
