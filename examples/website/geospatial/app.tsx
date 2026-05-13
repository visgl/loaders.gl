// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';

import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';

import {DeckGL} from '@deck.gl/react';
import {MapController} from '@deck.gl/core';
import {GeoJsonLayer} from '@deck.gl/layers';
import {ColumnPanel, CustomPanel, SidebarWidget} from '@deck.gl-community/widgets';
import {GeoArrowLayer} from '@loaders.gl/deck-layers';
import {createDeckFullscreenWidget, createDeckStatsWidget} from '../shared/create-deck-stats-widget';

// import {FileUploader} from './components/file-uploader';

import type {Example} from './examples';
import {INITIAL_LOADER_NAME, INITIAL_EXAMPLE_NAME, EXAMPLES} from './examples';

import {Table, GeoJSON, type ArrowTable, type Schema} from '@loaders.gl/schema';
import {load, LoaderOptions} from '@loaders.gl/core';
import {GeoArrowLoader} from '@loaders.gl/arrow';
import {
  convertGeoArrowToTable,
  getGeometryColumnsFromSchema,
  type GeoArrowEncoding,
  type GeoArrowMetadata
} from '@loaders.gl/geoarrow';
import {GeoParquetLoader, preloadCompressions} from '@loaders.gl/parquet';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {KMLLoader, GPXLoader, TCXLoader} from '@loaders.gl/kml';
import {CSVLoader} from '@loaders.gl/csv';
import {_GeoJSONLoader as GeoJSONLoader} from '@loaders.gl/json';
import {convertWKBTableToGeoJSON, getGeoMetadata} from '@loaders.gl/gis';
import {convertArrowToSchema, convertTable, getTableLength} from '@loaders.gl/schema-utils';

// Needed for ParquetLoader zstd support
import {ZstdCodec} from 'zstd-codec';
import '@deck.gl/widgets/stylesheet.css';

export const INITIAL_MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

const LOADER_OPTIONS = {
  core: {
    worker: false,
    limit: 1800000
  },
  modules: {
    'zstd-codec': ZstdCodec
  },
  gis: {
    reproject: true,
    _targetCrs: 'WGS84'
  },
  parquet: {
    shape: 'geojson-table',
    preserveBinary: true
  },
  arrow: {
    shape: 'geojson-table'
  },
  geopackage: {
    shape: 'geojson-table',
    sqlJsCDN: 'https://cdn.jsdelivr.net/npm/sql.js@1.14.1/dist/'
    // table: 'FEATURESriversds'
  },
  shapefile: {
    shape: 'geojson-table'
  },
  kml: {
    shape: 'geojson-table'
  },
  gpx: {
    shape: 'geojson-table'
  },
  tcx: {
    shape: 'geojson-table'
  },
  csv: {
    shape: 'object-row-table',
    detectGeometryColumns: true
  }
} as const;

type TableFormat = 'geojson' | 'geoarrow';
type LoadedDataName = 'geojson' | 'geoarrow';
type LoadedGeometryType = GeoArrowEncoding | string | null;

const VIEW_STATE = {
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 1,
  maxZoom: 30,
  zoom: 11
};

