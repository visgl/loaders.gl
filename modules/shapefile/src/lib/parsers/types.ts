// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, ObjectRowTable} from '@loaders.gl/schema';
import type {StrictLoaderOptions} from '@loaders.gl/loader-utils';

export type SHPLoaderOptions = StrictLoaderOptions & {
  shp?: {
    _maxDimensions?: number;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

export type DBFLoaderOptions = StrictLoaderOptions & {
  dbf?: {
    encoding?: string;
    shape?: 'rows' | 'table' | 'object-row-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

export type ShapefileLoaderOptions = StrictLoaderOptions &
  SHPLoaderOptions &
  DBFLoaderOptions & {
    shapefile?: {
      shape?: 'geojson-table' | 'v3';
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
