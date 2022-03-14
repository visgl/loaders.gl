import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {GeoJSONRowTable, FeatureCollection, ColumnarTable, BinaryFeatures} from '@loaders.gl/schema';


export type GeoJSONRowTableOptions = {
  flatgeobuf?: {
    shape?: 'geojson-row-table'
  },
}
export type ColumnarTableOptions = {
  flatgeobuf?: {
    shape?: 'columnar-table'
  },
}
export type GeoJSONOptions = {
  flatgeobuf?: {
    shape?: 'geojson'
  },
}
export type BinaryOptions = {
  flatgeobuf?: {
    shape?: 'binary'
  },
}

export type FlatGeobufLoaderOptions = LoaderOptions & {
  flatgeobuf?: {
    shape?: 'geojson-row-table' | 'columnar-table' | 'geojson' | 'binary' | string;
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
    /** @deprecated Use options.flatgeobuf.shape */
    format?: 'geojson-row-table' | 'columnar-table' | 'geojson' | 'binary' | string;
  };
};

export type ReturnTypes =
  | GeoJSONRowTable
  | FeatureCollection
  | ColumnarTable
  | BinaryFeatures
