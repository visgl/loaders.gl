import React, {useEffect, useState} from 'react'
import styled from 'styled-components'

import {load, type LoaderOptions} from '@loaders.gl/core'
import {ArrowLoader} from '@loaders.gl/arrow'
import {CSVArrowLoader, CSVLoader} from '@loaders.gl/csv'
import {ExcelArrowLoader, ExcelLoader} from '@loaders.gl/excel'
import {JSONLoader, NDJSONArrowLoader, NDJSONLoader} from '@loaders.gl/json'
import type {Field, Table} from '@loaders.gl/schema'

const TABLE_ROW_LIMIT = 12
const TABLE_COLUMN_LIMIT = 8

/** Loader names supported by the docs table preview component. */
export type TableLiveExampleLoaderName =
  | 'ArrowLoader'
  | 'CSVArrowLoader'
  | 'CSVLoader'
  | 'ExcelArrowLoader'
  | 'ExcelLoader'
  | 'JSONLoader'
  | 'NDJSONArrowLoader'
  | 'NDJSONLoader'

/** Configuration for loading and rendering a tabular loader example in docs. */
export type TableLiveExampleConfig = {
  /** Loader to use for the table preview. */
  loaderName: TableLiveExampleLoaderName
  /** Source data URL to load in the browser. */
  url: string
  /** Loader options passed to loaders.gl. */
  options?: LoaderOptions
  /** Maximum number of rows to render. */
  rowLimit?: number
  /** Maximum number of columns to render. */
  columnLimit?: number
}

type TableLiveExampleState =
  | {
      /** Current preview state. */
      status: 'loading'
    }
  | {
      /** Current preview state. */
      status: 'loaded'
      /** Loaded loaders.gl table. */
      table: Table
    }
  | {
      /** Current preview state. */
      status: 'error'
      /** Error message from loading or parsing the table. */
      errorMessage: string
    }

const TableShell = styled.div`
  height: 100%;
  overflow: auto;
  border: 1px solid var(--ifm-table-border-color);
  border-radius: 8px;
  background: var(--ifm-background-color);
`

const StatusContainer = styled.div`
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: var(--ifm-color-emphasis-700);
`

const PreviewTable = styled.table`
  width: 100%;
  min-width: 720px;
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.85rem;
`

const HeaderCell = styled.th`
  position: sticky;
  top: 0;
  z-index: 1;
  max-width: 240px;
  padding: 0.55rem 0.7rem;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--ifm-background-surface-color);
`