export const INITIAL_VIEW_STATE = {
  latitude: 49.254,
  longitude: -123.13,
  zoom: 11,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

type AppProps = {
  /** Controls which examples are shown */
  format?: string;
  /** Whether to hide the example controls, metadata, and descriptive overlay. */
  hideChrome?: boolean;
  /** Any informational text to display in the overlay */
  children?: ReactNode;
};

type AppState = {
  // EXAMPLE STATE
  table: Table | null;
  layerProps?: Record<string, unknown>;
  getTooltipData?: Function; // (object: Properties) => {title: string; properties: Record<string, unknown>};
  selectedCategoryName?: string | null;
  selectedExampleName?: string | null;
  selectedExample?: Example | null;
  error?: string | null;
  loading?: boolean;
  loadDurationSeconds?: number | null;
  displayedParquetImplementation?: 'wasm' | 'js' | null;
  loadedDataName: LoadedDataName;
  loadedGeometryType: LoadedGeometryType;
  // CURRENT VIEW POINT / CAMERA POSITION
  viewState: Record<string, unknown>;
};

/**
 * A Geospatial table map viewer
 */
export default function App(props: AppProps = {}) {
  const [parquetImplementation, setParquetImplementation] = useState<'wasm' | 'js'>('js');
  const [tableFormat, setTableFormat] = useState<TableFormat>('geoarrow');
  const previousParquetImplementation = useRef(parquetImplementation);
  const previousTableFormat = useRef(tableFormat);
  const loadRequestIdRef = useRef(0);
  const availableExamples = useMemo(
    () => getExamplesForFormat(EXAMPLES, props.format),
    [props.format]
  );
  const [state, setState] = useState<AppState>({
    table: null,
    viewState: INITIAL_VIEW_STATE,
    selectedExample: null,
    selectedCategoryName: null,
    selectedExampleName: null,
    error: null,
    loading: false,
    loadDurationSeconds: null,
    displayedParquetImplementation: null,
    loadedDataName: 'geojson',
    loadedGeometryType: null
  });

  useEffect(() => {
    const initialCategoryName = props.format || INITIAL_LOADER_NAME;
    const initialExamples = availableExamples[initialCategoryName];
    if (!initialExamples) {
      return;
    }

    const initialExampleName = props.format
      ? Object.keys(initialExamples)[0]
      : INITIAL_EXAMPLE_NAME;
    const initialExample = initialExamples[initialExampleName];
    if (!initialExample) {
      return;
    }

    void loadExample(
      initialCategoryName,
      initialExampleName,
      initialExample,
      previousParquetImplementation.current,
      previousTableFormat.current
    );
  }, [availableExamples, props.format]);

  useEffect(() => {
    const implementationChanged = previousParquetImplementation.current !== parquetImplementation;
    previousParquetImplementation.current = parquetImplementation;

    if (
      !implementationChanged ||
      state.selectedCategoryName !== 'GeoParquet' ||
      !state.selectedExample ||
      !state.selectedExampleName
    ) {
      return;
    }

    void loadExample(
      state.selectedCategoryName,
      state.selectedExampleName,
      state.selectedExample,
      parquetImplementation,
      tableFormat
    );
  }, [
    parquetImplementation,
    state.selectedCategoryName,
    state.selectedExample,
    state.selectedExampleName
  ]);

  useEffect(() => {
    const formatChanged = previousTableFormat.current !== tableFormat;
    previousTableFormat.current = tableFormat;

    if (!formatChanged || !state.selectedCategoryName || !state.selectedExample || !state.selectedExampleName) {
      return;
    }

    void loadExample(
      state.selectedCategoryName,
      state.selectedExampleName,
      state.selectedExample,
      parquetImplementation,
      tableFormat
    );
  }, [
    parquetImplementation,
    state.selectedCategoryName,
    state.selectedExample,
    state.selectedExampleName,
    tableFormat
  ]);

  const widgets = useMemo(() => {
    if (props.hideChrome) {
      return [];
    }

    return [
      createDeckFullscreenWidget('geospatial-fullscreen'),
      createDeckStatsWidget('geospatial-stats'),
      new SidebarWidget({
        id: 'geospatial-example-sidebar',
        placement: 'top-right',
        side: 'right',
        widthPx: 420,
        panel: new ColumnPanel({
          id: 'geospatial-example-panel',
          title: getLoaderDisplayName(state.selectedCategoryName, tableFormat),
          panels: {
            controls: new CustomPanel({
              id: 'geospatial-example-controls',
              title: '',
              onRenderHTML: (rootElement) =>
                renderGeospatialSidebar(rootElement, {
                  examples: availableExamples,
                  selectedCategoryName: state.selectedCategoryName,
                  selectedExampleName: state.selectedExampleName,
                  tableFormat,
                  activeLayerName: getActiveLayerName(state.table),
                  sourceName: getExampleSourceName(state.selectedExample, state.selectedExampleName),
                  loadedDataName: state.loadedDataName,
                  loadedGeometryType: state.loadedGeometryType,
                  rowCount: state.table ? getTableLength(state.table) : null,
                  parquetImplementation,
                  loadDurationSeconds: state.loadDurationSeconds,
                  loading: state.loading,
                  error: state.error,
                  schema: state.table?.schema ? JSON.stringify(state.table.schema, null, 2) : null,
                  viewState: state.viewState,
                  onExampleChange: ({categoryName, exampleName}) => {
                    const example = availableExamples[categoryName]?.[exampleName];
                    if (example) {
                      void loadExample(
                        categoryName,
                        exampleName,
                        example,
                        parquetImplementation,
                        tableFormat
                      );
                    }
                  },
                  onTableFormatChange: setTableFormat,
                  onParquetImplementationChange: setParquetImplementation
                })
            })
          }
        })
      })
    ];
  }, [
    availableExamples,
    parquetImplementation,
    props.hideChrome,
    state.error,
    state.loadedDataName,
    state.loadedGeometryType,
    state.loadDurationSeconds,
    state.loading,
    state.selectedCategoryName,
    state.selectedExample,
    state.selectedExampleName,
    state.table?.shape,
    state.table?.schema,
    state.viewState,
    tableFormat
  ]);

  return (
    <div style={{position: 'relative', height: '100%'}}>
      <DeckGL
        layers={renderLayer(state)}
        viewState={state.viewState}
        onViewStateChange={({viewState}) => setState((state) => ({...state, viewState}))}
        controller={{type: MapController, maxPitch: 85} as any}
        getTooltip={({object}) => getTooltipData({object}, state)}
        widgets={widgets}
      >
        <Map reuseMaps mapLib={maplibregl} mapStyle={INITIAL_MAP_STYLE} />
      </DeckGL>
    </div>
  );
  async function loadExample(
    categoryName: string,
    exampleName: string,
    example: Example,
    implementation: 'wasm' | 'js',
    nextTableFormat: TableFormat
  ) {
    const url = example.data;
    const loaderOptions = getLoaderOptions(example, implementation, nextTableFormat);
    const loaders = getLoaders(example, nextTableFormat);
    const requestId = ++loadRequestIdRef.current;
    const loadStartTime = performance.now();

    setState((state) => ({
      ...state,
      loading: true,
      loadDurationSeconds: null,
      selectedCategoryName: categoryName,
      selectedExampleName: exampleName,
      selectedExample: example,
      error: null
    }));

    try {
      const rawTable = (await load(url, loaders as any, loaderOptions)) as Table;
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      const loadedTableInfo = getLoadedTableInfo(rawTable);
      const table = normalizeLoadedTable(rawTable, example);
      console.log('Loaded table', url, table);
      const viewState = {...state.viewState, ...example.viewState};
      const loadDurationSeconds = (performance.now() - loadStartTime) / 1000;
      setState((state) => ({
        ...state,
        table,
        viewState,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName,
        selectedExample: example,
        error: null,
        loading: false,
        loadDurationSeconds,
        displayedParquetImplementation: implementation,
        loadedDataName: loadedTableInfo.loadedDataName,
        loadedGeometryType: loadedTableInfo.loadedGeometryType
      }));
    } catch (error) {
      if (requestId !== loadRequestIdRef.current) {
        return;
      }
      console.error('Failed to load table', url, error);
      const message = error instanceof Error ? error.message : String(error);
      setState((state) => ({
        ...state,
        selectedCategoryName: categoryName,
        selectedExampleName: exampleName,
        selectedExample: example,
        error: `Could not load ${exampleName}: ${message}`,
        loading: false,
        loadDurationSeconds: null
      }));
    }
  }
}

function getLoaders(example: Example, tableFormat: TableFormat) {
  if (tableFormat === 'geojson') {
    switch (example.format) {
      case 'geopackage':
        return [GeoPackageLoader];
      case 'shapefile':
        return [ShapefileLoader];
      case 'kml':
        return [KMLLoader];
      case 'gpx':
        return [GPXLoader];
      case 'tcx':
        return [TCXLoader];
      case 'geojson':
        return [GeoJSONLoader];
      case 'csv':
        return [CSVLoader];
      case 'flatgeobuf':
        return [FlatGeobufLoader];
      case 'geoparquet':
        return [GeoParquetLoader];
      case 'geoarrow':
        return [GeoArrowLoader];
      default:
        return [GeoJSONLoader];
    }
  }

  switch (example.format) {
    case 'geopackage':
      return [GeoPackageLoader];
    case 'shapefile':
      return [ShapefileLoader];
    case 'kml':
      return [KMLLoader];
    case 'gpx':
      return [GPXLoader];
    case 'tcx':
      return [TCXLoader];
    case 'geojson':
      return [GeoJSONLoader];
    case 'csv':
      return [CSVLoader];
    case 'flatgeobuf':
      return [FlatGeobufLoader];
    case 'geoparquet':
      return [GeoParquetLoader];
    case 'geoarrow':
      return [GeoArrowLoader];
    default:
      return [GeoJSONLoader];
  }
}

function getLoaderOptions(
  example: Example,
  implementation: 'wasm' | 'js',
  tableFormat: TableFormat
): LoaderOptions {
  const tableShape = tableFormat === 'geoarrow' ? 'arrow-table' : 'geojson-table';
  const geoArrowTableShape = 'arrow-table';

  return {
    ...LOADER_OPTIONS,
    parquet: {
      ...LOADER_OPTIONS.parquet,
      shape: tableShape,
      implementation
    },
    arrow: {
      ...LOADER_OPTIONS.arrow,
      shape: example.format === 'geoarrow' ? geoArrowTableShape : LOADER_OPTIONS.arrow.shape
    },
    geopackage: {
      ...LOADER_OPTIONS.geopackage,
      shape: tableShape
    },
    shapefile: {
      ...LOADER_OPTIONS.shapefile,
      shape: tableShape,
      geoarrowEncoding: tableFormat === 'geoarrow' ? 'geoarrow' : 'geoarrow.wkb'
    },
    kml: {
      ...LOADER_OPTIONS.kml,
      shape: tableShape
    },
    gpx: {
      ...LOADER_OPTIONS.gpx,
      shape: tableShape
    },
    tcx: {
      ...LOADER_OPTIONS.tcx,
      shape: tableShape
    },
    flatgeobuf: {
      shape: tableShape
    },
    csv: {
      ...LOADER_OPTIONS.csv,
      shape: tableFormat === 'geoarrow' ? 'arrow-table' : 'object-row-table'
    }
  } as unknown as LoaderOptions;
}

function normalizeLoadedTable(table: Table, example?: Example | null): Table {
  if (example?.format === 'geoarrow' && table.shape === 'arrow-table' && getGeoArrowLayerGeometryColumn(table)) {
    return table;
  }

  if (table.shape === 'arrow-table') {
    if (getGeoArrowLayerGeometryColumn(table)) {
      return table;
    }

    try {
      return convertGeoArrowToTable(table.data, 'geojson-table');
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('No GeoArrow geometry column found')) {
        throw error;
      }
      return convertWKBArrowTableToGeoJSON(table);
    }
  }

  if (example?.format === 'csv') {
    return convertWKBTableToGeoJSON(table as any, table.schema as Schema);
  }

  return table;
}

