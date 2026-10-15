// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  createPMTilesSample,
  selectPMTilesExampleTiles
} from './create-pmtiles';
import type {PMTilesExampleFormat, PMTilesExampleOptions} from './create-pmtiles';
import {createPMTilesArchiveInWorker} from './pmtiles-worker-client';
import styles from '../common/conversion.module.css';

/** A retained browser URL with a fixed safe download name. */
type ArchiveDownload = {
  /** Object URL revoked on replacement or unmount. */
  url: string;
  /** Download filename. */
  name: string;
};

/** Bounded browser authoring example, loaded separately from the map viewer. */
export default function PMTilesAuthoringApp() {
  const [mode, setMode] = useState('sample');
  const [format, setFormat] = useState<PMTilesExampleFormat>('geojson');
  const [tileType, setTileType] = useState<'mvt' | 'mlt'>('mvt');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [bounds, setBounds] = useState(['-180', '-85', '180', '85']);
  const [zoom, setZoom] = useState(1);
  const [columns, setColumns] = useState('');
  const [includeAttributes, setIncludeAttributes] = useState(true);
  const [idColumn, setIdColumn] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Ready to convert the offline sample.');
  const [error, setError] = useState('');
  const [download, setDownload] = useState<ArchiveDownload | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const downloadRef = useRef<string | null>(null);
  const effectiveFormat = mode === 'sample' ? 'geojson' : format;
  let selection: string;
  try {
    selection = `${
      selectPMTilesExampleTiles(
        bounds.map(value => (value.trim() ? Number(value) : NaN)),
        zoom
      ).length
    } tile addresses selected`;
  } catch (error) {
    selection = (error as Error).message;
  }

  useEffect(
    () => () => {
      const controller = controllerRef.current;
      controllerRef.current = null;
      controller?.abort();
      if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
    },
    []
  );

  /** Invalidates a prior download when its source or settings change. */
  function clearDownload(): void {
    if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
    downloadRef.current = null;
    setDownload(null);
    setError('');
    setMessage('Ready to generate.');
  }

  /** Selects a local file and infers only familiar suffixes; explicit format selection remains available. */
  function selectFile(next: File | undefined): void {
    if (!next || busy) return;
    clearDownload();
    setFile(next);
    setMode('file');
    setColumns('');
    setIdColumn('');
    if (/\.(tif|tiff)$/i.test(next.name)) setFormat('geotiff');
    else if (/\.(arrow|feather)$/i.test(next.name)) setFormat('arrow');
    else setFormat('geojson');
    setMessage(`Selected ${next.name}.`);
  }

  /** Captures one operation and discards obsolete/cancelled results, including on unmount. */
  async function generateArchive(): Promise<void> {
    if (controllerRef.current) return;
    clearDownload();
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setMessage('Generating archive…');
    try {
      const input = mode === 'sample' ? createPMTilesSample() : mode === 'file' ? file : url.trim();
      if (!input) throw new Error('Choose a file or enter a dataset URL.');
      const selectedColumns = columns
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
      const options: PMTilesExampleOptions = {
        format: effectiveFormat,
        tileType: effectiveFormat === 'geotiff' ? 'png' : tileType,
        bounds: bounds.map(value => (value.trim() ? Number(value) : NaN)),
        zoom,
        attributes: includeAttributes ? (selectedColumns.length ? selectedColumns : undefined) : [],
        idColumn: idColumn.trim() || undefined,
        bands: selectedColumns.length ? selectedColumns.map(Number) : undefined
      };
      const blob = await createPMTilesArchiveInWorker(input, options, controller.signal);
      if (controller.signal.aborted || controllerRef.current !== controller) return;
      const archiveUrl = URL.createObjectURL(blob);
      downloadRef.current = archiveUrl;
      setDownload({url: archiveUrl, name: `export-${options.tileType}.pmtiles`});
      setMessage(`Archive ready · ${(blob.size / 1024).toFixed(1)} KiB`);
    } catch (error) {
      if (controllerRef.current === controller) {
        if (controller.signal.aborted) setMessage('Conversion cancelled.');
        else {
          setError(error instanceof Error ? error.message : String(error));
          setMessage('Conversion failed.');
        }
      }
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <section
      className={styles.app}
      aria-label="Create PMTiles"
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        selectFile(event.dataTransfer.files[0]);
      }}
    >
      <header>
        <h2>Create a PMTiles archive</h2>
      </header>
      <form
        className={styles.steps}
        onSubmit={event => {
          event.preventDefault();
          void generateArchive();
        }}
      >
        <fieldset disabled={busy} onChange={clearDownload}>
          <legend>1. Choose data</legend>
          <label>
            Source
            <select
              value={mode}
              onChange={event => {
                setMode(event.target.value);
                setColumns('');
                setIdColumn('');
              }}
            >
              <option value="sample">Offline sample</option>
              <option value="file">Local file</option>
              <option value="url">Dataset URL</option>
            </select>
          </label>
          {mode === 'sample' ? (
            <p>Two points with scalar attributes. No network access needed.</p>
          ) : (
            <>
              <label>
                Input format
                <select
                  value={format}
                  onChange={event => {
                    setFormat(event.target.value as PMTilesExampleFormat);
                    setColumns('');
                    setIdColumn('');
                  }}
                >
                  <option value="geojson">GeoJSON</option>
                  <option value="arrow">GeoArrow IPC / Feather</option>
                  <option value="geotiff">GeoTIFF / COG</option>
                </select>
              </label>
              {mode === 'file' ? (
                <label>
                  Local dataset
                  <input
                    type="file"
                    accept=".json,.geojson,.arrow,.feather,.tif,.tiff"
                    onChange={event => {
                      event.stopPropagation();
                      selectFile(event.target.files?.[0]);
                    }}
                  />
                  {file && <span>{file.name}</span>}
                </label>
              ) : (
                <label>
                  Dataset URL
                  <input
                    type="url"
                    value={url}
                    placeholder="https://example.com/data.geojson"
                    onChange={event => setUrl(event.target.value)}
                  />
                </label>
              )}
            </>
          )}
          <p className={styles.hint}>
            Drop a file anywhere in this panel. Input limit: 32 MiB. URLs need CORS access.
          </p>
        </fieldset>
        <fieldset disabled={busy} onChange={clearDownload}>
          <legend>2. Choose tiles</legend>
          <div className={styles.bounds}>
            {['West', 'South', 'East', 'North'].map((label, index) => (
              <label key={label}>
                {label}
                <input
                  type="number"
                  step="any"
                  value={bounds[index]}
                  onChange={event =>
                    setBounds(current =>
                      current.map((value, position) =>
                        position === index ? event.target.value : value
                      )
                    )
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Zoom
            <select value={zoom} onChange={event => setZoom(Number(event.target.value))}>
              {Array.from({length: 9}, (_, value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <p className={styles.hint}>
            {selection}. Exports whole intersecting tiles, up to 64 addresses.
          </p>
        </fieldset>
        <fieldset disabled={busy} onChange={clearDownload}>
          <legend>3. Choose output</legend>
          {effectiveFormat === 'geotiff' ? (
            <>
              <p>PNG tiles · byte grayscale, gray/alpha, RGB or RGBA imagery.</p>
              <label>
                Bands (zero-based, comma-separated)
                <input
                  value={columns}
                  placeholder="All bands, or 0,1,2"
                  onChange={event => setColumns(event.target.value)}
                />
              </label>
              <p className={styles.hint}>
                EPSG:3857, EPSG:4326 or OGC:CRS84. Scientific styling and other CRS reprojection
                require preprocessing.
              </p>
            </>
          ) : (
            <>
              <label>
                Tile format
                <select
                  value={tileType}
                  onChange={event => setTileType(event.target.value as 'mvt' | 'mlt')}
                >
                  <option value="mvt">MVT</option>
                  <option value="mlt">MLT</option>
                </select>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={includeAttributes}
                  onChange={event => setIncludeAttributes(event.target.checked)}
                />
                Include attributes
              </label>
              <label>
                Attributes (comma-separated)
                <input
                  disabled={!includeAttributes}
                  value={columns}
                  placeholder="All attributes, or name,height"
                  onChange={event => setColumns(event.target.value)}
                />
              </label>
              <label>
                Feature ID column (optional)
                <input
                  value={idColumn}
                  placeholder="No feature IDs, or id"
                  onChange={event => setIdColumn(event.target.value)}
                />
              </label>
              <p className={styles.hint}>
                Longitude/latitude geometry, up to 50,000 rows. Select scalar columns when input
                contains nested attributes.
              </p>
            </>
          )}
        </fieldset>
        <div className={styles.actions}>
          <button type="submit" disabled={busy}>
            Generate PMTiles
          </button>
          {busy && (
            <button type="button" onClick={() => controllerRef.current?.abort()}>
              Cancel
            </button>
          )}
          {download && (
            <a className={styles.download} href={download.url} download={download.name}>
              Download PMTiles
            </a>
          )}
        </div>
      </form>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <p className={styles.hint}>
        32 MiB maximum archive. Conversion runs locally in a worker. No data is uploaded.
      </p>
    </section>
  );
}

/** Mounts the standalone example without adding browser globals to server rendering. */
export function renderToDOM(container: HTMLElement): void {
  createRoot(container).render(<PMTilesAuthoringApp />);
}
