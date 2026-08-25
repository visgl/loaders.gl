// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CSSProperties} from 'react'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {createRoot} from 'react-dom/client'

import {DeckGL} from '@deck.gl/react'
import {GeoJsonLayer} from '@deck.gl/layers'
import {MapController} from '@deck.gl/core'
import type {MapViewState} from '@deck.gl/core'
import {Map} from 'react-map-gl'
import maplibregl from 'maplibre-gl'
import {tableFromJSON} from 'apache-arrow'

import type {ArrowTable} from '@loaders.gl/schema'
import {convertArrowToTable} from '@loaders.gl/schema-utils'
import {
  bindSQLPredicate,
  compileSQLTableQuery,
  DuckDBSQLDataSource,
  parseSQLPredicate,
  queryArrowTable
} from '@loaders.gl/sql'
import type {SQLTableQuery} from '@loaders.gl/sql'
import {createDeckFullscreenWidget, createDeckStatsWidget} from '../shared/create-deck-stats-widget'

type QueryBackend = 'arrow' | 'duckdb'

type Point = {
  type: 'Point'
  coordinates: [number, number]
}

type Feature<GeometryT> = {
  type: 'Feature'
  geometry: GeometryT
  properties: Record<string, unknown>
}

type FeatureCollection<GeometryT> = {
  type: 'FeatureCollection'
  features: Array<Feature<GeometryT>>
}

type GeospatialRow = {
  id: number
  name: string
  category: string
  longitude: number
  latitude: number
  visitors: number
}

type QueryState = {
  featureCollection: FeatureCollection<Point>
  rowCount: number
}

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: -122.4167,
  latitude: 37.785,
  zoom: 11.5,
  pitch: 30,
  bearing: 0
}

const DEFAULT_MINIMUM_VISITORS = 200000
const DEFAULT_LIMIT = 100
const OUTPUT_COLUMNS = [
  'id',
  'name',
  'category',
  'longitude',
  'latitude',
  'visitors'
] as const
const VISITOR_PREDICATE = parseSQLPredicate('visitors >= :minimumVisitors', {
  preserveParameters: true
})

const SAMPLE_ROWS: GeospatialRow[] = [
  {id: 1, name: 'Golden Gate Park', category: 'park', longitude: -122.4862, latitude: 37.7694, visitors: 24000000},
  {id: 2, name: 'Ferry Building', category: 'market', longitude: -122.3933, latitude: 37.7955, visitors: 13000000},
  {id: 3, name: 'Oracle Park', category: 'stadium', longitude: -122.3893, latitude: 37.7786, visitors: 3400000},
  {id: 4, name: 'SFMOMA', category: 'museum', longitude: -122.4009, latitude: 37.7857, visitors: 1200000},
  {id: 5, name: 'Presidio Tunnel Tops', category: 'park', longitude: -122.4776, latitude: 37.8039, visitors: 1800000},
  {id: 6, name: 'Exploratorium', category: 'museum', longitude: -122.3983, latitude: 37.8014, visitors: 1100000},
  {id: 7, name: 'Salesforce Park', category: 'park', longitude: -122.3958, latitude: 37.789, visitors: 950000},
  {id: 8, name: 'Coit Tower', category: 'landmark', longitude: -122.4058, latitude: 37.8024, visitors: 600000},
  {id: 9, name: 'Chase Center', category: 'stadium', longitude: -122.3877, latitude: 37.768, visitors: 2000000},
  {id: 10, name: 'Alamo Square', category: 'park', longitude: -122.4346, latitude: 37.7764, visitors: 700000}
]

const ARROW_TABLE: ArrowTable = convertArrowToTable(tableFromJSON(SAMPLE_ROWS), 'arrow-table')
const INITIAL_QUERY_STATE = buildQueryState(
  arrowTableToRows(
    queryArrowTable(ARROW_TABLE, {
      columns: OUTPUT_COLUMNS,
      predicate: bindSQLPredicate(VISITOR_PREDICATE, {
        minimumVisitors: DEFAULT_MINIMUM_VISITORS
      }),
      limit: DEFAULT_LIMIT
    })
  )
)