function convertWKBArrowTableToGeoJSON(table: Table): Table {
  const objectRowTable = convertTable(table, 'object-row-table');
  return convertWKBTableToGeoJSON(objectRowTable, table.schema as Schema);
}

function getLoaderDisplayName(
  selectedCategoryName?: string | null,
  tableFormat: TableFormat = 'geojson'
): string {
  switch (selectedCategoryName) {
    case 'GeoArrow':
      return 'GeoArrowLoader';
    case 'GeoParquet':
      return 'GeoParquetLoader';
    case 'GeoJSON':
      return 'GeoJSONLoader';
    case 'CSV':
      return tableFormat === 'geoarrow' ? "CSVLoader (shape: 'arrow-table')" : 'CSVLoader';
    case 'GeoPackage':
      return tableFormat === 'geoarrow'
        ? "GeoPackageLoader (shape: 'arrow-table')"
        : 'GeoPackageLoader';
    case 'FlatGeobuf':
      return 'FlatGeobufLoader';
    case 'Shapefile':
      return tableFormat === 'geoarrow'
        ? "ShapefileLoader (shape: 'arrow-table', typed GeoArrow)"
        : 'ShapefileLoader';
    case 'KML':
      return 'KMLLoader';
    case 'GPX':
      return 'GPXLoader';
    case 'TCX':
      return 'TCXLoader';
    default:
      return 'Loader';
  }
}

