import type {
  ObjectRowTable,
  Feature,
  BinaryGeometry,
  Geometry,
  ObjectRowTableBatch
} from '@loaders.gl/schema';
import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {
  ShapefileLoaderOptions,
  SHXOutput,
  SHPHeader,
  SHPResult,
  ShapefileBatchOutput,
  ShapefileOutput
} from './types';

import {binaryToGeometry, transformGeoJsonCoords} from '@loaders.gl/gis';
import {Proj4Projection} from '@math.gl/proj4';
import {parseShx} from './parse-shx';
import {zipBatchIterators} from '../streaming/zip-batch-iterators';
import {SHPLoader} from '../../shp-loader';
import {DBFLoader} from '../../dbf-loader';

/**
 * Parsing of file in batches
 */
// eslint-disable-next-line max-statements, complexity
export async function* parseShapefileInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options: ShapefileLoaderOptions,
  context: LoaderContext
): AsyncIterable<ShapefileBatchOutput> {
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);
  // We don't use shape yet
  // const shape = options?.gis?.format || options?.shapefile?.shape || 'geojson';

  // parse geometries
  // @ts-ignore context must be defined
  const shapeIterable: AsyncIterator<(BinaryGeometry | null)[] | SHPHeader> =
    await context.parseInBatches(asyncIterator, SHPLoader, options);

  // parse properties
  let propertyIterable: AsyncIterator<ObjectRowTableBatch> | undefined;
  // @ts-ignore context must be defined
  const dbfResponse = await context.fetch(replaceExtension(context?.url || '', 'dbf'));
  if (dbfResponse.ok) {
    // @ts-ignore context must be defined
    propertyIterable = await context.parseInBatches(dbfResponse, DBFLoader, {
      ...options,
      dbf: {
        encoding: cpg || options?.dbf?.encoding || 'latin1',
        shape: 'object-row-table'
      }
    });
  }

  // When `options.metadata` is `true`, there's an extra initial `metadata`
  // object before the iterator starts. zipBatchIterators expects to receive
  // batches of Array objects, and will fail with non-iterable batches, so it's
  // important to skip over the first batch.
  let shapeHeader = (await shapeIterable.next()).value;
  if (shapeHeader && shapeHeader.batchType === 'metadata') {
    shapeHeader = (await shapeIterable.next()).value;
  }

  let dbfHeader: {batchType?: string} = {};
  if (propertyIterable) {
    dbfHeader = (await propertyIterable.next()).value;
    if (dbfHeader && dbfHeader.batchType === 'metadata') {
      dbfHeader = (await propertyIterable.next()).value;
    }
  }

  // TODO: fix type here
  let iterator;
  if (propertyIterable) {
    iterator = zipBatchIterators(shapeIterable, propertyIterable);
  } else {
    iterator = shapeIterable;
  }

  for await (const item of iterator) {
    let geometries: BinaryGeometry[];
    let properties: ObjectRowTable | undefined;
    if (!propertyIterable) {
      geometries = item;
    } else {
      [geometries, properties] = item;
    }

    const geojsonGeometries = parseBinaryGeometriesToGeoJSON(geometries);
    let features = joinProperties(geojsonGeometries, properties);
    if (reproject) {
      // @ts-ignore
      features = reprojectFeatures(features, prj, _targetCrs);
    }

    const shapefileMetadata = {
      encoding: cpg,
      prj,
      shx,
      header: shapeHeader
    };
    yield {
      batchType: 'data',
      shape: 'geojson-row-table',
      length: features.length,
      data: features,
      _metadata: {
        shapefile: shapefileMetadata
      }
    };
  }
}

/**
 * Parse shapefile
 */
export async function parseShapefile(
  arrayBuffer: ArrayBuffer,
  options: ShapefileLoaderOptions,
  context: LoaderContext
): Promise<ShapefileOutput> {
  const {reproject = false, _targetCrs = 'WGS84'} = options?.gis || {};
  const {shx, cpg, prj} = await loadShapefileSidecarFiles(options, context);

  // parse geometries
  // @ts-ignore context must be defined
  const {header, geometries}: SHPResult = await context.parse(arrayBuffer, SHPLoader, options); // {shp: shx}

  // @ts-expect-error Argument of type '(BinaryGeometry | null)[]' is not assignable to parameter of type 'BinaryGeometry[]'.
  // We should ideally have a null geometry representation within BinaryGeometry
  const geojsonGeometries = parseBinaryGeometriesToGeoJSON(geometries);

  // parse properties
  let properties: ObjectRowTable | undefined;

  // @ts-ignore context must be defined
  const dbfResponse = await context.fetch(replaceExtension(context.url, 'dbf'));
  if (dbfResponse.ok) {
    // @ts-ignore context must be defined
    properties = await context.parse(dbfResponse, DBFLoader, {
      dbf: {
        encoding: cpg || options?.dbf?.encoding || 'latin1',
        shape: 'object-row-table'
      }
    });
  }

  let features = joinProperties(geojsonGeometries, properties);
  if (reproject) {
    features = reprojectFeatures(features, prj, _targetCrs);
  }

  const shapefileMetadata = {
    encoding: cpg,
    prj,
    shx,
    header
  };

  return {
    shape: 'geojson-row-table',
    data: features,
    _metadata: {
      shapefile: shapefileMetadata
    }
  };
}

/**
 * Parse geometries
 *
 * @param geometries
 * @returns geometries as an array
 */
function parseBinaryGeometriesToGeoJSON(geometries: BinaryGeometry[]): Geometry[] {
  const geojsonGeometries: Geometry[] = [];
  for (const geom of geometries) {
    geojsonGeometries.push(binaryToGeometry(geom));
  }
  return geojsonGeometries;
}

/**
 * Join properties and geometries into features
 */
function joinProperties(geometries: Geometry[], properties: ObjectRowTable | undefined): Feature[] {
  const features: Feature[] = [];
  for (let i = 0; i < geometries.length; i++) {
    const geometry = geometries[i];
    const feature: Feature = {
      type: 'Feature',
      geometry,
      // properties can be undefined if dbfResponse above was empty
      properties: properties?.data[i] || {}
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
  return transformGeoJsonCoords(features, (coord) => projection.project(coord));
}

// eslint-disable-next-line max-statements
export async function loadShapefileSidecarFiles(
  options?: ShapefileLoaderOptions,
  context?: LoaderContext
): Promise<{
  shx?: SHXOutput;
  cpg?: string;
  prj?: string;
}> {
  // Attempt a parallel load of the small sidecar files
  // @ts-ignore context must be defined
  const {url, fetch} = context;
  const shxPromise = fetch(replaceExtension(url, 'shx'));
  const cpgPromise = fetch(replaceExtension(url, 'cpg'));
  const prjPromise = fetch(replaceExtension(url, 'prj'));
  await Promise.all([shxPromise, cpgPromise, prjPromise]);

  let shx: SHXOutput | undefined;
  let cpg: string | undefined;
  let prj: string | undefined;

  const shxResponse = await shxPromise;
  if (shxResponse.ok) {
    const arrayBuffer = await shxResponse.arrayBuffer();
    shx = parseShx(arrayBuffer);
  }

  const cpgResponse = await cpgPromise;
  if (cpgResponse.ok) {
    cpg = await cpgResponse.text();
  }

  const prjResponse = await prjPromise;
  if (prjResponse.ok) {
    prj = await prjResponse.text();
  }

  return {
    shx,
    cpg,
    prj
  };
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
