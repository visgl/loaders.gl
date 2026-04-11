import React, {type ReactNode, useEffect, useState} from 'react'
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
      /** Source preview content for the loaded file. */
      sourcePreview: SourcePreview
    }
  | {
      /** Current preview state. */
      status: 'error'
      /** Error message from loading or parsing the table. */
      errorMessage: string
    }

type SourcePreview = {
  /** Source preview mode for the left-hand panel. */
  mode: 'text' | 'binary'
  /** Panel label shown above the source preview. */
  label: string
  /** File size in bytes. */
  byteLength: number
  /** Rendered source preview content. */
  content: ReactNode
}

const PreviewLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: 1rem;
  align-items: stretch;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const PreviewPane = styled.section`
  min-width: 0;
  display: flex;
  flex-direction: column;
`

const PaneCard = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0.9rem;
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 12px;
  background: rgba(247, 250, 252, 0.92);
  box-shadow:
    0 20px 44px rgba(43, 56, 72, 0.12),
    0 6px 18px rgba(43, 56, 72, 0.08);
`

const PaneHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 0.75rem;
`

const PaneLabel = styled.div`
  margin: 0;
  color: var(--ifm-color-gray-700);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const PaneMeta = styled.div`
  margin: 0;
  color: var(--ifm-color-gray-700);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
`

const TableShell = styled.div`
  width: 100%;
  height: 32rem;
  overflow-x: auto;
  overflow-y: auto;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
`

const SourceShell = styled.div`
  width: 100%;
  height: 32rem;
  overflow: auto;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
`

const SourceViewport = styled.pre`
  min-height: 100%;
  margin: 0;
  padding: 1rem 1.05rem;
  overflow: visible;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--ifm-color-gray-900);
  font-family: var(--ifm-font-family-monospace);
  font-size: 0.8rem;
  line-height: 1.6;
  white-space: pre;
`

const BinaryViewport = styled.div`
  min-height: 100%;
  padding: 1rem 1.05rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--ifm-color-gray-900);
  font-family: var(--ifm-font-family-monospace);
  font-size: 0.8rem;
  line-height: 1.5;
`

const BinaryHeader = styled.div`
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.85rem;
  margin-bottom: 0.6rem;
  color: var(--ifm-color-gray-700);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const BinaryRow = styled.div`
  display: grid;
  grid-template-columns: 4.5rem 1fr;
  gap: 0.85rem;
  align-items: start;
  margin-bottom: 0.35rem;
`

const BinaryOffset = styled.div`
  color: var(--ifm-color-gray-700);
  font-weight: 700;
`

const BinaryBytes = styled.div`
  display: grid;
  grid-template-columns: repeat(8, minmax(0, max-content));
  gap: 0.45rem 0.6rem;
`

const BinaryByte = styled.div`
  width: 2.25rem;
  text-align: center;
`

const BinaryAscii = styled.div`
  min-height: 0.95rem;
  margin-top: 0.16rem;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
`

const BinaryHex = styled.div`
  color: var(--ifm-color-gray-800);
`

const BinaryOverflow = styled.div`
  margin-top: 0.9rem;
  color: var(--ifm-color-gray-700);
  font-weight: 600;
`

const StatusContainer = styled.div`
  display: flex;
  min-height: 6rem;
  min-width: 100%;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: var(--ifm-color-emphasis-700);
`

const PreviewTable = styled.table`
  width: max-content;
  min-width: min(36rem, 100%);
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.85rem;
  color: var(--ifm-color-gray-900);
  background: rgba(255, 255, 255, 0.96);
  border-radius: 8px;
  overflow: hidden;
`

const PreviewTableTitleCell = styled.th`
  padding: 0.95rem 1rem;
  text-align: center;
  background: var(--ifm-color-gray-200);
  border-bottom: 1px solid rgba(43, 56, 72, 0.12);
  color: var(--ifm-color-gray-900);
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.2;
`