function getActiveLayerName(table: Table | null): string {
  if (getGeoArrowLayerGeometryColumn(table)) {
    return 'GeoArrowLayer';
  }

  return 'GeoJsonLayer';
}

function getLoadedTableInfo(table: Table): {
  loadedDataName: LoadedDataName;
  loadedGeometryType: LoadedGeometryType;
} {
  if (table.shape !== 'arrow-table') {
    return {
      loadedDataName: 'geojson',
      loadedGeometryType: null
    };
  }

  const geometryColumn = getGeoArrowLayerGeometryColumn(table);
  if (geometryColumn) {
    return {
      loadedDataName: 'geoarrow',
      loadedGeometryType: getGeoArrowColumns(table)[geometryColumn]?.encoding || null
    };
  }

  const geoMetadata = getGeoMetadata(table.schema?.metadata);
  const geometryColumnName =
    geoMetadata?.primary_column || Object.keys(geoMetadata?.columns || {})[0] || null;
  const geometryEncoding = geometryColumnName
    ? geoMetadata?.columns?.[geometryColumnName]?.encoding || null
    : null;

  return {
    loadedDataName: geometryEncoding ? 'geoarrow' : 'geojson',
    loadedGeometryType: geometryEncoding
  };
}

function renderLayer({table, selectedExample}: {table: Table | null; selectedExample?: Example | null}) {
  if (!table) {
    return [];
  }

  const geometryColumn = getGeoArrowLayerGeometryColumn(table);
  if (geometryColumn) {
    const arrowTable = table as ArrowTable;
    return [
      new GeoArrowLayer({
        id: 'geoarrow-layer',
        data: arrowTable.data,
        geometryColumn,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 255, 0],
        opacity: 1,
        ...getGeoArrowExampleLayerProps(selectedExample?.layerProps)
      })
    ];
  }

  const geojson = table as GeoJSON;
  return [
    new GeoJsonLayer({
      id: 'geojson-layer',
      data: geojson,

      pickable: true,
      autoHighlight: true,
      highlightColor: [0, 255, 0],

      // Visuals
      opacity: 1.0,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: true,
      // getElevation: (f) => Math.sqrt(f?.properties?.valuePerSqm) * 10,
      // lines
      getLineColor: [0, 0, 255],
      getLineWidth: 3,
      lineWidthUnits: 'pixels',
      // point fills
      getFillColor: [255, 0, 0],
      getPointRadius: 100,
      pointRadiusScale: 500,
      // pointRadiusUnits: 'pixels',
      ...selectedExample?.layerProps
    })
  ];
}

