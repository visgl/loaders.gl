// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import maplibregl from 'maplibre-gl';
import {load} from '@loaders.gl/core';
import {MLTLoader} from '@loaders.gl/mlt';
import type {Feature, FeatureCollection} from 'geojson';

const STATUS_EL = document.getElementById('status')!;

const MLT_TILES_BASE = 'https://demotiles.maplibre.org/tiles-mlt/plain';

// Extrusion height in meters visible at zoom ~2 (mercator)
const EXTRUSION_HEIGHT = 80_000;

const CONTINENT_MATCH_EXPR: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'CONTINENT'],
  'Africa',        '#e07b54',
  'Antarctica',    '#c8e6fa',
  'Asia',          '#e8c56d',
  'Europe',        '#7dbf8e',
  'North America', '#6baed6',
  'Oceania',       '#9e88c4',
  'South America', '#e8915a',
  '#aaaaaa'
];

// ---------------------------------------------------------------------------
// Map — mercator + pitch for reliable fill-extrusion 3D
// ---------------------------------------------------------------------------

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {},
    layers: [
      {id: 'background', type: 'background', paint: {'background-color': '#0d1b2a'}}
    ]
  },
  center: [15, 25],
  zoom: 1.8,
  pitch: 50,
  bearing: -15,
  maxPitch: 85
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

map.on('load', () => {
  // Sky / atmosphere layer
  map.addLayer({
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0, 90],
      'sky-atmosphere-sun-intensity': 15
    }
  } as maplibregl.LayerSpecification);

  map.addSource('mlt-polygons', {type: 'geojson', data: emptyFC()});
  map.addSource('mlt-labels',   {type: 'geojson', data: emptyFC()});

  // Country extrusions
  map.addLayer({
    id: 'countries-extrusion',
    type: 'fill-extrusion',
    source: 'mlt-polygons',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-extrusion-color': CONTINENT_MATCH_EXPR,
      'fill-extrusion-height': EXTRUSION_HEIGHT,
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': 0.9,
      'fill-extrusion-vertical-gradient': true
    }
  });

  // Flat outlines on top of extrusions for contrast
  map.addLayer({
    id: 'countries-outline',
    type: 'line',
    source: 'mlt-polygons',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {'line-color': 'rgba(0,0,0,0.4)', 'line-width': 0.5}
  });

  // Geographic lines (tropics, equator)
  map.addLayer({
    id: 'geolines',
    type: 'line',
    source: 'mlt-polygons',
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: {'line-color': '#ffffff', 'line-width': 0.8, 'line-opacity': 0.3, 'line-dasharray': [4, 4]}
  });

  // Country abbreviation labels
  map.addLayer({
    id: 'country-labels',
    type: 'symbol',
    source: 'mlt-labels',
    layout: {
      'text-field': ['get', 'ABBREV'],
      'text-font': ['Open Sans Bold'],
      'text-size': 11,
      'text-allow-overlap': false
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0,0,0,0.7)',
      'text-halo-width': 1.5
    }
  });

  loadTiles();
});

map.on('moveend', loadTiles);

// ---------------------------------------------------------------------------
// Tile loading
// ---------------------------------------------------------------------------

let loading = false;

async function loadTiles() {
  if (loading) return;

  const polySource = map.getSource('mlt-polygons') as maplibregl.GeoJSONSource | undefined;
  const labelSource = map.getSource('mlt-labels')   as maplibregl.GeoJSONSource | undefined;
  if (!polySource || !labelSource) return;

  loading = true;
  STATUS_EL.textContent = 'Fetching tiles…';

  const zoom  = Math.min(Math.floor(map.getZoom()), 6);
  const tiles = getTilesInBounds(map.getBounds(), zoom);

  try {
    const polygonFeatures: Feature[] = [];
    const labelFeatures:   Feature[] = [];

    await Promise.all(
      tiles.map(async ({x, y, z}) => {
        const url = `${MLT_TILES_BASE}/${z}/${x}/${y}.mlt`;
        try {
          const features = (await load(url, MLTLoader, {
            mlt: {shape: 'geojson', coordinates: 'wgs84', tileIndex: {x, y, z}, layerProperty: 'layerName'}
          })) as Feature[];

          console.log(`Tile ${z}/${x}/${y}: ${features?.length ?? 0} features`);

          for (const f of features ?? []) {
            (f.geometry?.type === 'Point' ? labelFeatures : polygonFeatures).push(f);
          }
        } catch (err) {
          console.warn(`Tile ${z}/${x}/${y} failed:`, err);
        }
      })
    );

    polySource.setData(fc(polygonFeatures));
    labelSource.setData(fc(labelFeatures));

    STATUS_EL.textContent =
      `z${zoom} · ${polygonFeatures.length.toLocaleString()} polygons · ${labelFeatures.length} labels · ${tiles.length} tile(s)`;
  } finally {
    loading = false;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyFC(): FeatureCollection { return {type: 'FeatureCollection', features: []}; }
function fc(features: Feature[]): FeatureCollection { return {type: 'FeatureCollection', features}; }

function lon2tile(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}

function lat2tile(lat: number, z: number) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z
  );
}

function getTilesInBounds(bounds: maplibregl.LngLatBounds, z: number) {
  const n = 2 ** z;
  const tiles: {x: number; y: number; z: number}[] = [];
  for (let x = Math.max(0, lon2tile(bounds.getWest(), z)); x <= Math.min(n - 1, lon2tile(bounds.getEast(), z)); x++) {
    for (let y = Math.max(0, lat2tile(bounds.getNorth(), z)); y <= Math.min(n - 1, lat2tile(bounds.getSouth(), z)); y++) {
      tiles.push({x, y, z});
    }
  }
  return tiles.slice(0, 25);
}
