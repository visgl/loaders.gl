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

import {createDataSource} from '@loaders.gl/core'
import {DuckDBSQLSource} from '@loaders.gl/sql'
import type {DuckDBSQLDataSource} from '@loaders.gl/sql'
import {createDeckStatsWidget} from '../shared/create-deck-stats-widget'

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

const INITIAL_QUERY = `SELECT
  id,
  name,
  category,
  longitude,
  latitude,
  visitors
FROM sf_places
WHERE visitors >= 200000
ORDER BY visitors DESC`

const CREATE_TABLE_SQL = `
CREATE TABLE sf_places (
  id INTEGER,
  name VARCHAR,
  category VARCHAR,
  longitude DOUBLE,
  latitude DOUBLE,
  visitors INTEGER
)`

const INSERT_ROWS_SQL = `
INSERT INTO sf_places VALUES
  (1, 'Golden Gate Park', 'park', -122.4862, 37.7694, 24000000),
  (2, 'Ferry Building', 'market', -122.3933, 37.7955, 13000000),
  (3, 'Oracle Park', 'stadium', -122.3893, 37.7786, 3400000),
  (4, 'SFMOMA', 'museum', -122.4009, 37.7857, 1200000),
  (5, 'Presidio Tunnel Tops', 'park', -122.4776, 37.8039, 1800000),
  (6, 'Exploratorium', 'museum', -122.3983, 37.8014, 1100000),
  (7, 'Salesforce Park', 'park', -122.3958, 37.7890, 950000),
  (8, 'Coit Tower', 'landmark', -122.4058, 37.8024, 600000),
  (9, 'Chase Center', 'stadium', -122.3877, 37.7680, 2000000),
  (10, 'Alamo Square', 'park', -122.4346, 37.7764, 700000)
`

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json'

/**
 * Render the DuckDB SQL geospatial example.
 */
