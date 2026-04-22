// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
import {MapStyleSchema, MapStyleSourceSchema, ResolvedMapStyleSchema} from './map-style-schema';

/**
 * A style source entry from a MapLibre or Mapbox style document.
 */
export type MapStyleSource = {
  /** Source kind such as `vector` or `raster`. */
  type?: string;
  /** Optional TileJSON URL used to resolve the source metadata. */
  url?: string;
  /** Inline tile templates for the source. */
  tiles?: string[];
  /** Minimum source zoom. */
  minzoom?: number;
  /** Maximum source zoom. */
  maxzoom?: number;
  /** Tile size in pixels. */
  tileSize?: number;
  /** Additional source properties are preserved verbatim. */
  [key: string]: unknown;
};

/**
 * A style layer entry.
 */
export type MapStyleLayer = {
  /** Unique layer identifier. */
  id: string;
  /** Style layer type such as `background`, `fill`, `line`, `symbol`, or `raster`. */
  type: string;
  /** Referenced source identifier. */
  source?: string;
  /** Referenced vector source-layer identifier. */
  'source-layer'?: string;
  /** Optional minimum zoom. */
  minzoom?: number;
  /** Optional maximum zoom. */
  maxzoom?: number;
  /** Optional style-spec filter expression. */
  filter?: unknown[];
  /** Paint properties from the source style layer. */
  paint?: Record<string, unknown>;
  /** Layout properties from the source style layer. */
  layout?: Record<string, unknown>;
  /** Additional layer properties are preserved verbatim. */
  [key: string]: unknown;
};

/**
 * A MapLibre or Mapbox style document.
 */
export type MapStyle = {
  /** Style-spec version number. */
  version?: number;
  /** Optional style metadata bag. */
  metadata?: Record<string, unknown>;
  /** Named source definitions used by the style. */
  sources?: Record<string, MapStyleSource>;
  /** Ordered list of style layers. */
  layers?: MapStyleLayer[];
  /** Additional style properties are preserved verbatim. */
  [key: string]: unknown;
};

/**
 * A style document after all sources have been normalized and TileJSON-backed sources resolved.
 */
export type ResolvedMapStyle = MapStyle & {
  /** Fully resolved source definitions. */
  sources: Record<string, MapStyleSource>;
  /** Style layers copied into a mutable array. */
  layers: MapStyleLayer[];
};

/**
 * Load options accepted by {@link resolveMapStyle}.
 */
export type MapStyleLoadOptions = LoaderOptions & {
  mapStyle?: {
    /** Base URL used to resolve relative style source or tile URLs. */
    baseUrl?: string;
    /** Optional custom fetch implementation. */
    fetch?: typeof fetch;
    /** Optional init object passed to the selected fetch implementation. */
    fetchOptions?: RequestInit;
    /** Additional loader options are accepted for forward compatibility. */
    [key: string]: unknown;
  };
};

/**
 * Extracts map style options from loader options and loader context.
 */
export function getMapStyleLoadOptions(
  options?: MapStyleLoadOptions,
  context?: LoaderContext
): NonNullable<MapStyleLoadOptions['mapStyle']> {
  return {
    ...options?.mapStyle,
    baseUrl: options?.mapStyle?.baseUrl || context?.url || context?.baseUrl,
    fetch: options?.mapStyle?.fetch || (context?.fetch as typeof fetch | undefined)
  };
}

/**
 * Resolves a URL against the provided base URL.
 */
export function normalizeMapStyleUrl(
  url: string | undefined,
  baseUrl?: string
): string | undefined {
  if (!url) {
    return url;
  }

  try {
    return decodeURI(new URL(url, baseUrl).toString());
  } catch {
    return url;
  }
}

/**
 * Resolves all tile templates in a source against the provided base URL.
 */
export function normalizeMapStyleTiles(
  tiles: string[] | undefined,
  baseUrl?: string
): string[] | undefined {
  return Array.isArray(tiles)
    ? tiles.map(tile => normalizeMapStyleUrl(tile, baseUrl) || tile)
    : tiles;
}

/**
 * Fetches and parses a JSON resource.
 */
export async function fetchMapStyleJson(
  url: string,
  loadOptions?: NonNullable<MapStyleLoadOptions['mapStyle']>
): Promise<unknown> {
  const fetchFunction = loadOptions?.fetch || fetch;
  const response = await fetchFunction(url, loadOptions?.fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to load map style resource: ${url} (${response.status})`);
  }

  return await response.json();
}

/**
 * Resolves a single source, including optional TileJSON indirection.
 */
export async function resolveMapStyleSource(
  source: MapStyleSource | undefined,
  baseUrl: string | undefined,
  loadOptions?: NonNullable<MapStyleLoadOptions['mapStyle']>
): Promise<MapStyleSource | undefined> {
  if (!source) {
    return source;
  }

  const resolvedSource: MapStyleSource = {...source};
  let sourceBaseUrl = baseUrl;

  if (resolvedSource.url) {
    const tileJsonUrl = normalizeMapStyleUrl(resolvedSource.url, baseUrl);
    const tileJson = MapStyleSourceSchema.parse(
      await fetchMapStyleJson(tileJsonUrl || resolvedSource.url, loadOptions)
    );
    Object.assign(resolvedSource, tileJson);
    resolvedSource.url = tileJsonUrl;
    sourceBaseUrl = tileJsonUrl;
  }

  if (resolvedSource.tiles) {
    resolvedSource.tiles = normalizeMapStyleTiles(resolvedSource.tiles, sourceBaseUrl);
  }

  return resolvedSource;
}

/**
 * Resolves a style input into a style object whose sources contain directly consumable tile
 * templates and source metadata.
 */
export async function resolveMapStyle(
  style: string | MapStyle,
  options?: MapStyleLoadOptions
): Promise<ResolvedMapStyle> {
  const mapStyleOptions = getMapStyleLoadOptions(options);
  const styleDefinition = MapStyleSchema.parse(
    typeof style === 'string'
      ? await fetchMapStyleJson(style, mapStyleOptions)
      : structuredClone(style)
  );
  const baseUrl = typeof style === 'string' ? style : mapStyleOptions.baseUrl;
  const resolvedSources: Record<string, MapStyleSource> = {};

  await Promise.all(
    Object.entries(styleDefinition.sources || {}).map(async ([sourceId, source]) => {
      resolvedSources[sourceId] =
        (await resolveMapStyleSource(source, baseUrl, mapStyleOptions)) || {};
    })
  );

  return ResolvedMapStyleSchema.parse({
    ...styleDefinition,
    sources: resolvedSources,
    layers: [...(styleDefinition.layers || [])]
  });
}
