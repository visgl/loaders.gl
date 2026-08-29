// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {load, selectLoader} from '@loaders.gl/core';
import type {DataSourceOptions, Loader, SourceLoader} from '@loaders.gl/loader-utils';
import {isSourceLoader} from '@loaders.gl/loader-utils';
import {isTileset3DSource} from '@loaders.gl/tiles';

/** Visual source families supported by {@link SourceLayer}. */
export type VisualSourceType =
  | 'image'
  | 'vector'
  | 'raster'
  | 'tile-2d'
  | 'point-cloud'
  | 'tile-3d';

/** Metadata supplied to shared source lifecycle callbacks. */
export type SourceLayerLoadInfo = {
  /** Resolved runtime source, or the original URL/Blob for parser-backed 3D tiles. */
  source: unknown;
  /** Classified renderer family. */
  sourceType: VisualSourceType;
  /** Source loader selected for runtime construction, when applicable. */
  sourceLoader?: SourceLoader;
};

/** Normalized navigation hints discovered from source metadata. */
export type SourceLayerViewState = {
  /** Source bounds in the declared coordinate reference system. */
  bounds?: [[number, number], [number, number]];
  /** Geographic center longitude when available. */
  longitude?: number;
  /** Geographic center latitude when available. */
  latitude?: number;
  /** Suggested deck.gl zoom level. */
  zoom?: number;
  /** Suggested target for orbit/orthographic views. */
  target?: [number, number, number];
  /** Coordinate reference system associated with bounds. */
  crs?: string;
};

/** Inputs accepted by the shared asynchronous source resolver. */
export type ResolveSourceOptions = {
  data: unknown;
  loader?: Loader | SourceLoader | Array<Loader | SourceLoader>;
  loaders?: ReadonlyArray<Loader | SourceLoader>;
  sources?: Readonly<SourceLoader[]>;
  sourceOptions?: DataSourceOptions;
};

/** Fully resolved visual source and the loaders retained for child parsing. */
export type ResolvedVisualSource = SourceLayerLoadInfo & {
  parserLoaders: Loader[];
  owned: boolean;
};

/** Resolves URL/Blob inputs and classifies concrete visual source runtimes. */
export async function resolveVisualSource(
  options: ResolveSourceOptions
): Promise<ResolvedVisualSource> {
  const suppliedLoaders = normalizeLoaders(options.loader, options.loaders);
  const parserLoaders = suppliedLoaders.filter(
    (loader): loader is Loader => !isSourceLoader(loader)
  );
  const sourceLoaders = deduplicateByIdentity([
    ...(options.sources || []),
    ...suppliedLoaders.filter((loader): loader is SourceLoader => isSourceLoader(loader))
  ]);
  const directSourceType = classifyVisualSource(options.data);

  if (directSourceType) {
    return {
      source: options.data,
      sourceType: directSourceType,
      parserLoaders,
      owned: false
    };
  }

  if (typeof options.data !== 'string' && !(options.data instanceof Blob)) {
    throw createUnsupportedSourceError(options.data);
  }

  const selectedSourceLoader = await selectSourceLoader(
    options.data,
    sourceLoaders,
    options.sourceOptions
  );
  const requestedSourceType = getRequestedSourceType(options.sourceOptions);
  if (!selectedSourceLoader && requestedSourceType !== 'auto') {
    const availableTypes =
      sourceLoaders.map(sourceLoader => sourceLoader.type).join(', ') || 'none';
    throw new Error(
      `SourceLayer could not find a SourceLoader with type "${requestedSourceType}". Available source types: ${availableTypes}.`
    );
  }
  if (selectedSourceLoader) {
    const sourceOptions = injectParserLoaders(options.sourceOptions, parserLoaders);
    const source = await load(
      options.data as string | Blob,
      selectedSourceLoader,
      sourceOptions as any
    );
    const sourceType = classifyVisualSource(source);
    if (!sourceType) {
      await finalizeOwnedSource(source);
      throw createUnsupportedSourceError(source, selectedSourceLoader);
    }
    return {
      source,
      sourceType,
      sourceLoader: selectedSourceLoader,
      parserLoaders,
      owned: true
    };
  }

  if (parserLoaders.length) {
    return {
      source: options.data,
      sourceType: 'tile-3d',
      parserLoaders,
      owned: false
    };
  }

  const candidateIds = sourceLoaders.map(loader => loader.id || loader.type).join(', ');
  throw new Error(
    candidateIds
      ? `SourceLayer could not match the input using source loaders: ${candidateIds}.`
      : 'SourceLayer requires at least one SourceLoader or parser loader for URL/Blob inputs.'
  );
}

