import React, {type ChangeEvent, type DragEvent, type KeyboardEvent, type ReactNode, useEffect, useState} from 'react'

import {load, type LoaderOptions} from '@loaders.gl/core'
import {ArrowLoader} from '@loaders.gl/arrow'
import {CSVLoader} from '@loaders.gl/csv'
import {ExcelLoader} from '@loaders.gl/excel'
import {JSONLoader, NDJSONLoader} from '@loaders.gl/json'
import type {Field, Table} from '@loaders.gl/schema'
import {ChromeTraceLoader} from '@loaders.gl/traces'

import styles from './table-live-example.module.css'

const TABLE_ROW_LIMIT = 12
const TABLE_COLUMN_LIMIT = 8

/** Loader names supported by the docs table preview component. */
export type TableLiveExampleLoaderName =
  | 'ArrowLoader'
  | 'CSVLoader'
  | 'ExcelLoader'
  | 'JSONLoader'
  | 'NDJSONLoader'
  | 'ChromeTraceLoader'

/** Configuration for loading and rendering a tabular loader example in docs. */
export type TableLiveExampleConfig = {
  /** Loader to use for the table preview. */
  loaderName: TableLiveExampleLoaderName
  /** Source data URL to load in the browser. */
  url: string
  /** Named sample files for the source selector. */
  sampleFiles?: TableLiveExampleSampleFile[]
  /** Loader options passed to loaders.gl. */
  options?: LoaderOptions
  /** Maximum number of rows to render. */
  rowLimit?: number
  /** Maximum number of columns to render. */
  columnLimit?: number
}

/** Named source file that can be selected from the source URL card. */
export type TableLiveExampleSampleFile = {
  /** User-visible sample file label. */
  label: string
  /** Source URL loaded when the sample file is selected. */
  url: string
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
      /** Source preview content, when source bytes loaded before parsing failed. */
      sourcePreview?: SourcePreview
    }

