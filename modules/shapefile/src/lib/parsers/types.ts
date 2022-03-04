import {Schema} from '@loaders.gl/schema';
import type {LoaderOptions} from '@loaders.gl/loader-utils';

export type ShapefileSupportedShapes = 'geojson';

export type SHPLoaderOptions = LoaderOptions & {
  shp?: {
    _maxDimensions?: number;
  }
}

export type DBFLoaderOptions = LoaderOptions & {
  dbf?: {
    encoding?: string;
    shape?: 'rows' | 'table' | 'object-row-table';
  }
}

export type ShapefileLoaderOptions = LoaderOptions & SHPLoaderOptions & {
  shapefile?: {
    shape?: ShapefileSupportedShapes;
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
    format?: ShapefileSupportedShapes;
  };
};

type DBFRowsOutput = object[];

interface DBFTableOutput {
  schema?: Schema;
  rows: DBFRowsOutput;
}

type DBFHeader = {
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

type DBFField = {
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