function getGeoArrowLayerGeometryColumn(table: Table | null): string | null {
  if (!table || table.shape !== 'arrow-table') {
    return null;
  }

  const geometryColumns = getGeoArrowColumns(table);
  const geometryColumnNames = Object.keys(geometryColumns);
  if (geometryColumnNames.length !== 1) {
    return null;
  }

  const geometryColumnName = geometryColumnNames[0];
  const geometryMetadata = geometryColumns[geometryColumnName];
  return isGeoArrowLayerEncodingSupported(geometryMetadata.encoding) ? geometryColumnName : null;
}

function getGeoArrowColumns(table: Table): Record<string, GeoArrowMetadata> {
  const schema = convertArrowToSchema((table as ArrowTable).data.schema);
  return getGeometryColumnsFromSchema(schema);
}

function isGeoArrowLayerEncodingSupported(encoding?: GeoArrowEncoding): boolean {
  return Boolean(encoding);
}

function getGeoArrowExampleLayerProps(layerProps: Record<string, unknown> | undefined) {
  const sharedLayerProps = {
    pointLayerProps: {
      getFillColor: [255, 0, 0, 255] as [number, number, number, number],
      getRadius: 100,
      radiusScale: 500
    },
    pathLayerProps: {
      getColor: [0, 0, 255, 255] as [number, number, number, number],
      getWidth: 3,
      widthUnits: 'pixels' as const
    },
    solidPolygonLayerProps: {
      filled: true,
      extruded: true,
      wireframe: true,
      getFillColor: [255, 0, 0, 255] as [number, number, number, number],
      getLineColor: [0, 0, 255, 255] as [number, number, number, number]
    }
  };

  if (!layerProps) {
    return sharedLayerProps;
  }

  return {
    pointLayerProps: {
      ...sharedLayerProps.pointLayerProps,
      ...translateGeoJsonPointProps(layerProps)
    },
    pathLayerProps: {
      ...sharedLayerProps.pathLayerProps,
      ...translateGeoJsonPathProps(layerProps)
    },
    solidPolygonLayerProps: {
      ...sharedLayerProps.solidPolygonLayerProps,
      ...translateGeoJsonPolygonProps(layerProps)
    }
  };
}

function translateGeoJsonPointProps(layerProps: Record<string, unknown>) {
  const translatedProps: Record<string, unknown> = {};

  if ('getPointRadius' in layerProps) {
    translatedProps.getRadius = layerProps.getPointRadius;
  }
  if ('pointRadiusScale' in layerProps) {
    translatedProps.radiusScale = layerProps.pointRadiusScale;
  }
  if ('pointRadiusUnits' in layerProps) {
    translatedProps.radiusUnits = layerProps.pointRadiusUnits;
  }
  if ('getFillColor' in layerProps) {
    translatedProps.getFillColor = layerProps.getFillColor;
  }
  if ('getLineColor' in layerProps) {
    translatedProps.getLineColor = layerProps.getLineColor;
  }
  if ('getLineWidth' in layerProps) {
    translatedProps.getLineWidth = layerProps.getLineWidth;
  }

  return translatedProps;
}

function translateGeoJsonPathProps(layerProps: Record<string, unknown>) {
  const translatedProps: Record<string, unknown> = {};

  if ('getLineColor' in layerProps) {
    translatedProps.getColor = layerProps.getLineColor;
  }
  if ('getLineWidth' in layerProps) {
    translatedProps.getWidth = layerProps.getLineWidth;
  }
  if ('lineWidthUnits' in layerProps) {
    translatedProps.widthUnits = layerProps.lineWidthUnits;
  }

  return translatedProps;
}

function translateGeoJsonPolygonProps(layerProps: Record<string, unknown>) {
  const translatedProps: Record<string, unknown> = {};

  if ('filled' in layerProps) {
    translatedProps.filled = layerProps.filled;
  }
  if ('extruded' in layerProps) {
    translatedProps.extruded = layerProps.extruded;
  }
  if ('wireframe' in layerProps) {
    translatedProps.wireframe = layerProps.wireframe;
  }
  if ('getFillColor' in layerProps) {
    translatedProps.getFillColor = layerProps.getFillColor;
  }
  if ('getLineColor' in layerProps) {
    translatedProps.getLineColor = layerProps.getLineColor;
  }
  if ('getElevation' in layerProps) {
    translatedProps.getElevation = layerProps.getElevation;
  }

  return translatedProps;
}