const CREATE_TABLE_SQL = `
CREATE TABLE sf_places (
  id INTEGER,
  name VARCHAR,
  category VARCHAR,
  longitude DOUBLE,
  latitude DOUBLE,
  visitors INTEGER
)`

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json'

/** Render the portable Arrow and DuckDB table-query example. */
export default function App() {
  const dataSourcePromiseRef = useRef<Promise<DuckDBSQLDataSource> | null>(null)
  const [backend, setBackend] = useState<QueryBackend>('arrow')
  const [minimumVisitors, setMinimumVisitors] = useState(DEFAULT_MINIMUM_VISITORS)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)
  const [rowCount, setRowCount] = useState(INITIAL_QUERY_STATE.rowCount)
  const [durationMilliseconds, setDurationMilliseconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [duckDBInitialized, setDuckDBInitialized] = useState(false)
  const [featureCollection, setFeatureCollection] = useState<FeatureCollection<Point>>(
    INITIAL_QUERY_STATE.featureCollection
  )

  const query = useMemo(() => createTableQuery(limit), [limit])
  const parameters = useMemo(() => ({minimumVisitors}), [minimumVisitors])
  const compiledQuery = useMemo(
    () => compileSQLTableQuery(query, {dialect: 'duckdb', parameters}),
    [parameters, query]
  )

  /** Lazily initializes DuckDB only after its backend is selected for execution. */
  const getDuckDBDataSource = useCallback(async (): Promise<DuckDBSQLDataSource> => {
    if (!dataSourcePromiseRef.current) {
      dataSourcePromiseRef.current = initializeDuckDBDataSource()
    }
    const dataSource = await dataSourcePromiseRef.current
    setDuckDBInitialized(true)
    return dataSource
  }, [])

  /** Executes one logical query through the selected physical backend. */
  const runQuery = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    const startTime = performance.now()

    try {
      const result =
        backend === 'arrow'
          ? queryArrowTable(ARROW_TABLE, {
              columns: query.columns,
              predicate: bindSQLPredicate(query.predicate!, parameters),
              limit: query.limit
            })
          : await (await getDuckDBDataSource()).queryArrow(query, {parameters})
      const queryState = buildQueryState(arrowTableToRows(result))
      setFeatureCollection(queryState.featureCollection)
      setRowCount(queryState.rowCount)
      setDurationMilliseconds(performance.now() - startTime)
    } catch (queryError) {
      setError(getErrorMessage(queryError))
    } finally {
      setIsRunning(false)
    }
  }, [backend, getDuckDBDataSource, parameters, query])

  useEffect(
    () => () => {
      if (dataSourcePromiseRef.current) {
        void dataSourcePromiseRef.current.then(dataSource => dataSource.close())
        dataSourcePromiseRef.current = null
      }
    },
    []
  )

  const layer = useMemo(
    () =>
      new GeoJsonLayer({
        id: 'portable-table-query-results',
        data: featureCollection,
        pickable: true,
        stroked: true,
        filled: true,
        pointType: 'circle+text',
        getPointRadius: 120,
        pointRadiusUnits: 'meters',
        pointRadiusMinPixels: 6,
        getFillColor: getCategoryColor as any,
        getLineColor: [32, 64, 128],
        getLineWidth: 2,
        lineWidthMinPixels: 1,
        getText: (feature: any) => feature.properties?.name ?? '',
        getTextSize: 14,
        getTextColor: [28, 37, 54],
        getTextPixelOffset: [0, -18]
      }),
    [featureCollection]
  )
  const widgets = useMemo(
    () => [
      createDeckFullscreenWidget('portable-query-fullscreen'),
      createDeckStatsWidget('portable-query-stats')
    ],
    []
  )

  return (
    <div style={pageStyle}>
      <div style={controlsStyle}>
        <div>
          <div style={eyebrowStyle}>Portable table query</div>
          <h1 style={titleStyle}>One query, two physical backends</h1>
          <p style={copyStyle}>
            Arrow scans the canonical table directly. DuckDB is loaded and populated lazily only
            when selected.
          </p>
        </div>

        <label style={labelStyle}>
          Backend
          <select
            aria-label="Query backend"
            value={backend}
            onChange={event => setBackend(event.target.value as QueryBackend)}
            style={inputStyle}
          >
            <option value="arrow">Direct Arrow table</option>
            <option value="duckdb">DuckDB-Wasm</option>
          </select>
        </label>

        <div style={fieldGridStyle}>
          <label style={labelStyle}>
            Minimum visitors
            <input
              type="number"
              min={0}
              value={minimumVisitors}
              onChange={event => setMinimumVisitors(Math.max(0, Number(event.target.value)))}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Limit
            <input
              type="number"
              min={0}
              value={limit}
              onChange={event => setLimit(Math.max(0, Number(event.target.value)))}
              style={inputStyle}
            />
          </label>
        </div>

        <details open>
          <summary style={summaryStyle}>Portable query plan</summary>
          <pre style={codeStyle}>{JSON.stringify(query, null, 2)}</pre>
        </details>
        <details>
          <summary style={summaryStyle}>Generated DuckDB SQL</summary>
          <pre style={codeStyle}>
            {compiledQuery.sql}
            {'\n\n'}bindings: {JSON.stringify(compiledQuery.parameters)}
          </pre>
        </details>

        <div style={actionsStyle}>
          <button type="button" onClick={() => void runQuery()} disabled={isRunning} style={buttonStyle}>
            {isRunning ? 'Running…' : `Run with ${backend === 'arrow' ? 'Arrow' : 'DuckDB'}`}
          </button>
          <span style={statusStyle}>
            {rowCount} rows · {durationMilliseconds.toFixed(1)} ms
          </span>
        </div>
        <div style={noteStyle}>
          DuckDB: {duckDBInitialized ? 'initialized and populated' : 'not loaded'}
        </div>
        {error ? <div style={errorStyle}>{error}</div> : null}
      </div>

      <div style={mapContainerStyle}>
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={{type: MapController}}
          layers={[layer]}
          widgets={widgets}
          getTooltip={({object}: {object?: Feature<Point>}) => {
            if (!object?.properties) {
              return null
            }
            return {
              html: `
                <div><strong>${String(object.properties.name ?? '')}</strong></div>
                <div>${String(object.properties.category ?? '')}</div>
                <div>Visitors: ${String(object.properties.visitors ?? '')}</div>
              `
            }
          }}
        >
          <Map reuseMaps mapLib={maplibregl as any} mapStyle={MAP_STYLE} />
        </DeckGL>
      </div>
    </div>
  )
}

