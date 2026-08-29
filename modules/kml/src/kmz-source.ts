// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, GeoJSONTable, Schema} from '@loaders.gl/schema';
import type {
  CoreAPI,
  DataSourceOptions,
  GetFeaturesParameters,
  SourceLoader,
  VectorSource,
  VectorSourceData,
  VectorSourceLayer,
  VectorSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {
  buildFeatureTableSchema,
  convertFeatureCollectionToArrowTable
} from './lib/feature-collection-to-arrow';
import {KMZFormat} from './kml-format';
import {openKMZArchive, type KMZArchive} from './kmz-archive';
import type {KMLFolder} from './kml-parser';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type KMZSourceOptions = DataSourceOptions & {
  kmz?: {
    format?: 'geojson' | 'arrow';
  };
};

/** Source loader for KMZ archives containing one primary KML document. */
export const KMZSourceLoader = {
  dataType: null as unknown as KMZVectorSource,
  batchType: null as never,
  ...KMZFormat,
  version: VERSION,
  type: 'kmz',
  fromUrl: true,
  fromBlob: true,
  options: {kmz: {format: 'geojson'}},
  defaultOptions: {kmz: {format: 'geojson'}},
  testURL: (url: string): boolean => /\.kmz($|[?#])/i.test(url),
  testData: (data: Blob): boolean =>
    ['application/vnd.google-earth.kmz', 'application/vnd.google-earth.kmz+zip'].includes(
      data.type.toLowerCase()
    ),
  createDataSource: (data: string | Blob, options: KMZSourceOptions, coreApi?: CoreAPI) =>
    new KMZVectorSource(data, options, coreApi)
} as const satisfies SourceLoader<KMZVectorSource>;

/** Lazy vector source backed by a KMZ archive. */
export class KMZVectorSource
  extends DataSource<string | Blob, KMZSourceOptions>
  implements VectorSource
{
  protected readonly archivePromise: Promise<KMZArchive>;

  /** Creates a source from a KMZ URL, Blob, or File. */
  constructor(data: string | Blob, options: KMZSourceOptions, coreApi?: CoreAPI) {
    super(data, options, KMZSourceLoader.defaultOptions, coreApi);
    this.archivePromise = openKMZArchive(data, this.fetch);
  }

  /** Opens the archive and parses its primary KML document. */
  async initialize(): Promise<void> {
    await this.archivePromise;
  }

  /** Releases the archive's underlying file handle. */
  async close(): Promise<void> {
    const archive = await this.archivePromise;
    await archive.close();
  }

  /** Returns the schema inferred from Placemark properties. */
  async getSchema(): Promise<Schema> {
    const archive = await this.archivePromise;
    return buildFeatureTableSchema(archive.document.features);
  }

  /** Returns normalized KMZ metadata, including the archive entry names when requested. */
  async getMetadata(
    options: {formatSpecificMetadata?: boolean} = {}
  ): Promise<VectorSourceMetadata> {
    const archive = await this.archivePromise;
    const metadata: VectorSourceMetadata = {
      name: archive.document.name || archive.kmlFileName,
      title: archive.document.name,
      abstract: archive.document.description,
      keywords: [],
      layers: [makeRootLayer(archive.document.features, archive.document.folders)]
    };
    if (options.formatSpecificMetadata) {
      metadata.formatSpecificMetadata = {
        kmlFileName: archive.kmlFileName,
        fileNames: archive.fileNames,
        coordinateReferenceSystem: archive.document.coordinateReferenceSystem,
        overlays: omitRawMetadata(archive.document.overlays),
        networkLinks: omitRawMetadata(archive.document.networkLinks),
        models: omitRawMetadata(archive.document.models),
        styles: archive.document.styles
      };
    }
    return metadata;
  }

  /** Returns lazily decoded bytes for a resource referenced by the primary KML document. */
  async getResource(path: string): Promise<ArrayBuffer> {
    const archive = await this.archivePromise;
    return archive.getResource(path);
  }

  /** Returns all matching Placemark features, optionally filtered by a WGS84 bounding box. */
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    const archive = await this.archivePromise;
    const features = parameters.boundingBox
      ? archive.document.features.filter(feature =>
          featureIntersectsBounds(feature, parameters.boundingBox)
        )
      : archive.document.features;
    const format = parameters.format || this.options.kmz?.format || 'geojson';
    if (format === 'arrow') return convertFeatureCollectionToArrowTable(features);
    if (format === 'binary') {
      throw new Error('KMZVectorSource does not yet support binary geometry output');
    }
    const table: GeoJSONTable = {
      shape: 'geojson-table',
      schema: buildFeatureTableSchema(features),
      type: 'FeatureCollection',
      features
    };
    return table;
  }
}

/** Removes DOM nodes from metadata exposed through the serializable source API. */
function omitRawMetadata<T extends {raw: unknown}>(values: readonly T[]): Array<Omit<T, 'raw'>> {
  return values.map(({raw: _raw, ...value}) => value);
}

function makeRootLayer(
  features: readonly Feature[],
  folders: readonly KMLFolder[]
): VectorSourceLayer {
  const bounds = getFeatureBounds(features);
  return {
    name: 'default',
    title: 'KML features',
    crs: ['OGC:CRS84'],
    boundingBox: bounds,
    layers: folders.map(folder => ({
      name: folder.path.join('/'),
      title: folder.name,
      crs: ['OGC:CRS84'],
      boundingBox: getFeatureBounds(folder.features)
    }))
  };
}

function featureIntersectsBounds(
  feature: Feature,
  bounds: GetFeaturesParameters['boundingBox']
): boolean {
  const featureBounds = getGeometryBounds(feature.geometry);
  if (!featureBounds) return false;
  return !(
    featureBounds[1][0] < bounds[0][0] ||
    featureBounds[0][0] > bounds[1][0] ||
    featureBounds[1][1] < bounds[0][1] ||
    featureBounds[0][1] > bounds[1][1]
  );
}

function getFeatureBounds(
  features: readonly Feature[]
): [[number, number], [number, number]] | undefined {
  const bounds = features.map(feature => getGeometryBounds(feature.geometry)).filter(Boolean);
  if (!bounds.length) return undefined;
  return [
    [
      Math.min(...bounds.map(bound => bound![0][0])),
      Math.min(...bounds.map(bound => bound![0][1]))
    ],
    [Math.max(...bounds.map(bound => bound![1][0])), Math.max(...bounds.map(bound => bound![1][1]))]
  ];
}

function getGeometryBounds(
  geometry: Feature['geometry']
): [[number, number], [number, number]] | undefined {
  if (!geometry) return undefined;
  const bounds = {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity};
  visitGeometryCoordinates(geometry, bounds);
  if (bounds.minX === Infinity) return undefined;
  return [
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.maxY]
  ];
}

function visitGeometryCoordinates(
  geometry: Feature['geometry'],
  bounds: {minX: number; minY: number; maxX: number; maxY: number}
): void {
  if (!geometry) return;
  if ('coordinates' in geometry) {
    visitCoordinates(geometry.coordinates, bounds);
  } else {
    for (const child of geometry.geometries) visitGeometryCoordinates(child, bounds);
  }
}

function visitCoordinates(
  coordinates: unknown,
  bounds: {minX: number; minY: number; maxX: number; maxY: number}
): void {
  if (!Array.isArray(coordinates)) return;
  if (typeof coordinates[0] === 'number') {
    const x = Number(coordinates[0]);
    const y = Number(coordinates[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      bounds.minX = Math.min(bounds.minX, x);
      bounds.minY = Math.min(bounds.minY, y);
      bounds.maxX = Math.max(bounds.maxX, x);
      bounds.maxY = Math.max(bounds.maxY, y);
    }
    return;
  }
  for (const child of coordinates) visitCoordinates(child, bounds);
}