type TableLiveExampleSource = {
  /** User-visible source label. */
  label: string
  /** Source input type. */
  type: 'url' | 'file'
  /** URL or file name shown in the source card. */
  value: string
  /** File source, when the example was loaded through drag and drop. */
  file?: File
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

/** Minimal Apache Arrow table contract used by the docs preview. */
type ArrowTableLike = {
  /** Apache Arrow schema with ordered field names. */
  schema: {
    /** Ordered Arrow schema fields. */
    fields: {name: string}[]
  }
  /** Number of rows in the Arrow table. */
  numRows: number
  /** Returns one column vector by index. */
  getChildAt(columnIndex: number): {get(rowIndex: number): unknown} | null
}

/**
 * Loads a configured tabular file and renders a compact read-only table preview.
 */
export default function TableLiveExample({config}: {config: TableLiveExampleConfig}) {
  const [state, setState] = useState<TableLiveExampleState>({status: 'loading'})
  const [source, setSource] = useState<TableLiveExampleSource>({
    label: 'Source URL',
    type: 'url',
    value: config.url
  })
  const [sourceInputValue, setSourceInputValue] = useState(config.url)
  const [isDragActive, setIsDragActive] = useState(false)
  const [wrapSourceText, setWrapSourceText] = useState(false)

  useEffect(() => {
    setSource({label: 'Source URL', type: 'url', value: config.url})
    setSourceInputValue(config.url)
  }, [config.url])

  useEffect(() => {
    let isCancelled = false

    async function loadTable() {
      setState({status: 'loading'})
      let sourcePreview: SourcePreview | undefined

      try {
        const arrayBuffer = await loadSourceArrayBuffer(source)
        sourcePreview = createSourcePreview(config.loaderName, arrayBuffer)
        const loader = getTableLoader(config.loaderName)
        const table = normalizeLoadedTable(await load(arrayBuffer, loader, config.options))

        if (!isCancelled) {
          setState({status: 'loaded', table, sourcePreview})
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            status: 'error',
            errorMessage: formatLoadError(error, config.loaderName, source),
            sourcePreview
          })
        }
      }
    }

    loadTable()

    return () => {
      isCancelled = true
    }
  }, [config.loaderName, config.options, source])

  function updateSourceUrl() {
    const nextUrl = sourceInputValue.trim()
    if (nextUrl) {
      setSource({label: 'Source URL', type: 'url', value: nextUrl})
    }
  }

  function handleSourceInputChange(event: ChangeEvent<HTMLInputElement>) {
    setSourceInputValue(event.target.value)
  }

  function handleSampleFileChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextUrl = event.target.value
    if (nextUrl) {
      setSource({label: 'Source URL', type: 'url', value: nextUrl})
      setSourceInputValue(nextUrl)
    }
  }

  function handleSourceInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      updateSourceUrl()
    }
  }

  function handleDragOver(event: DragEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave(event: DragEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsDragActive(false)
  }

  function handleDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsDragActive(false)
    const file = event.dataTransfer.files[0]
    if (file) {
      setSource({label: 'Dropped file', type: 'file', value: file.name, file})
      setSourceInputValue(file.name)
    }
  }

  return (
    <div className={styles.globalTableStyle}>
      <div className={styles.previewLayout} data-loader-live-table-example>
        <form
          className={`${styles.sourceSummaryCard} ${config.sampleFiles?.length ? styles.hasSamples : ''} ${isDragActive ? styles.dragActive : ''}`}
          onSubmit={(event) => {
            event.preventDefault()
            updateSourceUrl()
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={styles.sourceSummaryLabel}>{source.label}</div>
          {config.sampleFiles?.length ? (
            <select
              className={styles.sourceSampleSelect}
              aria-label="Sample file"
              value={getSelectedSampleUrl(config.sampleFiles, source)}
              onChange={handleSampleFileChange}
            >
              <option value="">Sample files</option>
              {config.sampleFiles.map(sampleFile => (
                <option key={sampleFile.url} value={sampleFile.url}>
                  {sampleFile.label}
                </option>
              ))}
            </select>
          ) : null}
          <input
            className={styles.sourceInput}
            aria-label="Source URL or dropped file"
            value={sourceInputValue}
            placeholder="Enter a source URL or drop a file"
            onChange={handleSourceInputChange}
            onBlur={updateSourceUrl}
            onKeyDown={handleSourceInputKeyDown}
            readOnly={source.type === 'file'}
            title={source.value}
          />
          <button className={styles.sourceAction} type="submit">Load</button>
          {state.status === 'error' && (
            <div className={styles.sourceErrorMessage} role="alert">
              <div className={styles.sourceErrorLabel}>Loader error</div>
              <pre className={styles.sourceErrorText}>{state.errorMessage}</pre>
            </div>
          )}
        </form>
        {state.status === 'loading' && <div className={styles.statusContainer}>Loading table...</div>}
        {state.status === 'error' && state.sourcePreview && (
          <>
            <SourcePreviewPane
              sourcePreview={state.sourcePreview}
              wrapSourceText={wrapSourceText}
              onToggleWrapSourceText={() => setWrapSourceText(value => !value)}
            />
            <section className={styles.previewPane}>
              <div className={styles.paneCard}>
                <div className={styles.paneHeader}>
                  <div className={styles.paneLabel}>Parsed table</div>
                  <div className={styles.paneMeta}>&nbsp;</div>
                </div>
                <div className={styles.statusContainer}>No parsed table</div>
              </div>
            </section>
          </>
        )}
        {state.status === 'loaded' && (
          <>
            <SourcePreviewPane
              sourcePreview={state.sourcePreview}
              wrapSourceText={wrapSourceText}
              onToggleWrapSourceText={() => setWrapSourceText(value => !value)}
            />

            <section className={styles.previewPane}>
              <div className={styles.paneCard}>
                <div className={styles.paneHeader}>
                  <div className={styles.paneLabel}>Parsed table</div>
                  <div className={styles.paneMeta}>&nbsp;</div>
                </div>
                <div className={styles.tableShell}>
                  <TablePreview
                    table={state.table}
                    rowLimit={config.rowLimit || TABLE_ROW_LIMIT}
                    columnLimit={config.columnLimit || TABLE_COLUMN_LIMIT}
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Renders the loaded source bytes beside the parsed table.
 */
function SourcePreviewPane({
  sourcePreview,
  wrapSourceText,
  onToggleWrapSourceText
}: {
  /** Source preview content for the loaded file. */
  sourcePreview: SourcePreview
  /** Whether to wrap text source content. */
  wrapSourceText: boolean
  /** Toggles text wrapping for source content. */
  onToggleWrapSourceText: () => void
}) {
  return (
    <section className={styles.previewPane}>
      <div className={styles.paneCard}>
        <div className={styles.paneHeader}>
          <div className={styles.paneLabel}>{sourcePreview.label}</div>
          <div className={styles.headerActions}>
            {sourcePreview.mode === 'text' && (
              <button className={styles.toggleButton} type="button" onClick={onToggleWrapSourceText}>
                {wrapSourceText ? 'No Wrap' : 'Wrap'}
              </button>
            )}
            <div className={styles.paneMeta}>{formatByteCount(sourcePreview.byteLength)}</div>
          </div>
        </div>
        <div className={styles.sourceShell}>
          {sourcePreview.mode === 'text' ? (
            <pre className={`${styles.sourceViewport} ${wrapSourceText ? styles.wrapText : ''}`}>{sourcePreview.content}</pre>
          ) : (
            <div className={styles.binaryViewport}>{sourcePreview.content}</div>
          )}
        </div>
      </div>
    </section>
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
    return <div className={styles.statusContainer}>No table columns</div>
  }

  return (
    <table className={styles.previewTable}>
      <thead className={styles.previewTableHead}>
        <tr>
          {columnNames.map(columnName => (
            <th className={styles.headerCell} key={columnName} title={columnName}>
              {columnName}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({length: rowCount}, (_row, rowIndex) => (
          <tr className={styles.previewRow} key={rowIndex}>
            {columnNames.map((columnName, columnIndex) => {
              const cellText = formatCellValue(getPreviewCell(table, rowIndex, columnName, columnIndex))
              return (
                <td className={styles.bodyCell} key={columnName} title={cellText}>
                  {cellText}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * Loads source bytes from either a remote URL or a dropped file.
 */
async function loadSourceArrayBuffer(source: TableLiveExampleSource): Promise<ArrayBuffer> {
  if (source.type === 'file') {
    if (!source.file) {
      throw new Error('No dropped file is available')
    }
    return await source.file.arrayBuffer()
  }

  const response = await fetch(source.value)
  if (!response.ok) {
    throw new Error(`Failed to load ${source.value}: ${response.status} ${response.statusText}`)
  }
  return await response.arrayBuffer()
}

/**
 * Formats source loading and loader parser errors for the source URL card.
 */
function formatLoadError(
  error: unknown,
  loaderName: TableLiveExampleLoaderName,
  source: TableLiveExampleSource
): string {
  const message =
    error instanceof Error
      ? error.name && error.name !== 'Error'
        ? `${error.name}: ${error.message}`
        : error.message
      : String(error)

  if (loaderName === 'JSONLoader' && message.includes('failed to parse JSON')) {
    const fileContext = source.type === 'file' ? `\n\nDropped file: ${source.value}` : ''
    return `${message}${fileContext}

This preview is configured to parse JSON as a table. The file can still be valid JSON, but it must be a JSON array of rows or contain a nested row array that can be converted to a table. Files such as Mapbox style JSON from the MVT tests are better opened in the MVT example or with a non-tabular JSON preview.`
  }

  return message
}

/**
 * Returns the select value for the currently loaded source when it is a known sample.
 */
function getSelectedSampleUrl(
  sampleFiles: TableLiveExampleSampleFile[],
  source: TableLiveExampleSource
): string {
  if (source.type !== 'url') {
    return ''
  }
  return sampleFiles.some(sampleFile => sampleFile.url === source.value) ? source.value : ''
}

/**
 * Resolves the concrete loaders.gl loader for a table preview registry entry.
 */
function getTableLoader(loaderName: TableLiveExampleLoaderName) {
  switch (loaderName) {
    case 'ArrowLoader':
      return ArrowLoader
    case 'CSVLoader':
      return CSVLoader
    case 'ExcelLoader':
      return ExcelLoader
    case 'JSONLoader':
      return JSONLoader
    case 'NDJSONLoader':
      return NDJSONLoader
    case 'ChromeTraceLoader':
      return ChromeTraceLoader
    default:
      throw new Error(loaderName)
  }
}

/**
 * Normalizes direct Apache Arrow loader output into the loaders.gl ArrowTable wrapper shape.
 */
function normalizeLoadedTable(data: unknown): Table {
  if (isArrowTableLike(data)) {
    return {
      shape: 'arrow-table',
      data
    } as Table
  }

  return data as Table
}

/**
 * Returns true when a value has the Apache Arrow table methods needed by the preview.
 */
function isArrowTableLike(data: unknown): data is ArrowTableLike {
  return (
    typeof data === 'object' &&
    data !== null &&
    'schema' in data &&
    'numRows' in data &&
    'getChildAt' in data &&
    typeof (data as ArrowTableLike).getChildAt === 'function' &&
    Array.isArray((data as ArrowTableLike).schema?.fields)
  )
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
    case 'CSVLoader':
    case 'JSONLoader':
    case 'NDJSONLoader':
    case 'ChromeTraceLoader':
      return true
    case 'ArrowLoader':
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
      <div className={styles.binaryRow} key={offset}>
        <div className={styles.binaryOffset}>{offset.toString(16).padStart(4, '0')}</div>
        <div className={styles.binaryBytes} style={{gridTemplateColumns: 'repeat(8, minmax(0, max-content))'}}>
          {Array.from(row, (byte, index) => (
            <div className={styles.binaryByte} key={`${offset}-${index}`}>
              <div className={styles.binaryHex}>{byte.toString(16).padStart(2, '0')}</div>
              <div className={styles.binaryAscii}>{getAsciiPreviewCharacter(byte)}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.binaryHeader}>
        <div>Offset</div>
        <div>ASCII / Hex bytes</div>
      </div>
      {rows}
      {bytes.length > previewBytes.length && (
        <div className={styles.binaryOverflow}>... {bytes.length - previewBytes.length} more bytes</div>
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
