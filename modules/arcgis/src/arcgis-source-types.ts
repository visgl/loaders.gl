// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import type {ImageLoaderOptions} from '@loaders.gl/images';
import type {MVTLoaderOptions} from '@loaders.gl/mvt';

/** Static source metadata shared by lazy descriptors and runtime loaders. */
type ArcGISSourceMetadata = Omit<SourceLoader, 'dataType' | 'batchType' | 'createDataSource'>;

/** Parameters for ArcGIS FeatureServer query requests. */
export type ArcGISFeatureServiceQueryOptions = {
  /** Include feature geometries in the response. */
  returnGeometry?: boolean;
  /** SQL where clause. */
  where?: string;
  /** Output spatial reference. */
  outSR?: string | number;
  /** Output fields. */
  outFields?: string | string[];
  /** Input spatial reference for supplied geometry. */
  inSR?: string | number;
  /** Filter geometry as an ArcGIS REST geometry string. */
  geometry?: string;
  /** Filter geometry type. */
  geometryType?:
    | 'esriGeometryEnvelope'
    | 'esriGeometryPoint'
    | 'esriGeometryPolyline'
    | 'esriGeometryPolygon';
  /** Spatial relationship for geometry filters. */
  spatialRel?:
    | 'esriSpatialRelIntersects'
    | 'esriSpatialRelContains'
    | 'esriSpatialRelCrosses'
    | 'esriSpatialRelEnvelopeIntersects'
    | 'esriSpatialRelIndexIntersects'
    | 'esriSpatialRelOverlaps'
    | 'esriSpatialRelTouches'
    | 'esriSpatialRelWithin';
  /** Geometry precision. */
  geometryPrecision?: number;
  /** Query result type. */
  resultType?: 'none' | 'standard' | 'tile';
  /** Restrict retrieval to these object IDs. */
  objectIds?: (number | string)[] | string;
  /** Time instant or extent in ArcGIS REST syntax. */
  time?: string | number;
  /** Explicit offset for queryFeaturePage(); complete queries manage this themselves. */
  resultOffset?: number;
  /** Explicit page limit for queryFeaturePage(). */
  resultRecordCount?: number;
  /** Explicit ordering for queryFeaturePage(); complete queries order by object ID. */
  orderByFields?: string;
  /** Response format hint; spatial reads use GeoJSON and nonspatial tables use JSON. */
  f?: 'geojson' | 'json' | 'pjson';
};

/** Options for the ArcGIS FeatureServer source. */
export type ArcGISFeatureServerSourceLoaderOptions = DataSourceOptions & {
  'arcgis-feature-server'?: {
    /** Default ArcGIS query request parameters. */
    queryParameters?: Partial<ArcGISFeatureServiceQueryOptions>;
  };
};

/** Options for the ArcGIS ImageServer source. */
export type ArcGISImageSourceLoaderProps = DataSourceOptions &
  ImageLoaderOptions & {
    'arcgis-image-server'?: {
      /** Default ArcGIS exportImage request parameters. */
      exportImageParameters?: Partial<ArcGISExportImageParameters>;
    };
  };

/** Parameters for ArcGIS ImageServer exportImage requests. */
export type ArcGISExportImageParameters = {
  /** Bounding box of the requested image. */
  bbox: [number, number, number, number];
  /** Spatial reference of the supplied bbox. */
  bboxSR?: string | number;
  /** Pixel width of returned image. */
  width: number;
  /** Pixel height of returned image. */
  height: number;
  /** Spatial reference of the returned image. */
  imageSR?: string | number;
  /** Requested image format. */
  format?: 'jpgpng' | 'png' | 'png8' | 'png24' | 'jpg' | 'bmp' | 'gif' | 'tiff' | 'png32' | 'lerc';
  /** Requested pixel type. */
  pixelType?: 'U1' | 'U2' | 'U4' | 'U8' | 'S8' | 'U16' | 'S16' | 'U32' | 'S32' | 'F32' | 'F64';
  /** NoData pixel value. */
  noData?: string | number;
  /** NoData interpretation mode. */
  noDataInterpretation?: 'esriNoDataMatchAny' | 'esriNoDataMatchAll';
  /** Resampling interpolation. */
  interpolation?: string;
  /** Compression type. */
  compression?: string;
  /** Compression quality. */
  compressionQuality?: number;
  /** Band ids to export. */
  bandIds?: string | number[];
  /** Mosaic rule JSON string or object. */
  mosaicRule?: string | Record<string, unknown>;
  /** Rendering rule JSON string or object. */
  renderingRule?: string | Record<string, unknown>;
  /** ArcGIS response format. */
  f?: 'image' | 'json' | 'pjson';
};

