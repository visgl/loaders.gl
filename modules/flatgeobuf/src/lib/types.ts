import type {LoaderOptions} from '@loaders.gl/loader-utils';

export type FlatGeobufLoaderOptions = LoaderOptions & {
  flatgeobuf?: {
    shape?: 'geojson-row-table' | 'columnar-table' | 'geojson' | 'binary';
  };
  gis?: {
    reproject?: boolean;
    _targetCrs?: string;
    /** @deprecated Use options.flatgeobuf.shape */
    format?: 'geojson-row-table' | 'columnar-table' | 'geojson' | 'binary';
  };
};