function getTooltipData({object}, state) {
  const {getTooltipData: getSpecialTooltipData} = state.selectedExample ?? {};
  const {title, properties} = getSpecialTooltipData
    ? getSpecialTooltipData({object})
    : getDefaultTooltipData({object});
  const props = Object.entries(properties)
    .map(([key, value]) => `<div>${key}: ${value}</div>`)
    .join('\n');
  const coordinates =
    object?.geometry?.coordinates &&
    Array.isArray(object.geometry.coordinates) &&
    object.geometry.coordinates.length >= 2
      ? `<div>Coords: ${object.geometry.coordinates[0]};${object.geometry.coordinates[1]}</div>`
      : '';
  return (
    object && {
      html: `\
<h2>${title}</h2>
${props}
${coordinates}`,
      style: {
        backgroundColor: '#ddd',
        fontSize: '0.8em'
      }
    }
  );
}

function getDefaultTooltipData({object}) {
  const {name, ...properties} = object?.properties || {};
  return {
    title: name,
    properties
  };
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}

function getExamplesForFormat(
  examples: Record<string, Record<string, Example>>,
  format?: string
): Record<string, Record<string, Example>> {
  if (format) {
    return {[format]: examples[format]};
  }

  return {...examples};
}

function renderGeospatialSidebar(
  rootElement: HTMLElement,
  options: {
    examples: Record<string, Record<string, Example>>;
    selectedCategoryName?: string | null;
    selectedExampleName?: string | null;
    tableFormat: TableFormat;
    activeLayerName: string;
    sourceName: string;
    loadedDataName: LoadedDataName;
    loadedGeometryType: LoadedGeometryType;
    rowCount: number | null;
    parquetImplementation: 'wasm' | 'js';
    loadDurationSeconds?: number | null;
    loading: boolean;
    error?: string | null;
    schema: string | null;
    viewState: Record<string, unknown>;
    onExampleChange: (selection: {categoryName: string; exampleName: string}) => void;
    onTableFormatChange: (tableFormat: TableFormat) => void;
    onParquetImplementationChange: (implementation: 'wasm' | 'js') => void;
  }
): void {
  rootElement.replaceChildren();
  rootElement.style.display = 'flex';
  rootElement.style.flexDirection = 'column';
  rootElement.style.gap = '12px';
  rootElement.style.padding = '4px 0 0';

  rootElement.appendChild(
    createSidebarTitle(getLoaderDisplayName(options.selectedCategoryName, options.tableFormat))
  );

  rootElement.appendChild(
    createSelectSection({
      examples: options.examples,
      selectedCategoryName: options.selectedCategoryName,
      selectedExampleName: options.selectedExampleName,
      tableFormat: options.tableFormat,
      onExampleChange: options.onExampleChange,
      onTableFormatChange: options.onTableFormatChange
    })
  );

  if (options.selectedCategoryName === 'GeoParquet') {
    rootElement.appendChild(
      createParquetSection(options.parquetImplementation, options.onParquetImplementationChange)
    );
  }

  rootElement.appendChild(
    createStatusSection({
      loading: options.loading,
      loadDurationSeconds: options.loadDurationSeconds,
      sourceName: options.sourceName,
      activeLayerName: options.activeLayerName,
      loadedDataName: options.loadedDataName,
      loadedGeometryType: options.loadedGeometryType,
      rowCount: options.rowCount
    })
  );

  if (options.error) {
    rootElement.appendChild(createErrorSection(options.error));
  }

  rootElement.appendChild(createViewStateSection(options.viewState));
  rootElement.appendChild(createMetadataSection(options.schema ?? 'No metadata available'));
}

function createSidebarTitle(title: string): HTMLElement {
  const titleElement = document.createElement('div');
  titleElement.textContent = title;
  titleElement.style.fontSize = '28px';
  titleElement.style.fontWeight = '700';
  titleElement.style.lineHeight = '1.1';
  titleElement.style.margin = '0 0 4px';
  return titleElement;
}

