// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CustomPanel} from '@deck.gl-community/widgets';
import {
  getCuratedExample,
  getCuratedExamples,
  type CuratedExample,
  type ExampleSurface
} from './example-catalog';

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

/** Reads a remote source previously written to the current page URL. */
export function getExampleSourceFromUrl(surface: ExampleSurface): ExampleSource | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const url = new URL(window.location.href);
  const sourceUrl = url.searchParams.get('source');
  const curatedExample = getCuratedExample(url.searchParams.get('dataset'));
  if (curatedExample && curatedExample.surface === surface) {
    return toSource(curatedExample);
  }
  if (!sourceUrl) {
    return null;
  }

  return {
    value: sourceUrl,
    label: getFileName(sourceUrl),
    format: url.searchParams.get('format') || inferFormat(sourceUrl)
  };
}

/** Creates a panel-system panel containing the shared source picker. */
export function createExampleSourcePanel(
  props: ExampleSourcePickerProps
): CustomPanel {
  return new CustomPanel({
    id: `example-source-${props.surface}`,
    title: 'Choose data',
    keepMounted: false,
    onRenderHTML: rootElement => {
      renderExampleSourcePicker(rootElement, props);
    }
  });
}

function renderExampleSourcePicker(rootElement: HTMLElement, props: ExampleSourcePickerProps): void {
  const {surface, selectedLabel, selectedUrl, onSourceChange} = props;
  const curatedExamples = getCuratedExamples(surface);
  rootElement.replaceChildren();
  rootElement.style.fontSize = '11px';
  const detailsElement = document.createElement('details');
  const summaryElement = document.createElement('summary');
  summaryElement.textContent = 'Source options';
  summaryElement.style.cursor = 'pointer';
  summaryElement.style.fontWeight = '600';
  detailsElement.appendChild(summaryElement);
  const contentElement = document.createElement('div');
  contentElement.style.display = 'grid';
  contentElement.style.gap = '6px';
  contentElement.style.padding = '6px 0 0';
  detailsElement.appendChild(contentElement);
  rootElement.appendChild(detailsElement);

  const handleFile = (file: File | undefined): void => {
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

  const curatedLabel = document.createElement('label');
  applyStyles(curatedLabel, styles.label);
  curatedLabel.append('Curated dataset');
  const curatedSelect = document.createElement('select');
  curatedSelect.setAttribute('aria-label', 'Curated dataset');
  applyStyles(curatedSelect, styles.control);
  const currentOption = document.createElement('option');
  currentOption.textContent = selectedLabel || 'Select a dataset';
  curatedSelect.appendChild(currentOption);
  for (const example of curatedExamples) {
    const option = document.createElement('option');
    option.value = example.id;
    option.textContent = `${example.label}${example.mobileSafe ? ' · mobile' : ''}`;
    curatedSelect.appendChild(option);
  }
  curatedSelect.addEventListener('change', () => {
    const curatedExample = curatedExamples.find(example => example.id === curatedSelect.value);
    if (curatedExample) {
      const source = toSource(curatedExample);
      updateShareableSourceState(source);
      onSourceChange(source);
    }
  });
  curatedLabel.appendChild(curatedSelect);
  contentElement.appendChild(curatedLabel);

  const urlLabel = document.createElement('label');
  applyStyles(urlLabel, styles.label);
  urlLabel.append('URL');
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.value = selectedUrl || '';
  urlInput.placeholder = 'https://…';
  urlInput.setAttribute('aria-label', 'URL');
  applyStyles(urlInput, styles.control);
  urlInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && urlInput.value.trim()) {
      const url = urlInput.value.trim();
      const source = {value: url, label: getFileName(url), format: inferFormat(url)};
      updateShareableSourceState(source);
      onSourceChange(source);
    }
  });
  urlLabel.appendChild(urlInput);
  contentElement.appendChild(urlLabel);

  const dropZone = document.createElement('label');
  applyStyles(dropZone, styles.dropZone);
  dropZone.append('Drop a file here or choose one');
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.setAttribute('aria-label', 'Choose a file');
  applyStyles(fileInput, styles.fileInput);
  fileInput.addEventListener('change', () => handleFile(fileInput.files?.[0]));
  dropZone.appendChild(fileInput);
  dropZone.addEventListener('dragover', event => event.preventDefault());
  dropZone.addEventListener('drop', event => {
    event.preventDefault();
    handleFile(event.dataTransfer?.files[0]);
  });
  contentElement.appendChild(dropZone);

  const hint = document.createElement('small');
  hint.textContent = 'Format: URL extension is used when available; the renderer may apply a format override.';
  applyStyles(hint, styles.hint);
  contentElement.appendChild(hint);
}

function applyStyles(element: HTMLElement, style: Record<string, string>): void {
  Object.assign(element.style, style);
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
  if (pathname.endsWith('.gpkg')) return 'GeoPackage';
  if (pathname.endsWith('.fgb')) return 'FlatGeobuf';
  if (pathname.endsWith('.shp')) return 'Shapefile';
  if (pathname.endsWith('.kml')) return 'KML';
  if (pathname.endsWith('.gpx')) return 'GPX';
  if (pathname.endsWith('.tcx')) return 'TCX';
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

const styles: Record<string, Record<string, string>> = {
  label: {display: 'grid', gap: '3px', fontSize: '11px'},
  control: {boxSizing: 'border-box', width: '100%', minHeight: '30px', padding: '4px 6px', border: '1px solid rgba(148, 163, 184, 0.55)', borderRadius: '6px', font: 'inherit'},
  dropZone: {display: 'grid', gap: '4px', placeItems: 'center', padding: '8px', border: '1px dashed rgba(59, 130, 246, 0.65)', borderRadius: '6px', background: 'rgba(239, 246, 255, 0.7)', textAlign: 'center', fontSize: '11px'},
  fileInput: {maxWidth: '100%', fontSize: '11px'},
  hint: {color: '#64748b', lineHeight: 1.4}
};
