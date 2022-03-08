import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  Schema,
  GeoJSONRowTable,
  GeoJSONRowTableBatch,
  ObjectRowTable,
  BinaryGeometry
} from '@loaders.gl/schema';

export type SHPLoaderOptions = LoaderOptions & {
  shp?: {
    _maxDimensions?: number;
  };
};

export type DBFLoaderOptions = LoaderOptions & {
  dbf?: {
    encoding?: string;
    shape?: 'rows' | 'table' | 'object-row-table';
  };
};

export type ShapefileLoaderOptions = LoaderOptions &
  SHPLoaderOptions & {
    shapefile?: {
      shape?: 'geojson';
    };
    gis?: {
      reproject?: boolean;
      _targetCrs?: string;
      /** @deprecated. Use options.shapefile.shape */
      format?: 'geojson';
    };
  };

export type ShapefileMetadata = {
  encoding?: string;
  prj?: string;
  shx?: SHXOutput;
  header?: SHPHeader;
};

export type ShapefileBatchOutput = GeoJSONRowTableBatch & {
  _metadata: {
    shapefile: ShapefileMetadata;
  };
};

export type ShapefileOutput = GeoJSONRowTable & {
  _metadata: {
    shapefile: ShapefileMetadata;
  };
};

export type DBFRowsOutput = ObjectRowTable['data'];

/**
 * DBF Table output. Deprecated in favor of ObjectRowTable
 * @deprecated
 */
export interface DBFTableOutput {
  schema?: Schema;
  rows: DBFRowsOutput;
}

export type DBFHeader = {
  // Last updated date
  year: number;
  month: number;
  day: number;
  // Number of records in data file
  nRecords: number;
  // Length of header in bytes
  headerLength: number;
  // Length of each record
  recordLength: number;
  // Not sure if this is usually set
  languageDriver: number;
};

export type DBFField = {
  name: string;
  dataType: string;
  fieldLength: number;
  decimal: number;
};

export type DBFResult = {
  data: {[key: string]: any}[];
  schema?: Schema;
  error?: string;
  dbfHeader?: DBFHeader;
  dbfFields?: DBFField[];
  progress?: {
    bytesUsed: number;
    rowsTotal: number;
    rows: number;
  };
};

export type SHXOutput = {
  offsets: Int32Array;
  lengths: Int32Array;
};

export type SHPHeader = {
  /** SHP Magic number */
  magic: number;

  /** Number of bytes in file */
  length: number;
  version: number;
  type: number;
  bbox: {
    minX: number;
    minY: number;
    minZ: number;
    minM: number;
    maxX: number;
    maxY: number;
    maxZ: number;
    maxM: number;
  };
};

export type SHPResult = {
  geometries: (BinaryGeometry | null)[];
  header?: SHPHeader;
  error?: string;
  progress: {
    bytesUsed: number;
    bytesTotal: number;
    rows: number;
  };
  currentIndex: number;
};
