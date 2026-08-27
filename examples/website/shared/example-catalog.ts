// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Rendering surface used by a curated example dataset. */
export type ExampleSurface = 'geospatial' | 'tiles' | 'pointcloud';

/** A curated dataset shown by the shared example source picker. */
export type CuratedExample = {
  /** Stable identifier used in shareable URLs. */
  id: string;
  /** Human-readable dataset name. */
  label: string;
  /** Dataset format understood by the selected example surface. */
  format: string;
  /** Source URL. */
  url: string;
  /** Surface on which the dataset can be rendered. */
  surface: ExampleSurface;
  /** Short description shown in the picker. */
  description: string;
  /** Optional attribution text. */
  attribution?: string;
  /** Approximate source size in bytes when known. */
  sizeBytes?: number;
  /** Whether this dataset is suitable for constrained mobile devices. */
  mobileSafe?: boolean;
  /** Preview image path relative to the website static directory. */
  thumbnail: string;
};

/** Small, reliable datasets selected for the public examples site. */
export const CURATED_EXAMPLES: readonly CuratedExample[] = [
  {
    id: 'geojson-countries',
    label: 'Natural Earth countries',
    format: 'GeoJSON',
    url: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson',
    surface: 'geospatial',
    description: 'A compact world map with country boundaries.',
    thumbnail: 'images/examples/geospatial/geojson.jpg',
    mobileSafe: true
  },
  {
    id: 'geoparquet-airports',
    label: 'Airports in GeoParquet',
    format: 'GeoParquet',
    url: 'https://github.com/visgl/loaders.gl/raw/refs/heads/master/modules/parquet/test/data/geoparquet/airports.parquet',
    surface: 'geospatial',
    description: 'A columnar point dataset that demonstrates GeoParquet.',
    thumbnail: 'images/examples/geospatial/geoparquet.jpg',
    mobileSafe: true
  },
  {
    id: 'pmtiles-new-zealand-buildings',
    label: 'New Zealand buildings',
    format: 'PMTiles',
    url: 'https://r2-public.protomaps.com/protomaps-sample-datasets/nz-buildings-v3.pmtiles',
    surface: 'tiles',
    description: 'A cloud-hosted vector tile archive loaded with range requests.',
    thumbnail: 'images/examples/tiles/pmtiles.jpg',
    attribution: '© Land Information New Zealand',
    mobileSafe: true
  },
  {
    id: 'pointcloud-bunny',
    label: 'Stanford bunny',
    format: 'PLY',
    url: 'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/ply/test/data/bunny.ply',
    surface: 'pointcloud',
    description: 'A small point cloud for a fast first render.',
    thumbnail: 'images/examples/pointclouds/ply.jpg',
    mobileSafe: true
  },
  {
    id: 'pointcloud-lucy',
    label: 'Lucy 100K',
    format: 'PLY',
    url: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/point-cloud-ply/lucy100k.ply',
    surface: 'pointcloud',
    description: 'A richer point cloud for desktop-capable devices.',
    thumbnail: 'images/examples/pointclouds/ply.jpg',
    mobileSafe: false
  }
];

/** Returns curated datasets for one rendering surface. */
export function getCuratedExamples(surface: ExampleSurface): CuratedExample[] {
  return CURATED_EXAMPLES.filter(example => example.surface === surface);
}

/** Finds a curated dataset by its shareable identifier. */
export function getCuratedExample(id: string | null): CuratedExample | null {
  return CURATED_EXAMPLES.find(example => example.id === id) || null;
}