const BodyCell = styled.td`
  max-width: 240px;
  padding: 0.5rem 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

/**
 * Loads a configured tabular file and renders a compact read-only table preview.
 */
export default function TableLiveExample({config}: {config: TableLiveExampleConfig}) {
  const [state, setState] = useState<TableLiveExampleState>({status: 'loading'})

  useEffect(() => {
    let isCancelled = false

    async function loadTable() {
      setState({status: 'loading'})

      try {
        const loader = getTableLoader(config.loaderName)
        const table = (await load(config.url, loader, config.options)) as Table

        if (!isCancelled) {
          setState({status: 'loaded', table})
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    loadTable()

    return () => {
      isCancelled = true
    }
  }, [config])

  return (
    <TableShell data-loader-live-table-example>
      {state.status === 'loading' && <StatusContainer>Loading table...</StatusContainer>}
      {state.status === 'error' && <StatusContainer>{state.errorMessage}</StatusContainer>}
      {state.status === 'loaded' && (
        <TablePreview
          table={state.table}
          rowLimit={config.rowLimit || TABLE_ROW_LIMIT}
          columnLimit={config.columnLimit || TABLE_COLUMN_LIMIT}
        />
      )}
    </TableShell>
  )
}

/**
 * Renders capped table rows and columns for a loaded table.
 */
function TablePreview({
  table,
  rowLimit,
  columnLimit
}: {
  /** Table to render. */
  table: Table
  /** Maximum number of rows to render. */
  rowLimit: number
  /** Maximum number of columns to render. */
  columnLimit: number
}) {
  const columnNames = getPreviewColumnNames(table).slice(0, columnLimit)
  const rowCount = Math.min(getPreviewRowCount(table), rowLimit)

  if (columnNames.length === 0) {
    return <StatusContainer>No table columns</StatusContainer>
  }

  return (
    <PreviewTable>
      <thead>
        <tr>
          {columnNames.map(columnName => (
            <HeaderCell key={columnName} title={columnName}>
              {columnName}
            </HeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({length: rowCount}, (_row, rowIndex) => (
          <tr key={rowIndex}>
            {columnNames.map((columnName, columnIndex) => {
              const cellText = formatCellValue(getPreviewCell(table, rowIndex, columnName, columnIndex))
              return (
                <BodyCell key={columnName} title={cellText}>
                  {cellText}
                </BodyCell>
              )
            })}
          </tr>
        ))}
      </tbody>
    </PreviewTable>
  )
}

/**
 * Resolves the concrete loaders.gl loader for a table preview registry entry.
 */
function getTableLoader(loaderName: TableLiveExampleLoaderName) {
  switch (loaderName) {
    case 'ArrowLoader':
      return ArrowLoader
    case 'CSVArrowLoader':
      return CSVArrowLoader
    case 'CSVLoader':
      return CSVLoader
    case 'ExcelArrowLoader':
      return ExcelArrowLoader
    case 'ExcelLoader':
      return ExcelLoader
    case 'JSONLoader':
      return JSONLoader
    case 'NDJSONArrowLoader':
      return NDJSONArrowLoader
    case 'NDJSONLoader':
      return NDJSONLoader
    default:
      throw new Error(loaderName)
  }
}

/**
 * Returns column names for every table shape supported by loaders.gl table loaders.
 */
function getPreviewColumnNames(table: Table): string[] {
  const schemaFieldNames = getSchemaFieldNames(table.schema?.fields)
  if (schemaFieldNames.length > 0) {
    return schemaFieldNames
  }

  switch (table.shape) {
    case 'array-row-table':
      return table.data[0]?.map((_value, columnIndex) => `column${columnIndex + 1}`) || []
    case 'object-row-table':
      return Object.keys(table.data[0] || {})
    case 'geojson-table':
      return Object.keys(table.features[0] || {})
    case 'columnar-table':
      return Object.keys(table.data)
    case 'arrow-table':
      return table.data.schema.fields.map(field => field.name)
    default:
      return []
  }
}

/**
 * Returns field names from a loaders.gl schema field array.
 */
function getSchemaFieldNames(fields?: Field[]): string[] {
  return fields?.map(field => field.name) || []
}

/**
 * Returns the row count for a table preview.
 */
function getPreviewRowCount(table: Table): number {
  switch (table.shape) {
    case 'array-row-table':
    case 'object-row-table':
      return table.data.length
    case 'geojson-table':
      return table.features.length
    case 'columnar-table':
      return Object.values(table.data)[0]?.length || 0
    case 'arrow-table':
      return table.data.numRows
    default:
      return 0
  }
}

/**
 * Returns one table cell from any table shape.
 */
function getPreviewCell(
  table: Table,
  rowIndex: number,
  columnName: string,
  columnIndex: number
): unknown {
  switch (table.shape) {
    case 'array-row-table':
      return table.data[rowIndex]?.[columnIndex]
    case 'object-row-table':
      return table.data[rowIndex]?.[columnName]
    case 'geojson-table':
      return table.features[rowIndex]?.[columnName]
    case 'columnar-table':
      return table.data[columnName]?.[rowIndex]
    case 'arrow-table':
      return table.data.getChildAt(columnIndex)?.get(rowIndex)
    default:
      return undefined
  }
}

/**
 * Formats a loaded table cell for compact display in the docs preview.
 */
function formatCellValue(value: unknown): string {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return ''
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (ArrayBuffer.isView(value)) {
    return `[${value.constructor.name}, ${value.byteLength} bytes]`
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatCellValue).join(', ')}]`
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (_error) {
      return Object.prototype.toString.call(value)
    }
  }
  return String(value)
}