/** Classifies a runtime using the normalized source interfaces in overlap-safe order. */
export function classifyVisualSource(value: unknown): VisualSourceType | null {
  if (isTileset3DSource(value)) {
    return 'tile-3d';
  }
  if (isPointCloudTilesetSource(value)) {
    return 'point-cloud';
  }
  if (isRasterSource(value)) {
    return 'raster';
  }
  if (isImageSource(value)) {
    return 'image';
  }
  if (isVectorSource(value)) {
    return 'vector';
  }
  if (isTileSource(value)) {
    return 'tile-2d';
  }
  return null;
}

/** Loads normalized source metadata when the runtime exposes it asynchronously. */
export async function loadVisualSourceMetadata(
  resolvedSource: ResolvedVisualSource
): Promise<unknown | null> {
  if (
    resolvedSource.sourceType === 'tile-3d' &&
    (typeof resolvedSource.source === 'string' || resolvedSource.source instanceof Blob)
  ) {
    return null;
  }

  const source = resolvedSource.source as {getMetadata?: (...args: any[]) => unknown};
  if (!source?.getMetadata) {
    return null;
  }

  if (resolvedSource.sourceType === 'tile-3d' && isTileset3DSource(source)) {
    return null;
  }

  if (resolvedSource.sourceType === 'point-cloud') {
    const pointCloudSource = source as {isReady?: boolean; initialize?: () => Promise<void>};
    if (!pointCloudSource.isReady && pointCloudSource.initialize) {
      await pointCloudSource.initialize();
    }
  }

  return await source.getMetadata({formatSpecificMetadata: false});
}

/** Returns the first named leaf from normalized image/vector metadata. */
export function getFirstSourceLayerName(metadata: unknown): string | null {
  const rootLayers = getMetadataLayers(metadata);
  for (const layer of rootLayers) {
    const name = getFirstLeafName(layer);
    if (name) {
      return name;
    }
  }
  return null;
}

/** Returns a CRS advertised by the selected layer or source metadata. */
export function getSourceCoordinateReferenceSystem(metadata: unknown): string | undefined {
  const firstLayer = findFirstLeaf(getMetadataLayers(metadata)) as
    | {crs?: unknown[]; srs?: unknown[]}
    | undefined;
  const coordinateReferenceSystems = firstLayer?.crs?.length ? firstLayer.crs : firstLayer?.srs;
  const normalizedCoordinateReferenceSystems = coordinateReferenceSystems
    ?.map(getCoordinateReferenceSystemIdentifier)
    .filter((value): value is string => Boolean(value));
  const preferredCoordinateReferenceSystem = normalizedCoordinateReferenceSystems?.find(value =>
    /EPSG:(3857|4326)|CRS:84/i.test(value)
  );
  return (
    preferredCoordinateReferenceSystem ||
    normalizedCoordinateReferenceSystems?.[0] ||
    getMetadataCrs(metadata)
  );
}

/** Converts a CRS identifier or PROJJSON authority object into a stable identifier. */
export function getCoordinateReferenceSystemIdentifier(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const coordinateReferenceSystem = value as {
    id?: {authority?: string; code?: string | number};
    ids?: Array<{authority?: string; code?: string | number}>;
  };
  const identifier = [coordinateReferenceSystem.id, ...(coordinateReferenceSystem.ids || [])].find(
    candidate => candidate?.authority && candidate.code !== undefined
  );
  return identifier?.authority && identifier.code !== undefined
    ? `${identifier.authority}:${identifier.code}`
    : undefined;
}

