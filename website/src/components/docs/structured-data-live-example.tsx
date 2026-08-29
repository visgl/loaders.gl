import React, {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useState
} from 'react';
import {load, type LoaderOptions} from '@loaders.gl/core';
import {BSONLoader} from '@loaders.gl/bson';
import {HTMLLoader, XMLLoader} from '@loaders.gl/xml';

import styles from './structured-data-live-example.module.css';

type StructuredDataLoaderName = 'XMLLoader' | 'HTMLLoader' | 'BSONLoader';

/** Configuration for loading and rendering a structured-data preview in docs. */
export type StructuredDataLiveExampleConfig = {
  /** Loader to use for the preview. */
  loaderName: StructuredDataLoaderName;
  /** Source data URL to load in the browser. */
  url: string;
  /** Named sample files for the source selector. */
  sampleFiles?: StructuredDataLiveExampleSampleFile[];
  /** Loader options passed to loaders.gl. */
  options?: LoaderOptions;
};

/** Named source file that can be selected from the source URL card. */
export type StructuredDataLiveExampleSampleFile = {
  /** User-visible sample file label. */
  label: string;
  /** Source URL loaded when the sample file is selected. */
  url: string;
};

type StructuredDataLiveExampleState =
  | {status: 'loading'}
  | {status: 'loaded'; sourceText: string; sourceLabel: string; parsedData: unknown}
  | {status: 'error'; errorMessage: string; sourceText?: string; sourceLabel?: string};

type StructuredDataLiveExampleSource = {
  /** User-visible source label. */
  label: string;
  /** Source input type. */
  type: 'url' | 'file';
  /** URL or file name shown in the source card. */
  value: string;
  /** File source, when the example was loaded through drag and drop. */
  file?: File;
};

const SOURCE_BYTE_LIMIT = 1024;

/**
 * Loads a configured XML or HTML file and renders source text beside parsed JSON output.
 */
