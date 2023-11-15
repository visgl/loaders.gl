import {Schema, ObjectRowTable} from '@loaders.gl/schema';
import type {LoaderOptions} from '@loaders.gl/loader-utils';

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
      shape?: 'geojson-table';
    };
    gis?: {
      reproject?: boolean;
      _targetCrs?: string;
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