/** Options for the ArcGIS ImageServer tile source. */
export type ArcGISImageTileSourceLoaderOptions = DataSourceOptions &
  ImageLoaderOptions & {
    'arcgis-image-server-tiles'?: {
      /** Tile size used for exportImage requests. */
      tileSize?: number;
      /** Optional service URL pool for simple request distribution. */
      urls?: string[];
      /** Additional exportImage parameters. */
      parameters?: Record<string, string | number | boolean>;
      /** Response format, using LERC for analytical raster tiles. */
      format?: 'png32' | 'lerc';
    };
  };

/** Options for an ArcGIS cached MapServer tile source. */
export type ArcGISMapTileSourceLoaderOptions = DataSourceOptions &
  ImageLoaderOptions & {
    'arcgis-map-server'?: {
      /** Select cached tiles, dynamic export tiles, or automatic metadata-based selection. */
      mode?: 'cached' | 'dynamic' | 'auto';
      /** Tile size used for dynamic export requests. */
      tileSize?: number;
      /** Optional custom tile URL template. */
      urlTemplate?: string;
      /** Optional service URL pool for simple request distribution. */
      urls?: string[];
      /** Additional query parameters sent to the metadata endpoint. */
      parameters?: Record<string, string>;
      /** Metadata document supplied by the application. */
      metadata?: ArcGISMapServerMetadata;
      /** Default parameters forwarded to MapServer `export` requests. */
      exportParameters?: Record<string, string | number | boolean>;
    };
  };

/** Relevant normalized fields from an ArcGIS MapServer metadata document. */
export type ArcGISMapServerMetadata = {
  name?: string;
  description?: string;
  serviceDescription?: string;
  copyrightText?: string;
  fullExtent?: {xmin: number; ymin: number; xmax: number; ymax: number; spatialReference?: unknown};
  spatialReference?: unknown;
  tileInfo?: {
    lods?: {level: number}[];
    rows?: number;
    cols?: number;
    format?: string;
    spatialReference?: unknown;
    origin?: {x: number; y: number};
  };
};

/** Parameters that can be changed between ArcGIS map tile requests. */
export type ArcGISMapTileParameters = Record<string, string | number | boolean>;

/** Parameters accepted by the ArcGIS SceneServer query endpoint. */
export type ArcGISSceneQueryOptions = {
  /** SQL where clause. */
  where?: string;
  /** Object IDs to include. */
  objectIds?: number[] | string;
  /** Geometry filter encoded using ArcGIS REST geometry syntax. */
  geometry?: unknown;
  /** Geometry type for the geometry filter. */
  geometryType?: string;
  /** Spatial relationship for the geometry filter. */
  spatialRel?: string;
  /** Fields to return. */
  outFields?: string | string[];
  /** Whether feature geometry should be included. */
  returnGeometry?: boolean;
  /** Input spatial reference. */
  inSR?: string | number | object;
  /** Output spatial reference. */
  outSR?: string | number | object;
  /** ArcGIS result type. */
  resultType?: string;
  /** Result page offset. */
  resultOffset?: number;
  /** Maximum records in one page. */
  resultRecordCount?: number;
  /** Response format. */
  f?: 'json' | 'pjson';
  /** Abort signal for the request. */
  signal?: AbortSignal;
};

/** Normalized result returned by a SceneServer query. */
export type ArcGISSceneQueryResult = {
  /** Returned SceneServer features. */
  features: unknown[];
  /** Field metadata advertised by the layer. */
  fields?: unknown[];
  /** Whether another page is available. */
  exceededTransferLimit?: boolean;
  /** Original response metadata for advanced consumers. */
  rawMetadata?: unknown;
};

/** Options for an ArcGIS SceneServer source. */
export type ArcGISSceneServerSourceOptions = DataSourceOptions & {
  'arcgis-scene-server'?: {
    /** Layer identifier used when the input URL ends at `/SceneServer`. */
    layerId?: number | string;
    /** ArcGIS token applied to metadata and tile-resource requests. */
    token?: string;
    /** Optional metadata document for offline or preloaded use. */
    metadata?: unknown;
  };
};

/** ArcGIS vector tile service metadata. */
export type ArcGISVectorTileServiceMetadata = {
  /** Human-readable service description. */
  serviceDescription?: string;
  /** Map name exposed by the service. */
  mapName?: string;
  /** Tile grid information. */
  tileInfo?: {
    /** Tile width in pixels. */
    cols?: number;
    /** Tile height in pixels. */
    rows?: number;
    /** Tile format, normally pbf. */
    format?: string;
    /** Tile origin. */
    origin?: {x: number; y: number};
    /** Tile grid spatial reference. */
    spatialReference?: {wkid?: number; latestWkid?: number};
    /** Levels of detail. */
    lods?: Array<{level: number; resolution: number; scale?: number}>;
  };
  /** Full service extent. */
  fullExtent?: {xmin: number; ymin: number; xmax: number; ymax: number};
  /** Initial service extent. */
  initialExtent?: {xmin: number; ymin: number; xmax: number; ymax: number};
};

