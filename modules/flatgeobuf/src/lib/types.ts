import type {LoaderOptions} from '@loaders.gl/loader-utils';

export type FlatGeobufLoaderOptions = LoaderOptions & {
  flatgeobuf?: {
    shape?: 'geojson-table' | 'columnar-table' | 'geojson' | 'binary';
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
    /** @deprecated Use options.flatgeobuf.shape */
    format?: 'geojson-table' | 'columnar-table' | 'geojson' | 'binary';
  };
};
