import React, {Suspense} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import styled from 'styled-components';
import type {TableLiveExampleConfig} from './table-live-example';

const GeospatialExample = React.lazy(() => import('examples/website/geospatial/app'));
const PointcloudExample = React.lazy(() => import('examples/website/pointcloud/app'));
const TilesExample = React.lazy(() => import('examples/website/tiles/app'));
const Tiles3DExample = React.lazy(() => import('examples/website/3d-tiles/app'));
const TableExample = React.lazy(() => import('./table-live-example'));

const LOADERS_URL = 'https://raw.githubusercontent.com/visgl/loaders.gl/master';

type LoaderLiveExampleKind = 'geospatial' | 'pointcloud' | 'tiles' | '3d-tiles' | 'table';

type VisualLoaderLiveExampleConfig = {
  /** Existing website example app to reuse for the loader doc page. */
  kind: Exclude<LoaderLiveExampleKind, 'table'>;
  /** Example app format filter to select a specific loader format. */
  format?: string;
};

type LoaderLiveExampleConfig =
  | VisualLoaderLiveExampleConfig
  | {
      /** Table preview app to reuse for tabular loader doc pages. */
      kind: 'table';
      /** Table preview configuration for the loader doc page. */
      table: TableLiveExampleConfig;
    };

const LOADER_LIVE_EXAMPLES: Record<string, LoaderLiveExampleConfig> = {
  'modules/3d-tiles/api-reference/tiles-3d-loader': {kind: '3d-tiles'},
  'modules/3d-tiles/api-reference/cesium-ion-loader': {kind: '3d-tiles'},
  'modules/arrow/api-reference/arrow-loader': {
    kind: 'table',
    table: {
      loaderName: 'ArrowLoader',
      url: `${LOADERS_URL}/modules/arrow/test/data/arrow/simple.arrow`,
      options: {arrow: {shape: 'arrow-table'}}
    }
  },
  'modules/arrow/api-reference/geoarrow-loader': {kind: 'geospatial', format: 'GeoArrow'},
  'modules/csv/api-reference/csv-loader': {
    kind: 'table',
    table: {
      loaderName: 'CSVLoader',
      url: `${LOADERS_URL}/modules/csv/test/data/sf_incidents-small.csv`
    }
  },
  'modules/draco/api-reference/draco-loader': {kind: 'pointcloud', format: 'Draco'},
  'modules/excel/api-reference/excel-arrow-loader': {
    kind: 'table',
    table: {
      loaderName: 'ExcelArrowLoader',
      url: `${LOADERS_URL}/modules/excel/test/data/zipcodes.xlsx`
    }
  },
  'modules/excel/api-reference/excel-loader': {
    kind: 'table',
    table: {
      loaderName: 'ExcelLoader',
      url: `${LOADERS_URL}/modules/excel/test/data/zipcodes.xlsx`,
      options: {core: {worker: false}}
    }
  },
  'modules/flatgeobuf/api-reference/flatgeobuf-loader': {
    kind: 'geospatial',
    format: 'FlatGeobuf'
  },
  'modules/geopackage/api-reference/geopackage-loader': {kind: 'geospatial', format: 'GeoPackage'},
  'modules/json/api-reference/json-loader': {
    kind: 'table',
    table: {
      loaderName: 'JSONLoader',
      url: `${LOADERS_URL}/modules/json/test/data/clarinet/sample.json`,
      options: {json: {table: true, shape: 'object-row-table'}}
    }
  },
  'modules/json/api-reference/geojson-loader': {kind: 'geospatial', format: 'GeoJSON'},
  'modules/json/api-reference/ndjson-arrow-loader': {
    kind: 'table',
    table: {
      loaderName: 'NDJSONArrowLoader',
      url: `${LOADERS_URL}/modules/json/test/data/ndjson.ndjson`
    }
  },
  'modules/json/api-reference/ndjson-loader': {
    kind: 'table',
    table: {
      loaderName: 'NDJSONLoader',
      url: `${LOADERS_URL}/modules/json/test/data/ndjson.ndjson`
    }
  },
  'modules/kml/api-reference/gpx-loader': {kind: 'geospatial', format: 'GPX'},
  'modules/kml/api-reference/kml-loader': {kind: 'geospatial', format: 'KML'},
  'modules/kml/api-reference/tcx-loader': {kind: 'geospatial', format: 'TCX'},
  'modules/las/api-reference/las-loader': {kind: 'pointcloud', format: 'LAZ'},
  'modules/mlt/api-reference/mlt-loader': {kind: 'tiles', format: 'MLT'},
  'modules/mvt/api-reference/mvt-loader': {kind: 'tiles', format: 'MVT'},
  'modules/obj/api-reference/obj-loader': {kind: 'pointcloud', format: 'OBJ'},
  'modules/parquet/api-reference/parquet-loader': {kind: 'geospatial', format: 'GeoParquet'},
  'modules/pcd/api-reference/pcd-loader': {kind: 'pointcloud', format: 'PCD'},
  'modules/ply/api-reference/ply-loader': {kind: 'pointcloud', format: 'PLY'},
  'modules/shapefile/api-reference/shapefile-loader': {kind: 'geospatial', format: 'Shapefile'}
};

const ExampleContainer = styled.div<{$kind: LoaderLiveExampleKind}>`
  position: relative;
  margin: 0 0 2rem;
  overflow: hidden;
  height: ${(props) => (props.$kind === 'table' ? 'auto' : '420px')};
`;

const LoadingContainer = styled.div<{$kind: LoaderLiveExampleKind}>`
  height: ${(props) => (props.$kind === 'table' ? '160px' : '420px')};
`;

/**
 * Renders a live, render-only example for loader doc pages that have a reusable website demo.
 */
export function LoaderLiveExample() {
  const {metadata} = useDoc();
  const exampleConfig = LOADER_LIVE_EXAMPLES[metadata.id];

  if (!exampleConfig) {
    return null;
  }

  return (
    <ExampleContainer data-loader-live-example $kind={exampleConfig.kind}>
      <BrowserOnly fallback={<LoadingContainer $kind={exampleConfig.kind} />}>
        {() => (
          <Suspense fallback={<LoadingContainer $kind={exampleConfig.kind} />}>
            <LoaderLiveExampleContent exampleConfig={exampleConfig} />
          </Suspense>
        )}
      </BrowserOnly>
    </ExampleContainer>
  );
}

/**
 * Renders the configured website example app with chrome disabled.
 */
function LoaderLiveExampleContent({
  exampleConfig
}: {
  /** Live example configuration for the current loader doc page. */
  exampleConfig: LoaderLiveExampleConfig;
}) {
  switch (exampleConfig.kind) {
    case 'geospatial':
      return <GeospatialExample format={exampleConfig.format} hideChrome={true} />;
    case 'pointcloud':
      return <PointcloudExample format={exampleConfig.format} hideChrome={true} />;
    case 'tiles':
      return <TilesExample format={exampleConfig.format} hideChrome={true} />;
    case '3d-tiles':
      return <Tiles3DExample hideChrome={true} />;
    case 'table':
      return <TableExample config={exampleConfig.table} />;
    default:
      return null;
  }
}