export default function StructuredDataLiveExample({
  config
}: {
  /** Preview configuration. */
  config: StructuredDataLiveExampleConfig;
}): ReactNode {
  const [state, setState] = useState<StructuredDataLiveExampleState>({status: 'loading'});
  const [source, setSource] = useState<StructuredDataLiveExampleSource>({
    label: 'Source URL',
    type: 'url',
    value: config.url
  });
  const [sourceInputValue, setSourceInputValue] = useState(config.url);
  const [isDragActive, setIsDragActive] = useState(false);
  const [wrapSourceText, setWrapSourceText] = useState(false);

  useEffect(() => {
    setSource({label: 'Source URL', type: 'url', value: config.url});
    setSourceInputValue(config.url);
  }, [config.url]);

  useEffect(() => {
    let isCancelled = false;

    async function loadStructuredData(): Promise<void> {
      setState({status: 'loading'});
      let sourceText: string | undefined;
      let sourceLabel: string | undefined;

      try {
        const arrayBuffer = await loadSourceArrayBuffer(source);
        const sourceData = getStructuredDataSource(config.loaderName, arrayBuffer);
        sourceText = sourceData.sourceText;
        sourceLabel = sourceData.sourceLabel;
        const {loader} = sourceData;
        const parsedData = await load(arrayBuffer, loader, config.options);

        if (!isCancelled) {
          setState({status: 'loaded', sourceText, sourceLabel, parsedData});
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            status: 'error',
            errorMessage: formatLoadError(error),
            sourceText,
            sourceLabel
          });
        }
      }
    }

    loadStructuredData();

    return () => {
      isCancelled = true;
    };
  }, [config.loaderName, config.options, source]);

  function updateSourceUrl(): void {
    const nextUrl = sourceInputValue.trim();
    if (nextUrl) {
      setSource({label: 'Source URL', type: 'url', value: nextUrl});
    }
  }

  function handleSourceInputChange(event: ChangeEvent<HTMLInputElement>): void {
    setSourceInputValue(event.target.value);
  }

  function handleSampleFileChange(event: ChangeEvent<HTMLSelectElement>): void {
    const nextUrl = event.target.value;
    if (nextUrl) {
      setSource({label: 'Source URL', type: 'url', value: nextUrl});
      setSourceInputValue(nextUrl);
    }
  }

  function handleSourceInputKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      updateSourceUrl();
    }
  }

  function handleDragOver(event: DragEvent<HTMLFormElement>): void {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLFormElement>): void {
    event.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(event: DragEvent<HTMLFormElement>): void {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setSource({label: 'Dropped file', type: 'file', value: file.name, file});
      setSourceInputValue(file.name);
    }
  }

  return (
    <div className={styles.globalPreview}>
      <div className={styles.previewLayout}>
        <form
          className={`${styles.sourceSummaryCard} ${config.sampleFiles?.length ? styles.hasSamples : ''} ${isDragActive ? styles.dragActive : ''}`}
          onSubmit={(event) => {
            event.preventDefault();
            updateSourceUrl();
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
        {state.status === 'loading' && (
          <div className={styles.statusContainer}>Loading structured data...</div>
        )}
        {state.status === 'error' && state.sourceText && state.sourceLabel && (
          <>
            <StructuredSourcePane
              sourceLabel={state.sourceLabel}
              sourceText={state.sourceText}
              wrapSourceText={wrapSourceText}
              onToggleWrapSourceText={() => setWrapSourceText(value => !value)}
            />
            <section className={styles.previewPane}>
              <div className={styles.paneCard}>
                <div className={styles.paneLabel}>{config.loaderName}</div>
                <div className={styles.statusContainer}>No parsed output</div>
              </div>
            </section>
          </>
        )}
        {state.status === 'loaded' && (
          <>
            <StructuredSourcePane
              sourceLabel={state.sourceLabel}
              sourceText={state.sourceText}
              wrapSourceText={wrapSourceText}
              onToggleWrapSourceText={() => setWrapSourceText(value => !value)}
            />
            <section className={styles.previewPane}>
              <div className={styles.paneCard}>
                <div className={styles.paneLabel}>{config.loaderName}</div>
                <pre className={styles.previewText}>{JSON.stringify(state.parsedData, null, 2)}</pre>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Renders loaded structured-data source content.
 */
function StructuredSourcePane({
  sourceLabel,
  sourceText,
  wrapSourceText,
  onToggleWrapSourceText
}: {
  /** Source pane label. */
  sourceLabel: string;
  /** Source text or binary byte preview. */
  sourceText: string;
  /** Whether source text should wrap. */
  wrapSourceText: boolean;
  /** Toggles source text wrapping. */
  onToggleWrapSourceText: () => void;
}) {
  return (
    <section className={styles.previewPane}>
      <div className={styles.paneCard}>
        <div className={styles.paneHeader}>
          <div className={`${styles.paneLabel} ${styles.headerLabel}`}>{sourceLabel}</div>
          <button className={styles.toggleButton} type="button" onClick={onToggleWrapSourceText}>
            {wrapSourceText ? 'No Wrap' : 'Wrap'}
          </button>
        </div>
        <pre className={`${styles.previewText} ${wrapSourceText ? styles.wrapText : ''}`}>{sourceText}</pre>
      </div>
    </section>
  );
}

/**
 * Loads source bytes from either a remote URL or a dropped file.
 */
async function loadSourceArrayBuffer(source: StructuredDataLiveExampleSource): Promise<ArrayBuffer> {
  if (source.type === 'file') {
    if (!source.file) {
      throw new Error('No dropped file is available');
    }
    return await source.file.arrayBuffer();
  }

  const response = await fetch(source.value);
  if (!response.ok) {
    throw new Error(`Failed to load ${source.value}: ${response.status} ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Formats source loading and loader parser errors for the source URL card.
 */
function formatLoadError(error: unknown): string {
  if (error instanceof Error) {
    return error.name && error.name !== 'Error' ? `${error.name}: ${error.message}` : error.message;
  }
  return String(error);
}

/**
 * Returns the select value for the currently loaded source when it is a known sample.
 */
function getSelectedSampleUrl(
  sampleFiles: StructuredDataLiveExampleSampleFile[],
  source: StructuredDataLiveExampleSource
): string {
  if (source.type !== 'url') {
    return '';
  }
  return sampleFiles.some(sampleFile => sampleFile.url === source.value) ? source.value : '';
}

function getStructuredDataSource(loaderName: StructuredDataLoaderName, arrayBuffer: ArrayBuffer) {
  switch (loaderName) {
    case 'XMLLoader':
      return {
        loader: XMLLoader,
        sourceText: new TextDecoder().decode(arrayBuffer),
        sourceLabel: 'Source'
      };
    case 'HTMLLoader':
      return {
        loader: HTMLLoader,
        sourceText: new TextDecoder().decode(arrayBuffer),
        sourceLabel: 'Source'
      };
    case 'BSONLoader':
      return {
        loader: BSONLoader,
        sourceText: formatBinaryPreview(arrayBuffer),
        sourceLabel: 'Source bytes'
      };
    default:
      throw new Error(loaderName);
  }
}

function formatBinaryPreview(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  const previewLength = Math.min(bytes.length, SOURCE_BYTE_LIMIT);
  const rows: string[] = ['OFFSET  BYTES                       ASCII'];

  for (let offset = 0; offset < previewLength; offset += 8) {
    const rowBytes = Array.from(bytes.slice(offset, Math.min(offset + 8, previewLength)));
    const hex = rowBytes.map(byte => byte.toString(16).padStart(2, '0')).join(' ');
    const ascii = rowBytes
      .map(byte => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.'))
      .join('');
    rows.push(`${offset.toString(16).padStart(6, '0')}  ${hex.padEnd(23, ' ')}  ${ascii}`);
  }

  if (bytes.length > previewLength) {
    rows.push(`\n... ${bytes.length - previewLength} more bytes`);
  }

  return rows.join('\n');
}
