import React, {Suspense, useState} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import styled from 'styled-components';
import type {Example} from 'examples/website/pointcloud/examples';
import type {TableLiveExampleConfig} from './table-live-example';

const GeospatialExample = React.lazy(() => import('examples/website/geospatial/app'));
const PointcloudExample = React.lazy(() => import('examples/website/pointcloud/app'));
const TilesExample = React.lazy(() => import('examples/website/tiles/app'));
const Tiles3DExample = React.lazy(() => import('examples/website/3d-tiles/app'));
const PointcloudDataPreview = React.lazy(() => import('./pointcloud-data-preview'));
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
  'modules/arrow/api-reference/geoarrow-loader': {kind: 'geospatial', format: 'GeoArrow'},
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
  'modules/json/api-reference/geojson-loader': {kind: 'geospatial', format: 'GeoJSON'},
  'modules/json/api-reference/ndjson-loader': {
    kind: 'table',
    table: {
      loaderName: 'NDJSONLoader',
      url: `${LOADERS_URL}/modules/json/test/data/ndjson.ndjson`
    }
  },
  'modules/mlt/api-reference/mlt-loader': {kind: 'tiles', format: 'MLT'},
  'modules/mvt/api-reference/mvt-loader': {kind: 'tiles', format: 'MVT'},
  'modules/obj/api-reference/obj-loader': {kind: 'pointcloud', format: 'OBJ'}
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
 * Renders a point cloud loader example without relying on automatic doc-page injection.
 */
export function PointcloudLoaderLiveExample({
  format
}: {
  /** Example app format filter to select a specific point cloud loader format. */
  format: string;
}) {
  return (
    <BrowserOnly fallback={<LoadingContainer $kind="pointcloud" />}>
      {() => (
        <Suspense fallback={<LoadingContainer $kind="pointcloud" />}>
          <PointcloudLoaderLiveExampleContent format={format} />
        </Suspense>
      )}
    </BrowserOnly>
  );
}

function PointcloudLoaderLiveExampleContent({format}: {format: string}) {
  const [selectedExample, setSelectedExample] = useState<{
    categoryName: string;
    exampleName: string;
    example: Example;
  } | null>(null);

  return (
    <PointcloudDataPreview
      format={format}
      selectedExample={selectedExample}
      onExampleChange={setSelectedExample}
    >
      <div data-loader-live-example style={{position: 'relative', height: '100%'}}>
        <PointcloudExample
          format={format}
          hideChrome={true}
          categoryName={selectedExample?.categoryName}
          exampleName={selectedExample?.exampleName}
          example={selectedExample?.example}
        />
      </div>
    </PointcloudDataPreview>
  );
}

/**
 * Renders a geospatial loader example without relying on automatic doc-page injection.
 */
export function GeospatialLoaderLiveExample({
  format
}: {
  /** Example app format filter to select a specific geospatial loader format. */
  format: string;
}) {
  return (
    <ExampleContainer data-loader-live-example $kind="geospatial">
      <BrowserOnly fallback={<LoadingContainer $kind="geospatial" />}>
        {() => (
          <Suspense fallback={<LoadingContainer $kind="geospatial" />}>
            <GeospatialExample format={format} hideChrome={true} />
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
