// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {Feature} from '@loaders.gl/gis';
import {
  LoaderContext,
  parseInBatchesFromContext,
  parseFromContext,
  toArrayBufferIterator
} from '@loaders.gl/loader-utils';
import {convertWKBToGeometry, transformGeoJsonCoords} from '@loaders.gl/gis';
import type {
  Feature,
  GeoJsonProperties,
  GeoJSONTable,
  Geometry,
  ObjectRowTable,
  ObjectRowTableBatch
} from '@loaders.gl/schema';
import {Proj4Projection} from '@math.gl/proj4';

import type {SHXOutput} from './parse-shx';
import type {SHPResult} from './parse-shp';
import type {SHPHeader} from './parse-shp-header';
import type {ShapefileLoaderOptions} from './types';
import {parseShx} from './parse-shx';
import {zipBatchIterators} from '../streaming/zip-batch-iterators';
import {SHPLoaderWithParser} from '../../shp-loader-with-parser';
import {DBFLoaderWithParser} from '../../dbf-loader-with-parser';

export interface ShapefileOutput {
  encoding?: string;
  prj?: string;
  shx?: SHXOutput;
  header: SHPHeader;
  data: Feature[];
}
/**
 * Parsing of file in batches
 */
// eslint-disable-next-line max-statements, complexity
export async function* parseShapefileInBatches(
  asyncIterator:
    | AsyncIterable<ArrayBufferLike | ArrayBufferView>
    | Iterable<ArrayBufferLike | ArrayBufferView>,
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): AsyncIterable<ShapefileOutput> {
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const shapeIterable = await parseInBatchesFromContext(
    toArrayBufferIterator(asyncIterator),
    SHPLoaderWithParser,
    {
      ...options,
      shp: {
        ...options?.shp,
        shape: 'wkb'
      }
    },
    context!
  );

  const shapeIterator: AsyncIterator<any> =
    shapeIterable[Symbol.asyncIterator]?.() || shapeIterable[Symbol.iterator]?.();

  // parse properties
  let propertyIterator: AsyncIterator<any> | null = null;
  const dbfResponse = context?.url
    ? await context?.fetch(replaceExtension(context.url, 'dbf')).catch(() => null)
    : null;
  if (dbfResponse?.ok) {
    const propertyIterable = await parseInBatchesFromContext(
      dbfResponse,
      DBFLoaderWithParser,
      {
        ...options,
        dbf: {
          ...options?.dbf,
          shape: 'object-row-table',
          encoding: cpg || 'latin1'
        }
      },
      context!
    );
    propertyIterator =
      propertyIterable[Symbol.asyncIterator]?.() || propertyIterable[Symbol.iterator]();
  }

  // When `options.metadata` is `true`, there's an extra initial `metadata`
  // object before the iterator starts. zipBatchIterators expects to receive
  // batches of Array objects, and will fail with non-iterable batches, so it's
  // important to skip over the first batch.
  let shapeHeader = (await shapeIterator.next()).value;
  if (shapeHeader && shapeHeader.batchType === 'metadata') {
    shapeHeader = (await shapeIterator.next()).value;
  }

  let dbfHeader: {batchType?: string} = {};
  if (propertyIterator) {
    dbfHeader = (await propertyIterator.next()).value;
    if (dbfHeader && dbfHeader.batchType === 'metadata') {
      dbfHeader = (await propertyIterator.next()).value;
    }
  }

  const zippedIterator: AsyncIterator<ObjectRowTableBatch> = propertyIterator
    ? zipBatchIterators(shapeIterator, propertyIterator, 'object-row-table')
    : shapeIterator;

  const zippedBatchIterable: AsyncIterable<ObjectRowTableBatch> = {
    [Symbol.asyncIterator]() {
      return zippedIterator;
    }
  };

  for await (const batch of zippedBatchIterable) {
    let geometries: (Uint8Array | null)[];
    let properties: GeoJsonProperties[] = [];
    if (!propertyIterator) {
      geometries = batch as unknown as (Uint8Array | null)[];
    } else {
      [geometries, properties] = batch.data as unknown as [
        (Uint8Array | null)[],
        GeoJsonProperties[]
      ];
    }

    const geojsonGeometries = parseGeometries(geometries);
    let features = joinProperties(geojsonGeometries, properties);
    if (reproject) {
      // @ts-ignore
      features = reprojectFeatures(features, prj, _targetCrs);
    }
    yield {
      encoding: cpg,
      prj,
      shx,
      header: shapeHeader,
      data: features
    };
  }
}

/**
 * Parse shapefile
 *
 * @param arrayBuffer
 * @param options
 * @param context
 * @returns output of shapefile
 */
export async function parseShapefile(
  arrayBuffer: ArrayBuffer,
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): Promise<ShapefileOutput | GeoJSONTable> {
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  const {header, geometries} = (await parseFromContext(
    arrayBuffer,
    SHPLoaderWithParser,
    {
      ...options,
      shp: {
        ...options?.shp,
        shape: 'wkb'
      }
    },
    context!
  )) as SHPResult; // {shp: shx}

  const geojsonGeometries = parseGeometries(geometries);

  // parse properties
  let propertyTable: ObjectRowTable | undefined;

  const dbfResponse = context?.url
    ? await context?.fetch(replaceExtension(context.url, 'dbf')).catch(() => null)
    : null;
  if (dbfResponse?.ok) {
    const dbfOptions = {
      ...options,
      dbf: {
        ...options?.dbf,
        shape: 'object-row-table',
        encoding: cpg || 'latin1'
      }
    };
    propertyTable = (await parseFromContext(
      dbfResponse as any,
      DBFLoaderWithParser,
      dbfOptions,
      context!
    )) as ObjectRowTable;
  }

  let features = joinProperties(geojsonGeometries, propertyTable?.data || []);
  if (reproject) {
    features = reprojectFeatures(features, prj, _targetCrs);
  }

  switch (options?.shapefile?.shape) {
    case 'geojson-table':
      return {
        shape: 'geojson-table',
        type: 'FeatureCollection',
        encoding: cpg,
        schema: propertyTable?.schema || {metadata: {}, fields: []},
        prj,
        shx,
        header: header!,
        features
      };
    default:
      return {
        encoding: cpg,
        prj,
        shx,
        header: header!,
        data: features
      };
  }
}

