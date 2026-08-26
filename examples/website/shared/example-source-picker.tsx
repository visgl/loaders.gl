// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRoot, type Root} from 'react-dom/client';
import {CustomPanel} from '@deck.gl-community/widgets';
import {getCuratedExamples, type CuratedExample, type ExampleSurface} from './example-catalog';

/** A source selected by the shared example picker. */
export type ExampleSource = {
  /** URL or local file to load. */
  value: string | File;
  /** User-facing source label. */
  label: string;
  /** Inferred or explicitly selected format. */
  format: string;
  /** Curated dataset identifier when applicable. */
  curatedId?: string;
};

/** Props for the shared example source picker. */
export type ExampleSourcePickerProps = {
  /** Rendering surface that limits curated choices and inference. */
  surface: ExampleSurface;
  /** Current source label shown in the control. */
  selectedLabel?: string;
  /** Current source URL when the source is remote. */
  selectedUrl?: string;
  /** Called when the user chooses a source. */
  onSourceChange: (source: ExampleSource) => void;
};

/** Creates a panel-system panel containing the shared source picker. */
export function createExampleSourcePanel(
  props: ExampleSourcePickerProps
): CustomPanel {
  let root: Root | null = null;
  return new CustomPanel({
    id: `example-source-${props.surface}`,
    title: 'Choose data',
    keepMounted: false,
    onRenderHTML: rootElement => {
      root = createRoot(rootElement);
      root.render(<ExampleSourcePicker {...props} />);
      return () => {
        root?.unmount();
        root = null;
      };
    }
  });
}

function ExampleSourcePicker({surface, selectedLabel, selectedUrl, onSourceChange}: ExampleSourcePickerProps) {
  const curatedExamples = getCuratedExamples(surface);
  const handleFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    const source = {
      value: file,
      label: file.name,
      format: inferFormat(file.name)
    };
    onSourceChange(source);
  };

  return (
    <div
      onDragOver={event => event.preventDefault()}
      onDrop={event => {
        event.preventDefault();
        handleFile(event.dataTransfer.files[0]);
      }}
      style={styles.container}
    >
      <label style={styles.label}>
        Curated dataset
        <select
          value=""
          onChange={event => {
            const curatedExample = curatedExamples.find(example => example.id === event.target.value);
            if (curatedExample) {
              const source = toSource(curatedExample);
              updateShareableSourceState(source);
              onSourceChange(source);
            }
          }}
          style={styles.control}
        >
          <option value="">{selectedLabel || 'Select a dataset'}</option>
          {curatedExamples.map(example => (
            <option key={example.id} value={example.id}>
              {example.label}{example.mobileSafe ? ' · mobile' : ''}
            </option>
          ))}
        </select>
      </label>
      <label style={styles.label}>
        URL
        <input
          type="url"
          defaultValue={selectedUrl || ''}
          placeholder="https://…"
          style={styles.control}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              const url = event.currentTarget.value.trim();
              if (url) {
                const source = {value: url, label: getFileName(url), format: inferFormat(url)};
                updateShareableSourceState(source);
                onSourceChange(source);
              }
            }
          }}
        />
      </label>
      <label style={styles.dropZone}>
        <span>Drop a file here or choose one</span>
        <input type="file" onChange={event => handleFile(event.target.files?.[0])} style={styles.fileInput} />
      </label>
      <small style={styles.hint}>Format: URL extension is used when available; the renderer may apply a format override.</small>
    </div>
  );
}

function toSource(example: CuratedExample): ExampleSource {
  return {value: example.url, label: example.label, format: example.format, curatedId: example.id};
}

function inferFormat(value: string): string {
  const pathname = value.split('?')[0].toLowerCase();
  if (pathname.endsWith('.pmtiles')) return 'PMTiles';
  if (pathname.endsWith('.parquet')) return 'GeoParquet';
  if (pathname.endsWith('.ply')) return 'PLY';
  if (pathname.endsWith('.las') || pathname.endsWith('.laz')) return 'LAS';
  if (pathname.endsWith('.geojson') || pathname.endsWith('.json')) return 'GeoJSON';
  if (pathname.endsWith('.csv')) return 'CSV';
  return 'Auto';
}

function getFileName(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.slice(pathname.lastIndexOf('/') + 1) || 'Custom URL';
  } catch {
    return 'Custom URL';
  }
}

function updateShareableSourceState(source: ExampleSource): void {
  if (typeof window === 'undefined' || typeof source.value !== 'string') {
    return;
  }
  const url = new URL(window.location.href);
  url.searchParams.set('source', source.value);
  url.searchParams.set('format', source.format);
  if (source.curatedId) {
    url.searchParams.set('dataset', source.curatedId);
  } else {
    url.searchParams.delete('dataset');
  }
  window.history.replaceState({}, '', url);
}

const styles = {
  container: {display: 'grid', gap: 10, padding: '4px 0'},
  label: {display: 'grid', gap: 4, fontSize: 12},
  control: {boxSizing: 'border-box' as const, width: '100%', minHeight: 38, padding: '8px 10px', border: '1px solid rgba(148, 163, 184, 0.55)', borderRadius: 8, font: 'inherit'},
  dropZone: {display: 'grid', gap: 6, placeItems: 'center', padding: 14, border: '1px dashed rgba(59, 130, 246, 0.65)', borderRadius: 8, background: 'rgba(239, 246, 255, 0.7)', textAlign: 'center' as const, fontSize: 12},
  fileInput: {maxWidth: '100%', fontSize: 12},
  hint: {color: '#64748b', lineHeight: 1.4}
};
