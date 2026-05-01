// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Proj4Projection} from '@math.gl/proj4';
import type {
  Feature,
  Schema
} from '@loaders.gl/schema';
import {convertGeojsonToBinaryFeatureCollection, transformGeoJsonCoords} from '@loaders.gl/gis';
import type {
  CoreAPI,
  DataSourceOptions,
  GetFeaturesParameters,
  SourceLoader,
  VectorSourceData,
  VectorSourceLayer,
  VectorSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource, VectorSource} from '@loaders.gl/loader-utils';
import {ArrowTableBuilder} from '@loaders.gl/schema-utils';

import {FlatGeobufFormat} from './flatgeobuf-format';
import type {HeaderMeta} from './flatgeobuf/3.27.2';
import {HttpReader} from './flatgeobuf/3.27.2/http-reader';
import {fromFeature as featureToGeoJson} from './flatgeobuf/3.27.2/geojson/feature';
import {getSchemaFromFGBHeader} from './lib/get-schema-from-fgb-header';
import {getProjection, makeArrowRow, makeArrowSchema} from './lib/parse-flatgeobuf';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type FlatGeobufResponseFormat = 'geojson' | 'binary' | 'arrow';

/** Options for `FlatGeobufSourceLoader`. */
export type FlatGeobufSourceLoaderOptions = DataSourceOptions & {
  flatgeobuf?: {
    format?: FlatGeobufResponseFormat;
  };
};

type HeaderInfo = {
  reader: HttpReader;
  schema: Schema;
  arrowSchema: Schema;
  metadata: VectorSourceMetadata;
  layerName: string;
};

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

/**
 * Incrementally load bounding boxes from a spatially indexed FlatGeobuf file.
 */