function createSelectSection(options: {
  examples: Record<string, Record<string, Example>>;
  selectedCategoryName?: string | null;
  selectedExampleName?: string | null;
  tableFormat: TableFormat;
  onExampleChange: (selection: {categoryName: string; exampleName: string}) => void;
  onTableFormatChange: (tableFormat: TableFormat) => void;
}): HTMLElement {
  const section = createSection();
  section.appendChild(createLabel('Dataset'));

  const selectElement = document.createElement('select');
  selectElement.style.width = '100%';
  selectElement.style.margin = '0';
  selectElement.style.padding = '8px';
  selectElement.style.border = '1px solid rgba(148, 163, 184, 0.55)';
  selectElement.style.borderRadius = '8px';
  selectElement.style.background = 'var(--menu-background, #fff)';
  selectElement.style.color = 'inherit';
  selectElement.addEventListener('change', (event) => {
    const nextValue = (event.target as HTMLSelectElement).value;
    const [categoryName, exampleName] = nextValue.split('.');
    options.onExampleChange({categoryName, exampleName});
  });

  for (const categoryName of Object.keys(options.examples)) {
    const examplesInCategory = options.examples[categoryName];
    const groupElement = document.createElement('optgroup');
    groupElement.label = categoryName;

    for (const exampleName of Object.keys(examplesInCategory)) {
      const optionElement = document.createElement('option');
      optionElement.value = `${categoryName}.${exampleName}`;
      optionElement.textContent = exampleName;
      groupElement.appendChild(optionElement);
    }

    selectElement.appendChild(groupElement);
  }

  selectElement.value = `${options.selectedCategoryName}.${options.selectedExampleName}`;
  section.appendChild(selectElement);

  section.appendChild(createLabel('Load As'));

  const formatSelectElement = document.createElement('select');
  formatSelectElement.style.width = '100%';
  formatSelectElement.style.margin = '0';
  formatSelectElement.style.padding = '8px';
  formatSelectElement.style.border = '1px solid rgba(148, 163, 184, 0.55)';
  formatSelectElement.style.borderRadius = '8px';
  formatSelectElement.style.background = 'var(--menu-background, #fff)';
  formatSelectElement.style.color = 'inherit';
  formatSelectElement.addEventListener('change', (event) => {
    options.onTableFormatChange((event.target as HTMLSelectElement).value as TableFormat);
  });

  for (const [value, label] of [
    ['geoarrow', 'GeoArrow'],
    ['geojson', 'GeoJSON']
  ] as const) {
    const optionElement = document.createElement('option');
    optionElement.value = value;
    optionElement.textContent = label;
    formatSelectElement.appendChild(optionElement);
  }

  formatSelectElement.value = options.tableFormat;
  section.appendChild(formatSelectElement);
  return section;
}

function createStatusSection(options: {
  loading: boolean;
  loadDurationSeconds?: number | null;
  sourceName: string;
  activeLayerName: string;
  loadedDataName: LoadedDataName;
  loadedGeometryType: LoadedGeometryType;
  rowCount: number | null;
}): HTMLElement {
  const section = createSection();
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.alignItems = 'flex-start';
  section.style.gap = '8px';
  section.style.color = '#555';
  section.style.fontSize = '12px';
  section.style.lineHeight = '1.4';

  const summaryElement = document.createElement('div');
  summaryElement.style.display = 'flex';
  summaryElement.style.alignItems = 'center';
  summaryElement.style.gap = '8px';

  if (options.loading) {
    const spinnerElement = document.createElement('span');
    spinnerElement.setAttribute('aria-hidden', 'true');
    spinnerElement.style.width = '12px';
    spinnerElement.style.height = '12px';
    spinnerElement.style.border = '2px solid #bbb';
    spinnerElement.style.borderTopColor = '#222';
    spinnerElement.style.borderRadius = '999px';
    spinnerElement.style.display = 'inline-block';
    spinnerElement.style.animation = 'geospatial-loader-spin 0.8s linear infinite';
    summaryElement.appendChild(spinnerElement);
  }

  const labelElement = document.createElement('span');
  if (options.loading) {
    labelElement.textContent = 'Loading...';
  } else if (options.loadDurationSeconds !== null && options.loadDurationSeconds !== undefined) {
    const rowLabel = options.rowCount === 1 ? 'row' : 'rows';
    labelElement.textContent = `Loaded ${options.rowCount ?? 0} ${rowLabel} in ${options.loadDurationSeconds.toFixed(2)} s`;
  } else {
    labelElement.textContent = '';
  }
  summaryElement.appendChild(labelElement);
  section.appendChild(summaryElement);

  if (!options.loading) {
    const detailsElement = document.createElement('div');
    detailsElement.style.display = 'flex';
    detailsElement.style.alignItems = 'center';
    detailsElement.style.flexWrap = 'wrap';
    detailsElement.style.gap = '8px';

    const sourceNameElement = document.createElement('span');
    sourceNameElement.textContent = options.sourceName;
    sourceNameElement.style.fontFamily = 'monospace';
    sourceNameElement.style.fontSize = '13px';
    sourceNameElement.style.color = '#111';
    detailsElement.appendChild(sourceNameElement);
    detailsElement.appendChild(createArrowSeparator());
    detailsElement.appendChild(createBadge(options.loadedGeometryType || options.loadedDataName));
    detailsElement.appendChild(createArrowSeparator());
    detailsElement.appendChild(createBadge(options.activeLayerName));
    section.appendChild(detailsElement);
  }

  ensureGeospatialSpinnerStyle(document);
  return section;
}