export default function App() {
  const dataSourceRef = useRef<DuckDBSQLDataSource | null>(null)
  const [queryText, setQueryText] = useState(INITIAL_QUERY)
  const [rowCount, setRowCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [featureCollection, setFeatureCollection] = useState<FeatureCollection<Point>>({
    type: 'FeatureCollection',
    features: []
  })

  useEffect(() => {
    let isMounted = true

    ;(async () => {
      try {
        const dataSource = createDataSource('duckdb:///:memory:', [DuckDBSQLSource], {
          duckdb: {
            accessMode: 'read-write'
          }
        }) as DuckDBSQLDataSource
        await dataSource.queryRows(CREATE_TABLE_SQL)
        await dataSource.queryRows(INSERT_ROWS_SQL)

        if (!isMounted) {
          await dataSource.close()
          return
        }

        dataSourceRef.current = dataSource
        setIsReady(true)
        await runQuery(INITIAL_QUERY, dataSource)
      } catch (initializationError) {
        if (isMounted) {
          setError(getErrorMessage(initializationError))
        }
      }
    })()

    return () => {
      isMounted = false
      if (dataSourceRef.current) {
        void dataSourceRef.current.close()
        dataSourceRef.current = null
      }
    }
  }, [])

  /**
   * Execute the SQL text and update the map state.
   */
  const runQuery = useCallback(
    async (sqlText: string, dataSource: DuckDBSQLDataSource | null = dataSourceRef.current) => {
      if (!dataSource) {
        return
      }

      setIsRunning(true)
      setError(null)

      try {
        const rows = (await dataSource.queryRows(sqlText)) as GeospatialRow[]
        const queryState = buildQueryState(rows)
        setFeatureCollection(queryState.featureCollection)
        setRowCount(queryState.rowCount)
      } catch (queryError) {
        setError(getErrorMessage(queryError))
      } finally {
        setIsRunning(false)
      }
    },
    []
  )

  const layer = useMemo(
    () =>
      new GeoJsonLayer({
        id: 'duckdb-sql-results',
        data: featureCollection,
        pickable: true,
        stroked: true,
        filled: true,
        pointType: 'circle+text',
        getPointRadius: 120,
        pointRadiusUnits: 'meters',
        pointRadiusMinPixels: 6,
        getFillColor: getCategoryColor,
        getLineColor: [32, 64, 128],
        getLineWidth: 2,
        lineWidthMinPixels: 1,
        getText: feature => feature.properties?.name ?? '',
        getTextSize: 14,
        getTextColor: [28, 37, 54],
        getTextPixelOffset: [0, -18]
      }),
    [featureCollection]
  )
  const widgets = useMemo(() => [createDeckStatsWidget('duckdb-sql-stats')], [])

  return (
    <div style={pageStyle}>
      <div style={controlsStyle}>
        <div>
          <div style={eyebrowStyle}>DuckDBSQLSource</div>
          <h1 style={titleStyle}>Run SQL against a geospatial table</h1>
          <p style={copyStyle}>
            The query must return <code>longitude</code> and <code>latitude</code> columns.
          </p>
        </div>
        <textarea
          aria-label="SQL query"
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          spellCheck={false}
          style={editorStyle}
        />
        <div style={actionsStyle}>
          <button
            type="button"
            onClick={() => void runQuery(queryText)}
            disabled={!isReady || isRunning}
            style={buttonStyle}
          >
            {isRunning ? 'Running…' : 'Run query'}
          </button>
          <span style={statusStyle}>
            {isReady ? `${rowCount} rows returned` : 'Starting DuckDB…'}
          </span>
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

/**
 * Mount the example into a DOM element.
 */
export function renderToDOM(container: HTMLElement) {
  createRoot(container).render(<App />)
}

/**
 * Convert query results into GeoJSON features.
 */
function buildQueryState(rows: GeospatialRow[]): QueryState {
  const features = rows.map(buildFeature)
  return {
    featureCollection: {
      type: 'FeatureCollection',
      features
    },
    rowCount: rows.length
  }
}

/**
 * Convert a geospatial row into a GeoJSON point feature.
 */
function buildFeature(row: GeospatialRow): Feature<Point> {
  const longitude = Number(row.longitude)
  const latitude = Number(row.latitude)
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new Error('Query results must include numeric longitude and latitude columns.')
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    properties: row
  }
}

/**
 * Return a stable color for a category.
 */
function getCategoryColor(feature: Feature<Point>): [number, number, number, number] {
  switch (feature.properties?.category) {
    case 'park':
      return [33, 128, 89, 190]
    case 'museum':
      return [155, 89, 182, 190]
    case 'stadium':
      return [230, 126, 34, 190]
    case 'market':
      return [46, 134, 193, 190]
    default:
      return [231, 76, 60, 190]
  }
}

/**
 * Extract a readable message from an unknown error value.
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

const pageStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(320px, 440px) 1fr',
  height: '100%',
  backgroundColor: '#f3f6fb'
}

const controlsStyle: CSSProperties = {
  display: 'grid',
  alignContent: 'start',
  gap: 16,
  padding: 20,
  borderRight: '1px solid #d9e2ef',
  backgroundColor: '#ffffff'
}

const eyebrowStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#2e86c1',
  textTransform: 'uppercase'
}

const titleStyle: CSSProperties = {
  margin: '6px 0 8px',
  fontSize: 28,
  lineHeight: 1.15,
  color: '#1c2536'
}

const copyStyle: CSSProperties = {
  margin: 0,
  color: '#5d6d7e',
  lineHeight: 1.5
}

const editorStyle: CSSProperties = {
  width: '100%',
  minHeight: 220,
  resize: 'vertical',
  borderRadius: 8,
  border: '1px solid #c5d3e0',
  backgroundColor: '#f7fafc',
  padding: 12,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 13,
  lineHeight: 1.5,
  color: '#1c2536',
  boxSizing: 'border-box'
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap'
}

const buttonStyle: CSSProperties = {
  appearance: 'none',
  border: 'none',
  borderRadius: 8,
  backgroundColor: '#2e86c1',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 14px',
  cursor: 'pointer'
}

const statusStyle: CSSProperties = {
  fontSize: 13,
  color: '#5d6d7e'
}

const errorStyle: CSSProperties = {
  borderRadius: 8,
  padding: 12,
  backgroundColor: '#fdecea',
  color: '#b03a2e',
  fontSize: 13,
  lineHeight: 1.5
}

const mapContainerStyle: CSSProperties = {
  position: 'relative',
  minWidth: 0
}