/** Mount the example into a DOM element. */
export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />)
}

/** Creates the logical query shared by the Arrow and DuckDB backends. */
function createTableQuery(limit: number): SQLTableQuery {
  return {tableName: 'sf_places', columns: OUTPUT_COLUMNS, predicate: VISITOR_PREDICATE, limit}
}

/** Creates and populates the DuckDB database on first use. */
async function initializeDuckDBDataSource(): Promise<DuckDBSQLDataSource> {
  const dataSource = new DuckDBSQLDataSource('duckdb:///:memory:', {
    duckdb: {accessMode: 'read-write'}
  })
  await dataSource.queryRows(CREATE_TABLE_SQL)
  await dataSource.queryRows(createInsertRowsSQL(SAMPLE_ROWS))
  return dataSource
}

/** Generates the example's trusted one-time DuckDB ingestion statement. */
function createInsertRowsSQL(rows: readonly GeospatialRow[]): string {
  const values = rows.map(
    row =>
      `(${row.id}, '${escapeSQLString(row.name)}', '${escapeSQLString(row.category)}', ${row.longitude}, ${row.latitude}, ${row.visitors})`
  )
  return `INSERT INTO sf_places VALUES\n${values.join(',\n')}`
}

/** Escapes a trusted example string for its one-time insertion statement. */
function escapeSQLString(value: string): string {
  return value.replace(/'/g, "''")
}

/** Converts an Arrow result to the rows consumed by the map. */
function arrowTableToRows(table: ArrowTable): GeospatialRow[] {
  return table.data.toArray().map(row => row?.toJSON() as GeospatialRow)
}

/** Convert query results into GeoJSON features. */
function buildQueryState(rows: GeospatialRow[]): QueryState {
  const features = rows.map(buildFeature)
  return {featureCollection: {type: 'FeatureCollection', features}, rowCount: rows.length}
}

/** Convert a geospatial row into a GeoJSON point feature. */
function buildFeature(row: GeospatialRow): Feature<Point> {
  const longitude = Number(row.longitude)
  const latitude = Number(row.latitude)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error('Query results must include numeric longitude and latitude columns.')
  }
  return {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [longitude, latitude]},
    properties: row
  }
}