/**
 * Parse geometries
 *
 * @param geometries
 * @returns geometries as an array
 */
function parseGeometries(geometries: (Uint8Array | null)[]): Geometry[] {
  const geojsonGeometries: Geometry[] = [];
  for (const geom of geometries) {
    if (geom) {
      geojsonGeometries.push(convertWKBToGeometry(toArrayBuffer(geom)));
    }
  }
  return geojsonGeometries;
}

function toArrayBuffer(wkb: Uint8Array): ArrayBuffer {
  return wkb.buffer.slice(wkb.byteOffset, wkb.byteOffset + wkb.byteLength) as ArrayBuffer;
}

/**
 * Join properties and geometries into features
 *
 * @param geometries [description]
 * @param  properties [description]
 * @return [description]
 */
function joinProperties(geometries: Geometry[], properties: GeoJsonProperties[]): Feature[] {
  const features: Feature[] = [];
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    const feature: Feature = {
      type: 'Feature',
      geometry,
      // properties can be undefined if dbfResponse above was empty
      properties: (properties && properties[i]) || {}
    };
    features.push(feature);
  }

  return features;
}

/**
 * Reproject GeoJSON features to output CRS
 *
 * @param features parsed GeoJSON features
 * @param sourceCrs source coordinate reference system
 * @param targetCrs †arget coordinate reference system
 * @return Reprojected Features
 */
function reprojectFeatures(features: Feature[], sourceCrs?: string, targetCrs?: string): Feature[] {
  if (!sourceCrs && !targetCrs) {
    return features;
  }

  const projection = new Proj4Projection({from: sourceCrs || 'WGS84', to: targetCrs || 'WGS84'});
  return transformGeoJsonCoords(features, coord => projection.project(coord));
}

/**
 *
 * @param options
 * @param context
 * @returns Promise
 */
// eslint-disable-next-line max-statements
export async function loadShapefileSidecarFiles(
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): Promise<{
  shx?: SHXOutput;
  cpg?: string;
  prj?: string;
}> {
  if (!context?.url || !context.fetch) {
    return {};
  }

  // Attempt a parallel load of the small sidecar files
  const {url, fetch} = context;
  const shxPromise = fetch(replaceExtension(url, 'shx')).catch(() => null);
  const cpgPromise = fetch(replaceExtension(url, 'cpg')).catch(() => null);
  const prjPromise = fetch(replaceExtension(url, 'prj')).catch(() => null);
  await Promise.all([shxPromise, cpgPromise, prjPromise]);

  let shx: SHXOutput | undefined;
  let cpg: string | undefined;
  let prj: string | undefined;

  const shxResponse = await shxPromise;
  if (shxResponse?.ok && !isHtmlFallbackResponse(shxResponse)) {
    const arrayBuffer = await shxResponse.arrayBuffer();
    shx = parseShx(arrayBuffer);
  }

  const cpgResponse = await cpgPromise;
  if (cpgResponse?.ok && !isHtmlFallbackResponse(cpgResponse)) {
    const encoding = await cpgResponse.text();
    // Vite serves the test page for missing sidecar files; only accept plausible encoding labels.
    if (/^[\w-]+$/.test(encoding.trim())) {
      cpg = encoding;
    }
  }

  const prjResponse = await prjPromise;
  if (prjResponse?.ok && !isHtmlFallbackResponse(prjResponse)) {
    prj = await prjResponse.text();
  }

  return {
    shx,
    cpg,
    prj
  };
}

function isHtmlFallbackResponse(response: Response): boolean {
  return (response.headers.get('content-type') || '').includes('text/html');
}

/**
 * Replace the extension at the end of a path.
 *
 * Matches the case of new extension with the case of the original file extension,
 * to increase the chance of finding files without firing off a request storm looking for various case combinations
 *
 * NOTE: Extensions can be both lower and uppercase
 * per spec, extensions should be lower case, but that doesn't mean they always are. See:
 * calvinmetcalf/shapefile-js#64, mapserver/mapserver#4712
 * https://trac.osgeo.org/mapserver/ticket/166
 */
export function replaceExtension(url: string, newExtension: string): string {
  const baseName = basename(url);
  const extension = extname(url);
  const isUpperCase = extension === extension.toUpperCase();
  if (isUpperCase) {
    newExtension = newExtension.toUpperCase();
  }
  return `${baseName}.${newExtension}`;
}

// NOTE - this gives the entire path minus extension (i.e. NOT same as path.basename)
/**
 * @param url
 * @returns string
 */
function basename(url: string): string {
  const extIndex = url && url.lastIndexOf('.');
  if (typeof extIndex === 'number') {
    return extIndex >= 0 ? url.substr(0, extIndex) : '';
  }
  return extIndex;
}
/**
 * @param url
 * @returns string
 */
function extname(url: string): string {
  const extIndex = url && url.lastIndexOf('.');
  if (typeof extIndex === 'number') {
    return extIndex >= 0 ? url.substr(extIndex + 1) : '';
  }
  return extIndex;
}