function createBadge(value: string): HTMLElement {
  const valueElement = document.createElement('span');
  valueElement.textContent = value;
  valueElement.style.padding = '2px 8px';
  valueElement.style.borderRadius = '999px';
  valueElement.style.background = 'rgba(15, 23, 42, 0.08)';
  valueElement.style.fontFamily = 'monospace';
  valueElement.style.fontSize = '12px';
  return valueElement;
}

function createArrowSeparator(): HTMLElement {
  const separatorElement = document.createElement('span');
  separatorElement.textContent = '→';
  separatorElement.style.color = '#64748b';
  separatorElement.style.fontSize = '13px';
  return separatorElement;
}

function createParquetSection(
  parquetImplementation: 'wasm' | 'js',
  onParquetImplementationChange: (implementation: 'wasm' | 'js') => void
): HTMLElement {
  const section = createSection();
  section.appendChild(createLabel('GeoParquetLoader options', 'parquet-implementation'));

  const selectElement = document.createElement('select');
  selectElement.id = 'parquet-implementation';
  selectElement.value = parquetImplementation;
  selectElement.style.width = '100%';
  selectElement.style.margin = '0 0 4px';
  selectElement.style.padding = '8px';
  selectElement.style.border = '1px solid rgba(148, 163, 184, 0.55)';
  selectElement.style.borderRadius = '8px';
  selectElement.style.background = 'var(--menu-background, #fff)';
  selectElement.style.color = 'inherit';
  selectElement.add(new Option('wasm', 'wasm'));
  selectElement.add(new Option('js', 'js'));
  selectElement.addEventListener('change', (event) => {
    onParquetImplementationChange((event.target as HTMLSelectElement).value as 'wasm' | 'js');
  });
  section.appendChild(selectElement);

  const hintElement = document.createElement('div');
  hintElement.textContent =
    'Switches GeoParquet loading between the Arrow-backed wasm path and the JS fallback.';
  hintElement.style.color = '#555';
  hintElement.style.fontSize = '12px';
  hintElement.style.lineHeight = '1.4';
  section.appendChild(hintElement);

  return section;
}

function createErrorSection(message: string): HTMLElement {
  const element = document.createElement('div');
  element.textContent = message;
  element.style.color = '#b91c1c';
  element.style.whiteSpace = 'pre-wrap';
  return element;
}

function createViewStateSection(viewState: Record<string, unknown>): HTMLElement {
  const element = document.createElement('div');
  element.style.textAlign = 'center';
  const longitude = Number(viewState.longitude ?? 0);
  const latitude = Number(viewState.latitude ?? 0);
  const zoom = Number(viewState.zoom ?? 0);
  element.textContent = `center long/lat: ${longitude.toFixed(3)}, ${latitude.toFixed(3)}, zoom: ${zoom.toFixed(2)}`;
  return element;
}

function createMetadataSection(metadata: string): HTMLElement {
  const section = createSection();
  const preElement = document.createElement('pre');
  preElement.textContent = metadata;
  preElement.style.margin = '0';
  preElement.style.maxHeight = '320px';
  preElement.style.overflow = 'auto';
  preElement.style.padding = '12px';
  preElement.style.borderRadius = '8px';
  preElement.style.background = '#0f172a';
  preElement.style.color = '#e2e8f0';
  preElement.style.fontSize = '12px';
  preElement.style.lineHeight = '1.4';
  preElement.style.whiteSpace = 'pre-wrap';
  section.appendChild(preElement);

  return section;
}

function createSection(): HTMLElement {
  const section = document.createElement('section');
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = '4px';
  return section;
}

function createLabel(text: string, htmlFor?: string): HTMLElement {
  const labelElement = document.createElement('label');
  labelElement.textContent = text;
  labelElement.style.fontWeight = '600';
  labelElement.style.display = 'block';
  if (htmlFor) {
    labelElement.htmlFor = htmlFor;
  }
  return labelElement;
}

function getExampleSourceName(
  selectedExample?: Example | null,
  selectedExampleName?: string | null
): string {
  const sourceUrl = selectedExample?.data;
  if (!sourceUrl) {
    return selectedExampleName || 'dataset';
  }

  if (sourceUrl.startsWith('data:')) {
    return selectedExampleName || 'inline-data';
  }

  const pathname = sourceUrl.split('?')[0];
  const pathSegments = pathname.split('/').filter(Boolean);
  return pathSegments[pathSegments.length - 1] || selectedExampleName || pathname;
}

function ensureGeospatialSpinnerStyle(documentObject: Document): void {
  const styleId = 'geospatial-loader-sidebar-style';
  if (documentObject.getElementById(styleId)) {
    return;
  }

  const styleElement = documentObject.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = `
    @keyframes geospatial-loader-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `;
  documentObject.head.appendChild(styleElement);
}
