// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import DeckGL from '@deck.gl/react';
import {
  FlyToInterpolator,
  LinearInterpolator,
  OrbitView
} from '@deck.gl/core';
import type {PointCloudTileset, PointCloudTilesetSource} from '@loaders.gl/tiles';

import {
  DEFAULT_EXAMPLE_ID,
  POINT_TILE_SOURCE_EXAMPLES,
  type PointTileMapViewState,
  type PointTileOrbitViewState,
  type PointTileSourceExample,
  type PointTileViewState
} from './examples';
import {PointTileSourceLayer} from './point-tile-source-layer';

const INITIAL_MAP_VIEW_STATE: PointTileMapViewState = {
  longitude: -96,
  latitude: 37.8,
  pitch: 0,
  maxPitch: 60,
  bearing: 0,
  minZoom: 1,
  maxZoom: 22,
  zoom: 3.5,
  nearZMultiplier: 0.02,
  farZMultiplier: 10
};

const INITIAL_ORBIT_VIEW_STATE: PointTileOrbitViewState = {
  target: [0, 0, 0],
  rotationX: 25,
  rotationOrbit: 30,
  minZoom: 0,
  maxZoom: 14,
  zoom: 6
};

/**
 * A small status snapshot for the active point-cloud tileset.
 */
type TilesetSummary = {
  frameNumber: number;
  visibleTiles: number;
  selectedTiles: number;
  discoveredTiles: number;
  loadedPoints: number;
  renderedPoints: number;
  loaded: boolean;
};

/**
 * Returns a serializable view of the active point-cloud tileset.
 */
function summarizeTileset(tileset: PointCloudTileset): TilesetSummary {
  return {
    frameNumber: tileset.frameNumber,
    visibleTiles: tileset.visibleTilesCount,
    selectedTiles: tileset.selectedTiles.length,
    discoveredTiles: tileset.tiles.length,
    loadedPoints: tileset.tiles.reduce((totalPointCount, tile) => {
      return totalPointCount + (tile.contentAvailable ? tile.pointCount : 0);
    }, 0),
    renderedPoints: tileset.selectedTiles.reduce((totalPointCount, tile) => {
      return totalPointCount + (tile.contentAvailable ? tile.pointCount : 0);
    }, 0),
    loaded: tileset.isLoaded()
  };
}

/**
 * Builds a fly-to view state when the tileset exposes valid cartographic metadata.
 */
function getTilesetViewState(
  tileset: PointCloudTileset,
  example?: PointTileSourceExample
): Partial<PointTileViewState> | null {
  if (example?.viewMode === 'orbit') {
    return getOrbitPointCloudViewState(tileset);
  }

  return getMapPointCloudViewState(tileset.cartographicCenter, tileset.zoom);
}

/**
 * Applies a sample-specific fallback camera when source metadata is not cartographic.
 */
function getExampleViewState(example?: PointTileSourceExample): Partial<PointTileViewState> | null {
  return example?.initialViewState || null;
}

/**
 * Returns the default view state for a sample mode.
 */
function getInitialViewState(example?: PointTileSourceExample): PointTileViewState {
  if (example?.viewMode === 'orbit') {
    return {
      ...INITIAL_ORBIT_VIEW_STATE,
      ...getExampleViewState(example)
    };
  }

  return {
    ...INITIAL_MAP_VIEW_STATE,
    ...getExampleViewState(example)
  };
}

/**
 * Builds a map view state from source or tileset cartographic metadata.
 */
function getMapPointCloudViewState(
  center: number[] | null | undefined,
  zoom: number | null | undefined
): Partial<PointTileViewState> | null {
  if (!center) {
    return null;
  }

  const [longitude, latitude] = center;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  if (Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
    return null;
  }

  return {
    longitude,
    latitude,
    zoom: Math.max(2, Math.min(zoom || INITIAL_MAP_VIEW_STATE.zoom, 18)),
    nearZMultiplier: 0.02,
    farZMultiplier: 10,
    transitionDuration: 1200,
    transitionInterpolator: new FlyToInterpolator()
  };
}

/**
 * Builds an orbit view state from local tileset bounds.
 */
function getOrbitPointCloudViewState(tileset: PointCloudTileset): Partial<PointTileOrbitViewState> | null {
  const boundingVolume = tileset.boundingVolume || tileset.root?.boundingVolume;
  if (!boundingVolume) {
    return null;
  }

  const {center, radius} = boundingVolume;
  const diameter = Math.max(radius * 2, 1);
  const zoom = Math.max(1, Math.min(Math.log2(window.innerWidth / diameter) - 1, 12));

  return {
    target: [center[0], center[1], center[2] || 0],
    zoom,
    rotationX: 25,
    rotationOrbit: 30,
    minZoom: 0,
    maxZoom: 14,
    transitionDuration: 800,
    transitionInterpolator: new LinearInterpolator(['target', 'zoom', 'rotationX', 'rotationOrbit'])
  };
}