/** Return a stable color for a category. */
function getCategoryColor(feature: Feature<Point>): [number, number, number, number] {
  switch (feature.properties?.category) {
    case 'park': return [33, 128, 89, 190]
    case 'museum': return [155, 89, 182, 190]
    case 'stadium': return [230, 126, 34, 190]
    case 'market': return [46, 134, 193, 190]
    default: return [231, 76, 60, 190]
  }
}

/** Extract a readable message from an unknown error value. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const pageStyle: CSSProperties = {display: 'grid', gridTemplateColumns: 'minmax(360px, 480px) 1fr', height: '100%', backgroundColor: '#f3f6fb'}
const controlsStyle: CSSProperties = {display: 'grid', alignContent: 'start', gap: 16, padding: 20, overflowY: 'auto', borderRight: '1px solid #d9e2ef', backgroundColor: '#ffffff'}
const eyebrowStyle: CSSProperties = {fontSize: 12, fontWeight: 700, color: '#2e86c1', textTransform: 'uppercase'}
const titleStyle: CSSProperties = {margin: '6px 0 8px', fontSize: 28, lineHeight: 1.15, color: '#1c2536'}
const copyStyle: CSSProperties = {margin: 0, color: '#5d6d7e', lineHeight: 1.5}
const fieldGridStyle: CSSProperties = {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12}
const labelStyle: CSSProperties = {display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: '#34495e'}
const inputStyle: CSSProperties = {width: '100%', boxSizing: 'border-box', padding: '9px 10px', border: '1px solid #c5d3e0', borderRadius: 7, backgroundColor: '#ffffff', color: '#1c2536'}
const summaryStyle: CSSProperties = {cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#34495e'}
const codeStyle: CSSProperties = {maxHeight: 210, overflow: 'auto', margin: '8px 0 0', padding: 12, borderRadius: 8, backgroundColor: '#f7fafc', border: '1px solid #d9e2ef', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap'}
const actionsStyle: CSSProperties = {display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'}
const buttonStyle: CSSProperties = {appearance: 'none', border: 'none', borderRadius: 8, backgroundColor: '#2e86c1', color: '#ffffff', fontSize: 14, fontWeight: 600, padding: '10px 14px', cursor: 'pointer'}
const statusStyle: CSSProperties = {fontSize: 13, color: '#5d6d7e'}
const noteStyle: CSSProperties = {padding: '8px 10px', borderRadius: 7, backgroundColor: '#eef6fb', color: '#2874a6', fontSize: 12}
const errorStyle: CSSProperties = {borderRadius: 8, padding: 12, backgroundColor: '#fdecea', color: '#b03a2e', fontSize: 13, lineHeight: 1.5}
const mapContainerStyle: CSSProperties = {position: 'relative', minWidth: 0}