export const FlatGeobufSourceLoader = {
  dataType: null as unknown as FlatGeobufVectorSource,
  batchType: null as never,
  ...FlatGeobufFormat,
  version: VERSION,
  type: 'flatgeobuf',
  fromUrl: true,
  fromBlob: false,

  options: {
    flatgeobuf: {
      format: 'geojson'
    }
  },

  defaultOptions: {
    flatgeobuf: {
      format: 'geojson'
    }
  },

  testURL: (url: string): boolean => /\.fgb($|[?#])/i.test(url),
  createDataSource: (
    url: string,
    options: FlatGeobufSourceLoaderOptions,
    coreApi?: CoreAPI
  ): FlatGeobufVectorSource => new FlatGeobufVectorSource(url, options, coreApi)
} as const satisfies SourceLoader<FlatGeobufVectorSource>;

/**
 * Runtime vector source backed by indexed FlatGeobuf range requests.
 */
export class FlatGeobufVectorSource
  extends DataSource<string, FlatGeobufSourceLoaderOptions>
  implements VectorSource
{
  /** Shared header, schema, and metadata promise for the current URL. */
  protected headerInfoPromise: Promise<HeaderInfo> | null = null;

  /** Creates a source backed by one remote FlatGeobuf dataset. */
  constructor(data: string, options: FlatGeobufSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, FlatGeobufSourceLoader.defaultOptions, coreApi);
  }

  /** Returns the property schema declared in the FlatGeobuf header. */
  async getSchema(): Promise<Schema> {
    const headerInfo = await this.getHeaderInfo();
    return headerInfo.schema;
  }

  /** Returns normalized metadata for the remote FlatGeobuf dataset. */
  async getMetadata(options: {formatSpecificMetadata?: boolean} = {}): Promise<VectorSourceMetadata> {
    const headerInfo = await this.getHeaderInfo();
    if (!options.formatSpecificMetadata) {
      return headerInfo.metadata;
    }

    return {
      ...headerInfo.metadata,
      formatSpecificMetadata: serializeHeader(headerInfo.reader.header)
    };
  }

  /** Returns indexed features for one viewport-sized bounding box request. */
  async getFeatures(
    parameters: GetFeaturesParameters
  ): Promise<VectorSourceData> {
    assertNotAborted(parameters.signal);

    const headerInfo = await this.getHeaderInfo();
    const format = parameters.format || this.options.flatgeobuf?.format || 'geojson';
    const sourceBoundingBox = projectBoundingBoxToSource(
      parameters.boundingBox,
      parameters.crs,
      headerInfo.reader.header
    );

    const geoJsonFeatures: Feature[] = [];
    for await (const feature of headerInfo.reader.selectBbox(sourceBoundingBox, {
      fetch: this.fetch,
      signal: parameters.signal
    })) {
      assertNotAborted(parameters.signal);
      geoJsonFeatures.push(featureToGeoJson(feature, headerInfo.reader.header) as Feature);
    }

    const reprojectedFeatures = maybeProjectFeatures(
      geoJsonFeatures,
      headerInfo.reader.header,
      parameters.crs
    );

    switch (format) {
      case 'binary':
        return convertGeojsonToBinaryFeatureCollection(reprojectedFeatures);

      case 'arrow': {
        const tableBuilder = new ArrowTableBuilder(headerInfo.arrowSchema);
        for (const feature of reprojectedFeatures) {
          tableBuilder.addObjectRow(makeArrowRow(feature, headerInfo.reader.header));
        }
        return tableBuilder.finishTable();
      }

      case 'geojson':
      default:
        return {
          shape: 'geojson-table',
          schema: headerInfo.schema,
          type: 'FeatureCollection',
          features: reprojectedFeatures
        };
    }
  }

  protected getHeaderInfo(): Promise<HeaderInfo> {
    this.headerInfoPromise ||= loadHeaderInfo(this.url, this.fetch);
    return this.headerInfoPromise;
  }
}

async function loadHeaderInfo(url: string, fetch: FetchLike): Promise<HeaderInfo> {
  const reader = await HttpReader.open(url, {fetch});
  const schema = getSchemaFromFGBHeader(reader.header);
  const arrowSchema = makeArrowSchema(reader.header);
  const layerName = inferLayerName(url, reader.header);

  return {
    reader,
    schema,
    arrowSchema,
    layerName,
    metadata: buildMetadata(layerName, reader.header)
  };
}

function buildMetadata(layerName: string, header: HeaderMeta): VectorSourceMetadata {
  const layer: VectorSourceLayer = {
    name: layerName,
    title: header.title || layerName,
    crs: getLayerCrs(header),
    boundingBox: getBoundingBoxFromHeader(header)
  };

  return {
    name: layerName,
    title: header.title || layerName,
    abstract: header.description || undefined,
    keywords: [],
    layers: [layer]
  };
}

function inferLayerName(url: string, header: HeaderMeta): string {
  if (header.title) {
    return header.title;
  }

  const urlWithoutQuery = url.split(/[?#]/)[0];
  const name = urlWithoutQuery.split('/').pop() || 'flatgeobuf';
  return name.replace(/\.fgb$/i, '') || 'flatgeobuf';
}

function getLayerCrs(header: HeaderMeta): string[] | undefined {
  const crsValues = [header.crs?.code_string, header.crs?.wkt, getEpsgCode(header.crs?.code)]
    .filter(Boolean)
    .map(String);
  return crsValues.length > 0 ? crsValues : undefined;
}

function getBoundingBoxFromHeader(
  header: HeaderMeta
): [[number, number], [number, number]] | undefined {
  const envelope = header.envelope;
  if (!envelope || envelope.length < 4) {
    return undefined;
  }

  return [
    [envelope[0], envelope[1]],
    [envelope[2], envelope[3]]
  ];
}

function projectBoundingBoxToSource(
  boundingBox: [[number, number], [number, number]],
  requestCrs: string | undefined,
  header: HeaderMeta
) {
  const sourceCrs = header.crs?.wkt;
  const outputCrs = requestCrs || 'WGS84';

  if (!sourceCrs || outputCrs === sourceCrs) {
    return toRect(boundingBox);
  }

  try {
    const projection = new Proj4Projection({from: outputCrs, to: sourceCrs});
    const corners = [
      projection.project(boundingBox[0]),
      projection.project([boundingBox[0][0], boundingBox[1][1]]),
      projection.project([boundingBox[1][0], boundingBox[0][1]]),
      projection.project(boundingBox[1])
    ];
    const xs = corners.map(point => point[0]);
    const ys = corners.map(point => point[1]);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  } catch {
    return toRect(boundingBox);
  }
}

function maybeProjectFeatures(
  features: Feature[],
  header: HeaderMeta,
  requestCrs?: string
): Feature[] {
  const outputCrs = requestCrs || 'WGS84';
  const projection = getProjection(header, outputCrs !== (header.crs?.wkt || 'WGS84'), outputCrs);

  if (!projection) {
    return features;
  }

  return transformGeoJsonCoords(features, coords => projection.project(coords));
}

function toRect(boundingBox: [[number, number], [number, number]]) {
  return {
    minX: boundingBox[0][0],
    minY: boundingBox[0][1],
    maxX: boundingBox[1][0],
    maxY: boundingBox[1][1]
  };
}

function serializeHeader(header: HeaderMeta): Record<string, unknown> {
  return {
    ...header,
    envelope: header.envelope ? Array.from(header.envelope) : null
  };
}

function getEpsgCode(code: number | null | undefined): string | null {
  return Number.isFinite(code) ? `EPSG:${code}` : null;
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    throw error;
  }
}