/** Creates a common view-state hint from normalized metadata and source view state. */
export async function createSourceViewState(
  source: unknown,
  metadata: unknown
): Promise<SourceLayerViewState | null> {
  const sourceWithViewState = source as {getViewState?: () => unknown};
  const sourceViewState = sourceWithViewState?.getViewState
    ? await sourceWithViewState.getViewState()
    : null;
  const viewState = sourceViewState as {
    cartographicCenter?: number[];
    zoom?: number;
    boundingVolume?: {cartographicBounds?: [number[], number[]]};
  } | null;
  const metadataBounds = getMetadataBounds(metadata);
  const volumeBounds = viewState?.boundingVolume?.cartographicBounds;
  const bounds = metadataBounds || normalizeBounds(volumeBounds);
  const cartographicCenter = viewState?.cartographicCenter;

  if (!bounds && !cartographicCenter && viewState?.zoom === undefined) {
    return null;
  }

  const longitude =
    cartographicCenter?.[0] ?? (bounds ? (bounds[0][0] + bounds[1][0]) / 2 : undefined);
  const latitude =
    cartographicCenter?.[1] ?? (bounds ? (bounds[0][1] + bounds[1][1]) / 2 : undefined);
  const elevation = cartographicCenter?.[2] ?? 0;
  return {
    bounds,
    longitude,
    latitude,
    zoom: viewState?.zoom ?? (bounds ? estimateZoom(bounds) : undefined),
    target:
      longitude !== undefined && latitude !== undefined
        ? [longitude, latitude, elevation]
        : undefined,
    crs: getSourceCoordinateReferenceSystem(metadata)
  };
}

/** Releases a source created by the resolver. */
export async function finalizeOwnedSource(source: unknown): Promise<void> {
  const finalizableSource = source as {
    finalize?: () => Promise<void> | void;
    destroy?: () => Promise<void> | void;
    close?: () => Promise<void> | void;
  };
  if (finalizableSource?.finalize) {
    await finalizableSource.finalize();
  } else if (finalizableSource?.destroy) {
    await finalizableSource.destroy();
  } else if (finalizableSource?.close) {
    await finalizableSource.close();
  }
}

function normalizeLoaders(
  loader?: Loader | SourceLoader | Array<Loader | SourceLoader>,
  loaders?: ReadonlyArray<Loader | SourceLoader>
): Array<Loader | SourceLoader> {
  return deduplicateByIdentity([
    ...(Array.isArray(loader) ? loader : loader ? [loader] : []),
    ...(loaders || [])
  ]);
}

async function selectSourceLoader(
  data: string | Blob,
  sourceLoaders: SourceLoader[],
  sourceOptions?: DataSourceOptions
): Promise<SourceLoader | null> {
  if (!sourceLoaders.length) {
    return null;
  }

  const sourceType = getRequestedSourceType(sourceOptions);
  if (sourceType !== 'auto') {
    return sourceLoaders.find(sourceLoader => sourceLoader.type === sourceType) || null;
  }
  if (sourceLoaders.length === 1) {
    return sourceLoaders[0];
  }

  return (await selectLoader(data, sourceLoaders, {
    ...(sourceOptions as any),
    core: {
      ...sourceOptions?.core,
      ignoreRegisteredLoaders: true,
      nothrow: true
    }
  })) as SourceLoader | null;
}

function getRequestedSourceType(sourceOptions?: DataSourceOptions): string {
  return sourceOptions?.core?.type || (sourceOptions?.type as string | undefined) || 'auto';
}

function injectParserLoaders(
  sourceOptions: DataSourceOptions | undefined,
  parserLoaders: Loader[]
): DataSourceOptions {
  const existingLoaders = sourceOptions?.core?.loaders || [];
  return {
    ...sourceOptions,
    core: {
      ...sourceOptions?.core,
      loaders: deduplicateByIdentity([...existingLoaders, ...parserLoaders])
    }
  };
}

function isPointCloudTilesetSource(value: unknown): boolean {
  return hasMethods(value, ['initialize', 'getRootTile', 'getChildren', 'loadTileContent']);
}

function isRasterSource(value: unknown): boolean {
  return hasMethods(value, ['getMetadata', 'getRaster']);
}

function isImageSource(value: unknown): boolean {
  return hasMethods(value, ['getMetadata', 'getImage']);
}

function isVectorSource(value: unknown): boolean {
  return hasMethods(value, ['getMetadata', 'getSchema', 'getFeatures']);
}

function isTileSource(value: unknown): boolean {
  return hasMethods(value, ['getMetadata', 'getTileData']);
}

function hasMethods(value: unknown, methodNames: string[]): boolean {
  return Boolean(
    value &&
      typeof value === 'object' &&
      methodNames.every(
        methodName => typeof (value as Record<string, unknown>)[methodName] === 'function'
      )
  );
}