const HeaderCell = styled.th`
  max-width: 240px;
  padding: 0.7rem 0.95rem;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--ifm-color-gray-200);
  border-bottom: 1px solid rgba(43, 56, 72, 0.12);
  color: var(--ifm-color-gray-900);
  font-size: 0.83rem;
  font-weight: 700;
`

const BodyCell = styled.td`
  max-width: 240px;
  padding: 0.68rem 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-bottom: 1px solid rgba(43, 56, 72, 0.08);
  color: var(--ifm-color-gray-800);
`

const PreviewRow = styled.tr`
  &:last-child ${BodyCell} {
    border-bottom: 0;
  }
`

const GlobalTableStyle = styled.div`
  html[data-theme='dark'] & ${PaneCard} {
    border-color: rgba(158, 174, 192, 0.26);
    background: rgba(29, 38, 49, 0.94);
    box-shadow:
      0 18px 42px rgba(0, 0, 0, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.24);
  }

  html[data-theme='dark'] & ${TableShell} {
    background: transparent;
  }

  html[data-theme='dark'] & ${SourceShell} {
    background: transparent;
  }

  html[data-theme='dark'] & ${PreviewTable} {
    background: rgba(36, 46, 58, 0.92);
    color: rgba(255, 255, 255, 0.92);
  }

  html[data-theme='dark'] & ${SourceViewport} {
    background: rgba(36, 46, 58, 0.92);
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${BinaryViewport} {
    background: rgba(36, 46, 58, 0.92);
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${BinaryHeader},
  html[data-theme='dark'] & ${BinaryOffset},
  html[data-theme='dark'] & ${BinaryOverflow},
  html[data-theme='dark'] & ${PaneMeta} {
    color: rgba(203, 213, 225, 0.9);
  }

  html[data-theme='dark'] & ${BinaryHex} {
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${HeaderCell} {
    background: rgba(72, 86, 104, 0.72);
    border-bottom-color: rgba(225, 232, 240, 0.14);
    color: rgba(255, 255, 255, 0.92);
  }

  html[data-theme='dark'] & ${PreviewTableTitleCell} {
    background: rgba(72, 86, 104, 0.72);
    border-bottom-color: rgba(225, 232, 240, 0.14);
    color: rgba(255, 255, 255, 0.92);
  }

  html[data-theme='dark'] & ${BodyCell} {
    border-bottom-color: rgba(225, 232, 240, 0.12);
    color: rgba(241, 245, 249, 0.9);
  }
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
        const response = await fetch(config.url)
        const arrayBuffer = await response.arrayBuffer()
        const loader = getTableLoader(config.loaderName)
        const table = (await load(arrayBuffer, loader, config.options)) as Table
        const sourcePreview = createSourcePreview(config.loaderName, arrayBuffer)

        if (!isCancelled) {
          setState({status: 'loaded', table, sourcePreview})
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
    <GlobalTableStyle>
      {state.status === 'loading' && <StatusContainer>Loading table...</StatusContainer>}
      {state.status === 'error' && <StatusContainer>{state.errorMessage}</StatusContainer>}
      {state.status === 'loaded' && (
        <PreviewLayout data-loader-live-table-example>
          <PreviewPane>
            <PaneCard>
              <PaneHeader>
                <PaneLabel>{state.sourcePreview.label}</PaneLabel>
                <PaneMeta>{formatByteCount(state.sourcePreview.byteLength)}</PaneMeta>
              </PaneHeader>
              <SourceShell>
                {state.sourcePreview.mode === 'text' ? (
                  <SourceViewport>{state.sourcePreview.content}</SourceViewport>
                ) : (
                  <BinaryViewport>{state.sourcePreview.content}</BinaryViewport>
                )}
              </SourceShell>
            </PaneCard>
          </PreviewPane>

          <PreviewPane>
            <PaneCard>
              <PaneHeader>
                <PaneLabel>Parsed table</PaneLabel>
                <PaneMeta>&nbsp;</PaneMeta>
              </PaneHeader>
              <TableShell>
                <TablePreview
                  loaderName={config.loaderName}
                  table={state.table}
                  rowLimit={config.rowLimit || TABLE_ROW_LIMIT}
                  columnLimit={config.columnLimit || TABLE_COLUMN_LIMIT}
                />
              </TableShell>
            </PaneCard>
          </PreviewPane>
        </PreviewLayout>
      )}
    </GlobalTableStyle>
  )
}

/**
 * Renders capped table rows and columns for a loaded table.
 */
function TablePreview({
  loaderName,
  table,
  rowLimit,
  columnLimit
}: {
  /** Loader name for the preview header. */
  loaderName: TableLiveExampleLoaderName
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
          <PreviewTableTitleCell colSpan={columnNames.length}>{loaderName}</PreviewTableTitleCell>
        </tr>
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
          <PreviewRow key={rowIndex}>
            {columnNames.map((columnName, columnIndex) => {
              const cellText = formatCellValue(getPreviewCell(table, rowIndex, columnName, columnIndex))
              return (
                <BodyCell key={columnName} title={cellText}>
                  {cellText}
                </BodyCell>
              )
            })}
          </PreviewRow>
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
 * Builds the source preview shown beside the parsed table preview.
 */
function createSourcePreview(
  loaderName: TableLiveExampleLoaderName,
  arrayBuffer: ArrayBuffer
): SourcePreview {
  if (isTextTableLoader(loaderName)) {
    return {
      mode: 'text',
      label: 'Source text',
      byteLength: arrayBuffer.byteLength,
      content: new TextDecoder().decode(new Uint8Array(arrayBuffer))
    }
  }

  return {
    mode: 'binary',
    label: 'Binary file',
    byteLength: arrayBuffer.byteLength,
    content: formatBinaryPreview(arrayBuffer)
  }
}

/**
 * Returns whether a table loader uses text source data.
 */
function isTextTableLoader(loaderName: TableLiveExampleLoaderName): boolean {
  switch (loaderName) {
    case 'CSVArrowLoader':
    case 'CSVLoader':
    case 'JSONLoader':
    case 'NDJSONArrowLoader':
    case 'NDJSONLoader':
      return true
    case 'ArrowLoader':
    case 'ExcelArrowLoader':
    case 'ExcelLoader':
      return false
    default:
      return false
  }
}

/**
 * Formats a compact hex and ASCII preview for binary source data.
 */
function formatBinaryPreview(arrayBuffer: ArrayBuffer): ReactNode {
  const bytes = new Uint8Array(arrayBuffer)
  const previewBytes = bytes.slice(0, 384)
  const rows: ReactNode[] = []

  for (let offset = 0; offset < previewBytes.length; offset += 8) {
    const row = previewBytes.slice(offset, offset + 8)
    rows.push(
      <BinaryRow key={offset}>
        <BinaryOffset>{offset.toString(16).padStart(4, '0')}</BinaryOffset>
        <BinaryBytes>
          {Array.from(row, (byte, index) => (
            <BinaryByte key={`${offset}-${index}`}>
              <BinaryHex>{byte.toString(16).padStart(2, '0')}</BinaryHex>
              <BinaryAscii>{getAsciiPreviewCharacter(byte)}</BinaryAscii>
            </BinaryByte>
          ))}
        </BinaryBytes>
      </BinaryRow>
    )
  }

  return (
    <>
      <BinaryHeader>
        <div>Offset</div>
        <div>ASCII / Hex bytes</div>
      </BinaryHeader>
      {rows}
      {bytes.length > previewBytes.length && (
        <BinaryOverflow>... {bytes.length - previewBytes.length} more bytes</BinaryOverflow>
      )}
    </>
  )
}

/**
 * Returns the display character for one byte in the binary preview.
 */
function getAsciiPreviewCharacter(byte: number): string {
  return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ''
}

/**
 * Formats the file size label for the source preview panel.
 */
function formatByteCount(byteLength: number): string {
  return `${byteLength.toLocaleString()} bytes`
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