/** Options for the ArcGIS VectorTileServer source. */
export type ArcGISVectorTileServerSourceLoaderOptions = DataSourceOptions &
  MVTLoaderOptions & {
    'arcgis-vector-tile-server'?: {
      /** Optional MVT parser options. */
      mvt?: MVTLoaderOptions['mvt'];
    };
  };

/** Shared ArcGISFeatureServerSourceLoader metadata, without runtime or lazy-loading dependencies. */
export const ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA = {
  name: 'ArcGISFeatureServer',
  id: 'arcgis-feature-server',
  module: 'arcgis',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-feature-server',
  fromUrl: true,
  fromBlob: false,
  options: {
    url: undefined!,
    'arcgis-feature-server': {}
  },
  defaultOptions: {
    url: undefined!,
    'arcgis-feature-server': {}
  },
  testURL: (url: string): boolean =>
    /\/featureserver(?:[/?#]|$)/i.test(url) || /\/mapserver\/\d+(?:[/?#]|$)/i.test(url)
} as const satisfies ArcGISSourceMetadata;

/** Shared ArcGISImageServerSourceLoader metadata, without runtime or lazy-loading dependencies. */
export const ARCGIS_IMAGE_SERVER_SOURCE_LOADER_METADATA = {
  name: 'ArcGISImageServer',
  id: 'arcgis-image-server',
  module: 'arcgis',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-image-server',
  fromUrl: true,
  fromBlob: false,
  options: {
    'arcgis-image-server': {
      // TODO - add options here
    }
  },
  defaultOptions: {
    'arcgis-image-server': {
      // TODO - add options here
    }
  },
  testURL: (url: string): boolean => url.toLowerCase().includes('imageserver')
} as const satisfies ArcGISSourceMetadata;

/** Shared ArcGISImageTileSourceLoader metadata, without runtime or lazy-loading dependencies. */
export const ARCGIS_IMAGE_TILE_SOURCE_LOADER_METADATA = {
  name: 'ArcGIS ImageServer tiles',
  id: 'arcgis-image-server-tiles',
  module: 'arcgis',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-image-server-tiles',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-image-server-tiles': {}},
  defaultOptions: {'arcgis-image-server-tiles': {}},
  testURL: (url: string): boolean => /imageserver/i.test(url)
} as const satisfies ArcGISSourceMetadata;

/** Shared ArcGISMapTileSourceLoader metadata, without runtime or lazy-loading dependencies. */
export const ARCGIS_MAP_TILE_SOURCE_LOADER_METADATA = {
  name: 'ArcGIS MapServer tiles',
  id: 'arcgis-map-server',
  module: 'arcgis',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-map-server',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-map-server': {}},
  defaultOptions: {'arcgis-map-server': {}},
  testURL: (url: string): boolean =>
    /mapserver/i.test(url) && !/imageserver|featureserver/i.test(url)
} as const satisfies ArcGISSourceMetadata;

/** Shared ArcGISSceneServerSourceLoader metadata, without runtime or lazy-loading dependencies. */
export const ARCGIS_SCENE_SERVER_SOURCE_LOADER_METADATA = {
  name: 'ArcGIS SceneServer',
  id: 'arcgis-scene-server',
  module: 'arcgis',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/json'],
  type: 'arcgis-scene-server',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-scene-server': {}},
  defaultOptions: {'arcgis-scene-server': {}},
  testURL: (url: string): boolean => /\/SceneServer(?:[\/?#]|$)/i.test(url)
} as const satisfies ArcGISSourceMetadata;

/** Shared ArcGISVectorTileServerSourceLoader metadata, without runtime or lazy-loading dependencies. */
export const ARCGIS_VECTOR_TILE_SERVER_SOURCE_LOADER_METADATA = {
  name: 'ArcGIS VectorTileServer',
  id: 'arcgis-vector-tile-server',
  module: 'arcgis',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/vnd.mapbox-vector-tile', 'application/x-protobuf'],
  type: 'arcgis-vector-tile-server',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-vector-tile-server': {}},
  defaultOptions: {'arcgis-vector-tile-server': {}},
  testURL: (url: string): boolean => /\/vectortileserver(?:[\/?#]|$)/i.test(url)
} as const satisfies ArcGISSourceMetadata;