function createUnsupportedSourceError(value: unknown, sourceLoader?: SourceLoader): Error {
  const methods =
    value && typeof value === 'object'
      ? Object.getOwnPropertyNames(Object.getPrototypeOf(value) || {})
          .concat(Object.keys(value as Record<string, unknown>))
          .filter(name => typeof (value as Record<string, unknown>)[name] === 'function')
          .filter((name, index, names) => names.indexOf(name) === index)
          .sort()
      : [];
  const loaderLabel = sourceLoader ? ` from source loader "${sourceLoader.type}"` : '';
  const capabilityLabel = methods.length ? ` Detected methods: ${methods.join(', ')}.` : '';
  return new Error(
    `SourceLayer resolved an unsupported runtime${loaderLabel}.${capabilityLabel} Supported visual sources expose image, vector, raster, 2D tile, point-cloud tileset, or 3D tileset contracts.`
  );
}

function getMetadataLayers(metadata: unknown): unknown[] {
  const typedMetadata = metadata as {layers?: unknown[]; layer?: {layers?: unknown[]}} | null;
  return typedMetadata?.layers || typedMetadata?.layer?.layers || [];
}

function getFirstLeafName(layer: unknown): string | null {
  const typedLayer = layer as {name?: string; layers?: unknown[]};
  if (typedLayer.layers?.length) {
    for (const childLayer of typedLayer.layers) {
      const childName = getFirstLeafName(childLayer);
      if (childName) {
        return childName;
      }
    }
    return null;
  }
  return typedLayer.name || null;
}

function findFirstLeaf(layers: unknown[]): unknown | undefined {
  for (const layer of layers) {
    const typedLayer = layer as {layers?: unknown[]};
    if (typedLayer.layers?.length) {
      const childLayer = findFirstLeaf(typedLayer.layers);
      if (childLayer) {
        return childLayer;
      }
    } else {
      return layer;
    }
  }
  return undefined;
}

function getMetadataBounds(metadata: unknown): [[number, number], [number, number]] | undefined {
  const typedMetadata = metadata as {
    boundingBox?: unknown;
    layers?: unknown[];
    layer?: unknown;
  } | null;
  return (
    normalizeBounds(typedMetadata?.boundingBox) ||
    getFirstNamedLeafBounds(typedMetadata?.layers) ||
    getFirstNamedLeafBounds(typedMetadata?.layer ? [typedMetadata.layer] : undefined)
  );
}

/** Finds bounds on the first named leaf using the same traversal as automatic layer selection. */
function getFirstNamedLeafBounds(
  layers: unknown[] | undefined
): [[number, number], [number, number]] | undefined {
  const firstNamedLeaf = findFirstNamedLeaf(layers);
  return normalizeBounds((firstNamedLeaf as {boundingBox?: unknown} | undefined)?.boundingBox);
}

/** Finds the first named leaf in depth-first order, including leaves without bounds. */
function findFirstNamedLeaf(layers: unknown[] | undefined): unknown | undefined {
  for (const layer of layers || []) {
    const typedLayer = layer as {name?: unknown; layers?: unknown[]};
    if (typedLayer.layers?.length) {
      const childLayer = findFirstNamedLeaf(typedLayer.layers);
      if (childLayer) {
        return childLayer;
      }
    } else if (typeof typedLayer.name === 'string') {
      return layer;
    }
  }
  return undefined;
}

function normalizeBounds(value: unknown): [[number, number], [number, number]] | undefined {
  if (!Array.isArray(value) || value.length < 2) {
    return undefined;
  }
  if (Array.isArray(value[0]) && Array.isArray(value[1])) {
    return [
      [Number(value[0][0]), Number(value[0][1])],
      [Number(value[1][0]), Number(value[1][1])]
    ];
  }
  if (value.length >= 4) {
    return [
      [Number(value[0]), Number(value[1])],
      [Number(value[2]), Number(value[3])]
    ];
  }
  return undefined;
}

function getMetadataCrs(metadata: unknown): string | undefined {
  const typedMetadata = metadata as {crs?: unknown} | null;
  return getCoordinateReferenceSystemIdentifier(typedMetadata?.crs);
}

function estimateZoom(bounds: [[number, number], [number, number]]): number {
  const longitudeSpan = Math.max(Math.abs(bounds[1][0] - bounds[0][0]), 1e-9);
  const latitudeSpan = Math.max(Math.abs(bounds[1][1] - bounds[0][1]), 1e-9);
  return Math.max(0, Math.min(24, Math.log2(360 / Math.max(longitudeSpan, latitudeSpan))));
}

function deduplicateByIdentity<T extends object>(values: T[]): T[] {
  return Array.from(new Set(values));
}
