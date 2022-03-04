import type {LoaderOptions} from '@loaders.gl/loader-utils';

export type FlatGeobufSupportedShapes =
  | 'geojson-row-table'
  | 'columnar-table'
  | 'geojson'
  | 'binary';

export type FlatGeobufLoaderOptions = LoaderOptions & {
  flatgeobuf?: {
    shape?: FlatGeobufSupportedShapes;
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
    format?: FlatGeobufSupportedShapes;
  };
};
