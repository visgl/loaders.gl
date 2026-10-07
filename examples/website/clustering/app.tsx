// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type React from 'react';
import {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {FlyToInterpolator, type MapViewState, type PickingInfo} from '@deck.gl/core';
import {GeoJsonLayer} from '@deck.gl/layers';
import {DeckGL} from '@deck.gl/react';
import {ClusterLayer} from '@loaders.gl/deck-layers';
import {ClusterSource, getRepresentativePoint, type ClusterNode} from '@loaders.gl/geoarrow';
import maplibregl from 'maplibre-gl';
import {Map as MapLibreMap} from 'react-map-gl';
import {createSampleData, type SampleGeometry} from './sample-data';
import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';

/** Public basemap style; sample data itself is generated locally. */
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
/** Starting camera fits all four synthetic site groups. */
const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -122.35,
  latitude: 37.81,
  zoom: 11,
  minZoom: 3,
  maxZoom: 19,
  pitch: 0,
  bearing: 0
};
/** Maximum original rows displayed together in the member panel. */
const MEMBER_PAGE_SIZE = 8;

/** Optional content supplied by the website host. */
type AppProps = {
  /** Documentation displayed beneath the controls. */
  children?: React.ReactNode;
};

/** Interactive clustering with pixel radius, expansion, aggregates and original-feature selection. */
export default function App({children}: AppProps = {}) {
  const [viewState, setViewState] = useState<MapViewState>(INITIAL_VIEW_STATE);
  const [radiusPixels, setRadiusPixels] = useState(50);
  const [geometryType, setGeometryType] = useState<SampleGeometry>('points');
  const [selectedCluster, setSelectedCluster] = useState<ClusterNode | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [memberOffset, setMemberOffset] = useState(0);
  const data = useMemo(() => createSampleData(geometryType), [geometryType]);
  // A radius change rebuilds the immutable hierarchy. View changes only query it.
  const source = useMemo(
    () =>
      new ClusterSource(data, {
        radiusPixels,
        maxZoom: 17,
        positionStrategy: geometryType === 'points' ? 'point' : 'centroid',
        aggregations: {capacity: {column: 'capacity', operation: 'sum'}}
      }),
    [data, radiusPixels, geometryType]
  );
  const selectedFeature = selectedRow === null ? null : source.getFeature(selectedRow);
  const memberRows = selectedCluster
    ? source.index.getLeaves(selectedCluster.id, {limit: MEMBER_PAGE_SIZE, offset: memberOffset})
    : [];

  /** Moves to a cluster's first split level or a selected original site. */
  function moveCamera(position: readonly number[], zoom: number): void {
    setViewState((current) => ({
      ...current,
      longitude: position[0],
      latitude: position[1],
      zoom,
      transitionInterpolator: new FlyToInterpolator(),
      transitionDuration: 700
    }));
  }

  /** Selects an original row and reveals its geometry at close range. */
  function selectMember(rowIndex: number): void {
    setSelectedRow(rowIndex);
    const position = getRepresentativePoint(source.getFeature(rowIndex).geometry, 'centroid')!;
    moveCamera(position, Math.max(viewState.zoom, 17));
  }

  /** Expands cluster markers and keeps their original member list available while zooming. */
  function selectMarker({object}: PickingInfo<ClusterNode>): void {
    if (!object) return;
    if (object.isCluster) {
      setSelectedCluster(object);
      setSelectedRow(null);
      setMemberOffset(0);
      moveCamera(
        object.position,
        Math.max(viewState.zoom + 1, source.index.getExpansionZoom(object.id))
      );
    } else if (object.rowIndex !== null) {
      setSelectedCluster(null);
      selectMember(object.rowIndex);
    }
  }

  const layers = [
    new ClusterLayer({
      id: 'sample-clusters',
      data: source,
      onClick: selectMarker,
      markerProps: {
        getRadius: (node) => (node.isCluster ? Math.min(30, 15 + Math.log2(node.pointCount)) : 5),
        getFillColor: (node) => (node.isCluster ? [28, 104, 176, 235] : [27, 152, 133, 235]),
        stroked: true,
        getLineColor: [255, 255, 255, 220],
        lineWidthMinPixels: 1
      },
      labelProps: {fontFamily: 'Arial, sans-serif', fontWeight: 700}
    }),
    new GeoJsonLayer({
      id: 'selected-original',
      data: selectedFeature?.geometry
        ? [{...selectedFeature, geometry: selectedFeature.geometry}]
        : [],
      getFillColor: [238, 151, 33, 160],
      getLineColor: [172, 85, 0, 255],
      getPointRadius: 9,
      pointRadiusUnits: 'pixels',
      stroked: true,
      lineWidthMinPixels: 3,
      getLineWidth: 2
    })
  ];

  return (
    <div className="clustering-example">
      <aside className="clustering-panel" aria-label="Clustering controls">
        <span className="clustering-eyebrow">loaders.gl / interactive example</span>
        <h1>Explore clusters</h1>
        <p>
          Zoom to separate nearby sites. Click a count to expand a cluster, then select a member to
          see its original geometry.
        </p>
        <div className="clustering-total">
          <strong>1,600</strong> generated sample sites
        </div>
        <label htmlFor="cluster-radius">
          Cluster radius <output>{radiusPixels} px</output>
        </label>
        <input
          id="cluster-radius"
          type="range"
          min="20"
          max="100"
          step="5"
          value={radiusPixels}
          onChange={(event) => {
            setRadiusPixels(Number(event.target.value));
            setSelectedCluster(null);
            setMemberOffset(0);
          }}
        />
        <label htmlFor="cluster-geometry">Input geometry</label>
        <select
          id="cluster-geometry"
          value={geometryType}
          onChange={(event) => {
            setGeometryType(event.target.value as SampleGeometry);
            setSelectedCluster(null);
            setMemberOffset(0);
          }}
        >
          <option value="points">Points</option>
          <option value="polygons">Polygon centroids</option>
        </select>
        <p className="clustering-hint">
          {geometryType === 'polygons'
            ? 'Each footprint contributes one centroid. Selecting a member reveals its polygon.'
            : 'Every site contributes one point. Blue markers show member counts.'}
        </p>
        <button
          type="button"
          className="clustering-reset"
          onClick={() => {
            setViewState(INITIAL_VIEW_STATE);
            setSelectedCluster(null);
            setSelectedRow(null);
          }}
        >
          Reset view
        </button>
        {selectedCluster && (
          <section className="clustering-members" aria-label="Cluster members">
            <h2>{selectedCluster.pointCount.toLocaleString()} members</h2>
            <p>
              Total sample capacity:{' '}
              <strong>{selectedCluster.properties.capacity.toLocaleString()}</strong>
            </p>
            <ul>
              {memberRows.map((rowIndex) => {
                const feature = source.getFeature(rowIndex);
                return (
                  <li key={rowIndex}>
                    <button
                      type="button"
                      aria-pressed={selectedRow === rowIndex}
                      onClick={() => selectMember(rowIndex)}
                    >
                      {String(feature.properties?.name)}
                      <small>{String(feature.properties?.neighborhood)}</small>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="clustering-pagination">
              <button
                type="button"
                disabled={memberOffset === 0}
                onClick={() => setMemberOffset(memberOffset - MEMBER_PAGE_SIZE)}
              >
                Previous
              </button>
              <span>
                {memberOffset + 1}–
                {Math.min(memberOffset + MEMBER_PAGE_SIZE, selectedCluster.pointCount)} of{' '}
                {selectedCluster.pointCount}
              </span>
              <button
                type="button"
                disabled={memberOffset + MEMBER_PAGE_SIZE >= selectedCluster.pointCount}
                onClick={() => setMemberOffset(memberOffset + MEMBER_PAGE_SIZE)}
              >
                Next
              </button>
            </div>
          </section>
        )}
        {selectedFeature && (
          <section className="clustering-selection" aria-live="polite">
            <h2>{String(selectedFeature.properties?.name)}</h2>
            <p>
              {String(selectedFeature.properties?.neighborhood)} · Capacity{' '}
              {String(selectedFeature.properties?.capacity)}
            </p>
            <p>Original {selectedFeature.geometry?.type.toLowerCase()} highlighted in orange.</p>
          </section>
        )}
        <div className="clustering-legend">
          <span>
            <i className="clustering-blue" /> Cluster
          </span>
          <span>
            <i className="clustering-green" /> Site
          </span>
          <span>
            <i className="clustering-orange" /> Selected
          </span>
        </div>
        {children && <div className="clustering-docs">{children}</div>}
        <p className="clustering-credit">
          Synthetic data for demonstration; these are not real places or building footprints.
        </p>
      </aside>
      <main className="clustering-map" aria-label="Interactive cluster map">
        <DeckGL
          controller
          viewState={viewState}
          layers={layers}
          onViewStateChange={({viewState: nextViewState}) =>
            setViewState(nextViewState as MapViewState)
          }
          getTooltip={({object}: PickingInfo<ClusterNode>) =>
            object
              ? object.isCluster
                ? `${object.pointCount} sites · Click to expand`
                : String(source.getFeature(object.rowIndex!).properties?.name)
              : null
          }
        >
          <MapLibreMap mapLib={maplibregl} mapStyle={MAP_STYLE} reuseMaps />
        </DeckGL>
        <div className="clustering-zoom">Zoom {viewState.zoom.toFixed(1)}</div>
      </main>
    </div>
  );
}

/** Mounts the standalone example without the documentation website. */
export function renderToDOM(container: HTMLElement): void {
  createRoot(container).render(<App />);
}