function isMapExample(example?: PointTileSourceExample): boolean {
  return example?.viewMode !== 'orbit';
}

function isMapViewState(viewState: PointTileViewState): viewState is PointTileMapViewState {
  return 'longitude' in viewState && 'latitude' in viewState;
}

function isOrbitViewState(viewState: PointTileViewState): viewState is PointTileOrbitViewState {
  return 'target' in viewState;
}

function getDeckViewState(
  example: PointTileSourceExample | undefined,
  viewState: PointTileViewState
): PointTileMapViewState | PointTileOrbitViewState {
  if (isMapExample(example)) {
    return isMapViewState(viewState)
      ? viewState
      : {
          ...INITIAL_MAP_VIEW_STATE,
          ...getExampleViewState(example)
        };
  }

  return isOrbitViewState(viewState)
    ? viewState
    : {
        ...INITIAL_ORBIT_VIEW_STATE,
        ...getExampleViewState(example)
      };
}

/**
 * Logs point-tile-source errors with browser console context.
 */
function logPointTileSourceError(message: string, error: unknown): void {
  console.error(`[point-tile-source] ${message}`, error);
}

/**
 * Website demo for the source-backed point-cloud tileset flow.
 */
export default function App(): React.JSX.Element {
  const [viewState, setViewState] = useState<PointTileViewState>(INITIAL_MAP_VIEW_STATE);
  const [selectedExampleId, setSelectedExampleId] = useState<string>(DEFAULT_EXAMPLE_ID);
  const [dataSource, setDataSource] = useState<PointCloudTilesetSource | null>(null);
  const [tilesetSummary, setTilesetSummary] = useState<TilesetSummary | null>(null);
  const [metadataText, setMetadataText] = useState<string>('Loading metadata...');
  const [error, setError] = useState<string | null>(null);

  const selectedExample =
    POINT_TILE_SOURCE_EXAMPLES.find((example) => example.id === selectedExampleId) ||
    POINT_TILE_SOURCE_EXAMPLES[0];

  useEffect(() => {
    if (!selectedExample) {
      return;
    }

    let isCancelled = false;

    try {
      const nextDataSource = selectedExample.createPointCloudDataSource();
      setError(null);
      setTilesetSummary(null);
      setMetadataText('Loading metadata...');
      setViewState(getInitialViewState(selectedExample));
      setDataSource(nextDataSource);

      if (selectedExample.viewMode === 'map') {
        void nextDataSource
          .initialize()
          .then(async () => await nextDataSource.getViewState?.())
          .then((sourceViewState) => {
            if (isCancelled || !sourceViewState) {
              return;
            }

            const nextViewState = getMapPointCloudViewState(
              sourceViewState.cartographicCenter,
              sourceViewState.zoom
            );
            if (nextViewState) {
              setViewState((currentViewState) => ({
                ...currentViewState,
                ...nextViewState
              }));
            }
          })
          .catch((initializationError) => {
            if (!isCancelled) {
              logPointTileSourceError('Failed to initialize point-cloud source', initializationError);
              setError((initializationError as Error).message);
            }
          });
      }

      void nextDataSource
        .getMetadata?.()
        .then((metadata) => {
          if (!isCancelled) {
            setMetadataText(JSON.stringify(metadata, null, 2));
          }
        })
        .catch((metadataError) => {
          if (!isCancelled) {
            logPointTileSourceError('Failed to load point-cloud metadata', metadataError);
            setMetadataText(`Metadata unavailable: ${(metadataError as Error).message}`);
          }
        });
    } catch (creationError) {
      logPointTileSourceError('Failed to create point-cloud source', creationError);
      setDataSource(null);
      setError((creationError as Error).message);
      setMetadataText('Metadata unavailable');
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedExample]);

  const layers = dataSource
    ? [
        new PointTileSourceLayer({
          id: 'point-tile-source-layer',
          dataSource,
          pointSize: selectedExample?.pointSize || 1,
          getPointColor: selectedExample?.color || [55, 126, 184],
          pointTilesetOptions: {
            maximumScreenSpaceError: 1,
            pointBudget: 2_000_000
          },
          onPointTilesetLoad: (tileset) => {
            const nextViewState = getTilesetViewState(tileset, selectedExample) || getExampleViewState(selectedExample);
            setTilesetSummary(summarizeTileset(tileset));
            if (nextViewState) {
              setViewState((currentViewState) => ({
                ...currentViewState,
                ...nextViewState
              }));
            }
          },
          onPointTilesetUpdate: (tileset) => {
            setTilesetSummary(summarizeTileset(tileset));
          },
          onPointTileError: (tile, tileError) => {
            logPointTileSourceError(`Failed to load point-cloud tile ${tile.id}`, tileError);
            setError(tileError.message);
          }
        })
      ]
    : [];
  const deckViewState = getDeckViewState(selectedExample, viewState);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        key={selectedExample?.viewMode || 'map'}
        controller={true}
        layers={layers}
        views={selectedExample?.viewMode === 'orbit' ? new OrbitView({id: 'orbit'}) : undefined}
        viewState={deckViewState as any}
        onViewStateChange={({viewState: nextViewState}) =>
          setViewState(nextViewState as PointTileViewState)
        }
      >
        {isMapExample(selectedExample) ? (
          <Map
            reuseMaps={true}
            mapLib={maplibregl}
            mapStyle={'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'}
            preserveDrawingBuffer={true}
          />
        ) : null}
      </DeckGL>

      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          width: 340,
          maxHeight: 'calc(100% - 32px)',
          maxWidth: 'calc(100% - 32px)',
          padding: 16,
          background: 'rgba(15, 23, 42, 0.84)',
          color: '#f8fafc',
          borderRadius: 12,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.28)',
          backdropFilter: 'blur(12px)',
          overflowY: 'auto'
        }}
      >
        <div style={{fontSize: 12, letterSpacing: '0.08em', opacity: 0.72}}>POINT TILE SOURCE</div>
        <h2 style={{margin: '6px 0 8px', fontSize: 24}}>PointCloudTileset + DataSource</h2>
        <p style={{margin: 0, lineHeight: 1.45, opacity: 0.88}}>
          Compare Potree and COPC using the small point-cloud tileset manager instead of the full
          3D Tiles pipeline.
        </p>

        <div style={{marginTop: 16}}>
          <div style={{marginBottom: 6, fontSize: 12, letterSpacing: '0.06em', opacity: 0.72}}>
            DATASET
          </div>
          <select
            value={selectedExample?.id || ''}
            onChange={(event) => setSelectedExampleId(event.target.value)}
            style={{
              width: '100%',
              border: 0,
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 15,
              fontWeight: 600,
              background: '#f8fafc',
              color: '#0f172a'
            }}
          >
            {POINT_TILE_SOURCE_EXAMPLES.map((example: PointTileSourceExample) => (
              <option key={example.id} value={example.id}>
                {example.datasetName} ({example.format.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {selectedExample ? (
          <div style={{marginTop: 16, fontSize: 14, lineHeight: 1.5}}>
            <div>
              <strong>Dataset:</strong> {selectedExample.datasetName}
            </div>
            <div>
              <strong>Format:</strong> {selectedExample.format.toUpperCase()}
            </div>
            <div>
              <strong>Location:</strong> {selectedExample.location}
            </div>
            <div>
              <strong>Expected look:</strong> {selectedExample.expectedAppearance}
            </div>
            <div>
              <strong>Description:</strong> {selectedExample.description}
            </div>
            <div style={{marginTop: 6}}>
              <strong>URL:</strong>{' '}
              <a
                href={selectedExample.url}
                target="_blank"
                rel="noreferrer"
                style={{color: '#93c5fd'}}
              >
                Open source file
              </a>
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(148, 163, 184, 0.22)',
            fontSize: 14,
            lineHeight: 1.5
          }}
        >
          <div>
            <strong>Frame:</strong> {tilesetSummary?.frameNumber ?? 0}
          </div>
          <div>
            <strong>Tiles in frustum:</strong> {tilesetSummary?.visibleTiles ?? 0}
          </div>
          <div>
            <strong>Selected tiles:</strong> {tilesetSummary?.selectedTiles ?? 0}
          </div>
          <div>
            <strong>Discovered tiles:</strong> {tilesetSummary?.discoveredTiles ?? 0}
          </div>
          <div>
            <strong>Loaded points:</strong>{' '}
            {(tilesetSummary?.loadedPoints ?? 0).toLocaleString()}
          </div>
          <div>
            <strong>Rendered points:</strong>{' '}
            {(tilesetSummary?.renderedPoints ?? 0).toLocaleString()}
          </div>
          <div>
            <strong>Loaded:</strong> {tilesetSummary?.loaded ? 'yes' : 'loading'}
          </div>
          {error ? (
            <div style={{marginTop: 8, color: '#fca5a5'}}>
              <strong>Error:</strong> {error}
            </div>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid rgba(148, 163, 184, 0.22)'
          }}
        >
          <div style={{marginBottom: 8, fontSize: 12, letterSpacing: '0.06em', opacity: 0.72}}>
            METADATA
          </div>
          <pre
            style={{
              margin: 0,
              padding: 12,
              maxHeight: 220,
              overflow: 'auto',
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.65)',
              color: '#cbd5e1',
              fontSize: 12,
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {metadataText || 'No metadata available'}
          </pre>
        </div>

      </div>
    </div>
  );
}

/**
 * Mounts the example into a DOM container.
 */
export function renderToDOM(container: HTMLElement): void {
  createRoot(container).render(<App />);
}
