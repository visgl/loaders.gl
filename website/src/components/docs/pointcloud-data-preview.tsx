import React, {type ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {load} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {OBJLoader} from '@loaders.gl/obj';
import {PCDLoader} from '@loaders.gl/pcd';
import {PLYLoader} from '@loaders.gl/ply';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import {EXAMPLES, type Example} from 'examples/website/pointcloud/examples';
import {
  ExampleUrlInputCard,
  type UrlOption
} from 'examples/website/shared/url-input-card';

import styles from './pointcloud-data-preview.module.css';

const POINT_CLOUD_LOADERS = [DracoLoader, LASLoader, PLYLoader, PCDLoader, OBJLoader] as const;
const PREVIEW_ROW_LIMIT = 100;
const PREVIEW_COLUMN_LIMIT = 9;
const SOURCE_BYTE_LIMIT = 2048;
const SOURCE_TEXT_LIMIT = 48000;
const DEFAULT_SOURCE_BYTES_PER_ROW = 8;
const PREVIEW_LOAD_DELAY_MS = 250;
type SelectedPointcloudExample = {
  /** Example category label. */
  categoryName: string;
  /** Example display name. */
  exampleName: string;
  /** Example source definition. */
  example: Example;
};

type PointcloudDataPreviewState =
  | {status: 'loading'}
  | {
      /** Current preview state. */
      status: 'loaded';
      /** Loaded source bytes. */
      arrayBuffer: ArrayBuffer;
      /** Source text when the point cloud source is a text format. */
      sourceText: string | null;
      /** Parsed point cloud mesh. */
      mesh: Mesh;
      /** Example selected for the preview. */
      exampleName: string;
    }
  | {
      /** Current preview state. */
      status: 'error';
      /** Error message from loading or parsing the point cloud. */
      errorMessage: string;
    };

type PreviewColumn = {
  /** Column label. */
  name: string;
  /** Attribute name on the parsed mesh. */
  attributeName: string;
};

/**
 * Renders source bytes and parsed attribute rows for the first point cloud example in a format.
 */
export default function PointcloudDataPreview({
  children,
  format,
  selectedExample,
  onExampleChange
}: {
  /** Optional deck.gl point cloud rendering to show beside the data previews. */
  children?: ReactNode;
  /** Example app format filter to select a specific point cloud loader format. */
  format: string;
  /** Selected point cloud example shared with the deck canvas. */
  selectedExample?: SelectedPointcloudExample | null;
  /** Callback when the preview selects a new example URL. */
  onExampleChange?: (example: SelectedPointcloudExample) => void;
}): ReactNode {
  const defaultExampleEntry = useMemo(() => getFirstExample(format), [format]);
  const exampleEntry = selectedExample || defaultExampleEntry;
  const urlOptions = useMemo(() => getUrlOptions(format), [format]);
  const [state, setState] = useState<PointcloudDataPreviewState>({status: 'loading'});

  useEffect(() => {
    let isCancelled = false;
    const cancelPreviewLoad = schedulePreviewLoad(loadPointcloudPreview);

    async function loadPointcloudPreview(): Promise<void> {
      if (!exampleEntry) {
        setState({status: 'error', errorMessage: `No point cloud example found for ${format}.`});
        return;
      }

      setState({status: 'loading'});

      try {
        const response = await fetch(exampleEntry.example.url);
        const arrayBuffer = await response.arrayBuffer();
        const sourceText = getSourceText(arrayBuffer);
        const mesh = await loadPreviewPointCloud(exampleEntry.example, format, arrayBuffer);

        if (!isCancelled) {
          setState({
            status: 'loaded',
            arrayBuffer,
            sourceText,
            mesh,
            exampleName: exampleEntry.exampleName
          });
        }
      } catch (error) {
        if (!isCancelled) {
          setState({
            status: 'error',
            errorMessage: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }

    return () => {
      isCancelled = true;
      cancelPreviewLoad();
    };
  }, [exampleEntry, format]);

  return (
    <div className={styles.globalPreviewStyle}>
      {exampleEntry && (
        <ExampleUrlInputCard<Example>
          format={format}
          selectedUrl={exampleEntry.example.url}
          urlOptions={urlOptions}
          onExampleSelect={(urlOption) => {
            const example = urlOption.example || {type: getExampleType(format), url: urlOption.url};
            onExampleChange?.({
              categoryName: format,
              exampleName: urlOption.label,
              example
            });
          }}
          onUrlChange={(url) =>
            onExampleChange?.({
              categoryName: 'URL',
              exampleName: getFileNameFromUrl(url),
              example: {type: getExampleType(format), url}
            })
          }
        />
      )}
      <div className={styles.previewLayout} data-loader-live-pointcloud-data-preview>
        <section className={styles.previewPane}>
          <div className={styles.paneCard}>
            <div className={styles.paneHeader}>
              <div className={styles.paneLabel}>
                {state.status === 'loaded' && state.sourceText ? 'Source text' : 'Source bytes'}
              </div>
              <div className={styles.paneMeta}>
                {state.status === 'loaded' ? formatByteCount(state.arrayBuffer.byteLength) : '\u00a0'}
              </div>
            </div>
            <div className={styles.sourceShell}>
              {state.status === 'loading' && <div className={styles.statusContainer}>Loading point cloud data...</div>}
              {state.status === 'error' && <div className={styles.statusContainer}>{state.errorMessage}</div>}
              {state.status === 'loaded' && state.sourceText && (
                <SourceTextPreview sourceText={state.sourceText} />
              )}
              {state.status === 'loaded' && !state.sourceText && (
                <SourceBytesPreview arrayBuffer={state.arrayBuffer} />
              )}
            </div>
          </div>
        </section>
        <section className={styles.previewPane}>
          <div className={styles.paneCard}>
            <div className={styles.paneHeader}>
              <div className={styles.paneLabel}>Arrow table</div>
              <div className={styles.paneMeta}>
                {state.status === 'loaded'
                  ? formatRowCount(getPointCount((state.mesh as any).attributes || {}))
                  : '\u00a0'}
              </div>
            </div>
            <div className={styles.tableShell}>
              {state.status === 'loading' && <div className={styles.statusContainer}>Loading point cloud data...</div>}
              {state.status === 'error' && <div className={styles.statusContainer}>{state.errorMessage}</div>}
              {state.status === 'loaded' && <PointcloudTable mesh={state.mesh} />}
            </div>
          </div>
        </section>
        {children && (
          <section className={styles.previewPane}>
            <div className={styles.paneCard}>
              <div className={styles.paneHeader}>
                <div className={styles.paneLabel}>Deck canvas</div>
                <div className={styles.paneMeta}>&nbsp;</div>
              </div>
              <div className={styles.canvasShell}>{children}</div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Schedules the full preview load after the initial canvas render has a chance to paint.
 */
function schedulePreviewLoad(callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let timeoutId: number | null = null;
  let idleCallbackId: number | null = null;

  const animationFrameId = window.requestAnimationFrame(() => {
    const requestIdleCallback = window.requestIdleCallback;
    if (requestIdleCallback) {
      idleCallbackId = requestIdleCallback(callback, {timeout: PREVIEW_LOAD_DELAY_MS});
    } else {
      timeoutId = window.setTimeout(callback, PREVIEW_LOAD_DELAY_MS);
    }
  });

  return () => {
    window.cancelAnimationFrame(animationFrameId);
    if (idleCallbackId !== null) {
      window.cancelIdleCallback?.(idleCallbackId);
    }
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  };
}

/**
 * Renders a responsive hex and ASCII preview for source bytes.
 */
function SourceBytesPreview({
  arrayBuffer
}: {
  /** Source data bytes to preview. */
  arrayBuffer: ArrayBuffer;
}): ReactNode {
  const sourceElementRef = useRef<HTMLDivElement | null>(null);
  const [bytesPerRow, setBytesPerRow] = useState(DEFAULT_SOURCE_BYTES_PER_ROW);

  useEffect(() => {
    const element = sourceElementRef.current;
    if (!element) {
      return undefined;
    }

    const updateBytesPerRow = () => {
      setBytesPerRow(getSourceBytesPerRow(element.clientWidth));
    };
    updateBytesPerRow();

    const resizeObserver = new ResizeObserver(updateBytesPerRow);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={styles.binaryViewport} ref={sourceElementRef}>
      {formatBinaryPreview(arrayBuffer, bytesPerRow)}
    </div>
  );
}

function getSourceBytesPerRow(width: number): number {
  if (width < 390) {
    return 4;
  }
  if (width < 470) {
    return 6;
  }
  return 8;
}

/**
 * Renders text point cloud source content.
 */
function SourceTextPreview({
  sourceText
}: {
  /** Source text to preview. */
  sourceText: string;
}): ReactNode {
  const truncated = sourceText.length > SOURCE_TEXT_LIMIT;
  const previewText = truncated ? sourceText.slice(0, SOURCE_TEXT_LIMIT) : sourceText;

  return (
    <pre className={styles.textViewport}>
      {previewText}
      {truncated ? `\n\n... ${formatByteCount(sourceText.length - SOURCE_TEXT_LIMIT)} more text` : ''}
    </pre>
  );
}

/**
 * Renders parsed point cloud attributes as a compact row preview.
 */
function PointcloudTable({
  mesh
}: {
  /** Parsed point cloud mesh. */
  mesh: Mesh;
}): ReactNode {
  const attributes = (mesh as any).attributes || {};
  const columns = getPreviewColumns(attributes).slice(0, PREVIEW_COLUMN_LIMIT);
  const rowCount = Math.min(getPointCount(attributes), PREVIEW_ROW_LIMIT);

  if (!columns.length || !rowCount) {
    return <div className={styles.statusContainer}>No point attributes</div>;
  }

  return (
    <table className={styles.previewTable}>
      <thead className={styles.previewTableHead}>
        <tr>
          <th className={styles.rowIndexHeaderCell}>#</th>
          {columns.map((column) => (
            <th className={styles.headerCell} key={column.name}>{column.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({length: rowCount}, (_, rowIndex) => (
          <tr key={rowIndex}>
            <td className={styles.rowIndexCell}>{rowIndex}</td>
            {columns.map((column) => (
              <td className={styles.bodyCell} key={column.name}>
                {formatAttributeValue(attributes, column.attributeName, rowIndex)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function getFirstExample(format: string): {exampleName: string; example: Example} | null {
  const examplesForFormat = EXAMPLES[format];
  const exampleName = examplesForFormat && Object.keys(examplesForFormat)[0];
  const example = exampleName ? examplesForFormat[exampleName] : null;
  return exampleName && example ? {categoryName: format, exampleName, example} : null;
}

async function loadPreviewPointCloud(
  example: Example,
  format: string,
  firstArrayBuffer: ArrayBuffer
): Promise<Mesh> {
  const urls = getExampleUrls(example);
  const loader = getPointCloudLoader(example, format);

  if (urls.length === 1) {
    const pointCloud = await load(firstArrayBuffer, loader as any, {
      worker: false,
      las: {shape: 'arrow-table'},
      obj: {shape: 'arrow-table'},
      pcd: {shape: 'arrow-table'},
      ply: {shape: 'arrow-table', pointCloud: true}
    });
    return isMeshArrowTable(pointCloud) ? ((convertTableToMesh(pointCloud) as unknown) as Mesh) : (pointCloud as Mesh);
  }

  const pointClouds = await Promise.all(
    urls.map(async (url, index) => {
      const arrayBuffer =
        index === 0 ? firstArrayBuffer : await (await fetch(url)).arrayBuffer();
      return load(arrayBuffer, loader as any, {
        worker: false,
        las: {shape: 'arrow-table'},
        obj: {shape: 'arrow-table'},
        pcd: {shape: 'arrow-table'},
        ply: {shape: 'arrow-table', pointCloud: true}
      });
    })
  );
  const combinedPointCloud = combineMeshArrowTables(pointClouds as MeshArrowTable[]);
  return (convertTableToMesh(combinedPointCloud) as unknown) as Mesh;
}

function combineMeshArrowTables(pointClouds: MeshArrowTable[]): MeshArrowTable {
  const firstPointCloud = pointClouds[0];
  if (!firstPointCloud || pointClouds.some((pointCloud) => !isMeshArrowTable(pointCloud))) {
    throw new Error('Multi-file point cloud examples require Arrow table loader output.');
  }

  return {
    ...firstPointCloud,
    data: firstPointCloud.data.concat(...pointClouds.slice(1).map((pointCloud) => pointCloud.data))
  };
}

function getExampleUrls(example: Example): string[] {
  return example.urls?.length ? example.urls : [example.url];
}

function getUrlOptions(format: string): UrlOption<Example>[] {
  const examplesForFormat = EXAMPLES[format] || {};
  return Object.entries(examplesForFormat).map(([exampleName, example]) => ({
    format,
    example,
    group: 'Examples',
    label: exampleName,
    pointCount: example.pointCount,
    url: example.url
  }));
}

function getExampleType(format: string): Example['type'] {
  return format.toLowerCase() === 'laz' ? 'las' : (format.toLowerCase() as Example['type']);
}

function isMeshArrowTable(data: unknown): data is MeshArrowTable {
  return Boolean(data && typeof data === 'object' && 'shape' in data && data.shape === 'arrow-table');
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.slice(pathname.lastIndexOf('/') + 1) || 'Custom PLY';
  } catch {
    return 'Custom PLY';
  }
}

function getPointCloudLoader(example: Example, format: string) {
  switch (example.type || format.toLowerCase()) {
    case 'draco':
      return DracoLoader;
    case 'las':
    case 'laz':
      return LASLoader;
    case 'obj':
      return OBJLoader;
    case 'pcd':
      return PCDLoader;
    case 'ply':
      return PLYLoader;
    default:
      return POINT_CLOUD_LOADERS as any;
  }
}

function getPointCount(attributes: Record<string, any>): number {
  const positions = attributes.POSITION;
  const size = getAttributeSize(positions);
  return positions?.value?.length && size ? Math.floor(positions.value.length / size) : 0;
}

function formatRowCount(rowCount: number): string {
  return `${rowCount.toLocaleString()} rows`;
}

function getPreviewColumns(attributes: Record<string, any>): PreviewColumn[] {
  const columns: PreviewColumn[] = [];

  for (const attributeName of Object.keys(attributes)) {
    columns.push({
      name: attributeName,
      attributeName
    });
  }

  return columns;
}

function getAttributeSize(attribute: any): number {
  return attribute?.size || attribute?.components || attribute?.value?.size || 1;
}

function formatAttributeValue(
  attributes: Record<string, any>,
  attributeName: string,
  rowIndex: number
): string {
  const attribute = attributes[attributeName];
  const size = getAttributeSize(attribute);
  const values = attribute?.value;

  if (!values) {
    return '';
  }

  if (size <= 1) {
    return formatScalarValue(values[rowIndex]);
  }

  const tuple = Array.from({length: size}, (_, componentIndex) =>
    formatScalarValue(values[rowIndex * size + componentIndex])
  );
  return `[${tuple.join(', ')}]`;
}

function formatScalarValue(value: unknown): string {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toPrecision(6);
  }
  return value === undefined || value === null ? '' : String(value);
}

function formatBinaryPreview(arrayBuffer: ArrayBuffer, bytesPerRow: number): ReactNode {
  const bytes = new Uint8Array(arrayBuffer);
  const previewLength = Math.min(bytes.length, SOURCE_BYTE_LIMIT);
  const rows: ReactNode[] = [];

  for (let offset = 0; offset < previewLength; offset += bytesPerRow) {
    const rowBytes = Array.from(bytes.slice(offset, Math.min(offset + bytesPerRow, previewLength)));
    rows.push(
      <div className={styles.binaryRow} key={offset}>
        <div className={styles.binaryOffset}>{offset.toString(16).padStart(6, '0')}</div>
        <div
          className={styles.binaryBytes}
          style={{gridTemplateColumns: `repeat(${bytesPerRow}, minmax(0, max-content))`}}
        >
          {rowBytes.map((byte, index) => (
            <div className={styles.binaryByte} key={index}>{byte.toString(16).padStart(2, '0')}</div>
          ))}
        </div>
        <div className={styles.binaryAscii}>{formatAsciiPreview(rowBytes)}</div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.binaryHeader}>
        <span>Offset</span>
        <span>Bytes</span>
        <span>ASCII</span>
      </div>
      {rows}
      {bytes.length > previewLength && (
        <div className={styles.binaryOverflow}>{formatByteCount(bytes.length - previewLength)} more bytes</div>
      )}
    </>
  );
}

function formatAsciiPreview(bytes: number[]): string {
  return bytes
    .map((byte) => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.'))
    .join('');
}

function getSourceText(arrayBuffer: ArrayBuffer): string | null {
  const sourcePreviewText = new TextDecoder('utf-8', {fatal: false}).decode(
    arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, SOURCE_TEXT_LIMIT))
  );

  if (isTextPointCloudSource(sourcePreviewText)) {
    return sourcePreviewText;
  }

  return null;
}

function isTextPointCloudSource(sourcePreviewText: string): boolean {
  const sourceStart = sourcePreviewText.trimStart();
  const plyHeader = sourceStart.match(/^ply\r?\n([\s\S]*?)end_header\r?\n/);

  if (plyHeader) {
    const formatLine = plyHeader[1]
      .split(/\r?\n/)
      .find((line) => line.trimStart().startsWith('format '));
    return formatLine ? /^format\s+ascii\s+/.test(formatLine.trim()) : false;
  }

  return (
    sourceStart.startsWith('# .PCD') ||
    sourceStart.startsWith('VERSION') ||
    sourceStart.startsWith('v ') ||
    sourceStart.startsWith('#')
  );
}

function formatByteCount(byteLength: number): string {
  if (byteLength < 1024) {
    return `${byteLength} B`;
  }
  if (byteLength < 1024 * 1024) {
    return `${(byteLength / 1024).toFixed(1)} KB`;
  }
  return `${(byteLength / (1024 * 1024)).toFixed(1)} MB`;
}
