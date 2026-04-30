import React, {type ReactNode, useEffect, useMemo, useRef, useState} from 'react';
import {load} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';
import {LASLoader} from '@loaders.gl/las';
import {OBJLoader} from '@loaders.gl/obj';
import {PCDLoader} from '@loaders.gl/pcd';
import {PLYLoader} from '@loaders.gl/ply';
import type {Mesh, MeshArrowTable} from '@loaders.gl/schema';
import {convertTableToMesh} from '@loaders.gl/schema-utils';
import styled from 'styled-components';
import {EXAMPLES, type Example} from 'examples/website/pointcloud/examples';
import {
  ExampleUrlInputCard,
  type UrlOption
} from 'examples/website/shared/url-input-card';

const POINT_CLOUD_LOADERS = [DracoLoader, LASLoader, PLYLoader, PCDLoader, OBJLoader] as const;
const PREVIEW_ROW_LIMIT = 100;
const PREVIEW_COLUMN_LIMIT = 9;
const SOURCE_BYTE_LIMIT = 2048;
const SOURCE_TEXT_LIMIT = 48000;
const DEFAULT_SOURCE_BYTES_PER_ROW = 8;
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

type BinaryBytesProps = {
  /** Number of source bytes rendered in each row. */
  $bytesPerRow: number;
};

const PreviewLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: stretch;
  margin-top: 1rem;

  @media (max-width: 1200px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const PreviewPane = styled.section`
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const PaneCard = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0.9rem;
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  background: rgba(247, 250, 252, 0.92);
`;

const PaneHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 0.75rem;
`;

const PaneLabel = styled.div`
  margin: 0;
  color: var(--ifm-color-gray-700);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const PaneMeta = styled.div`
  margin: 0;
  color: var(--ifm-color-gray-700);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: right;
`;

const SourceShell = styled.div`
  width: 100%;
  height: 24rem;
  overflow: auto;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
`;

const TableShell = styled.div`
  position: relative;
  width: 100%;
  height: 24rem;
  overflow: auto;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
`;

const CanvasShell = styled.div`
  width: 100%;
  height: 24rem;
  overflow: hidden;
  border-radius: 8px;
  background: #eef2f7;
`;

const BinaryViewport = styled.div`
  min-height: 100%;
  padding: 1rem 1.05rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--ifm-color-gray-900);
  font-family: var(--ifm-font-family-monospace);
  font-size: 0.8rem;
  line-height: 1.5;
`;

const BinaryHeader = styled.div`
  display: grid;
  grid-template-columns: 4.5rem max-content max-content;
  gap: 1.1rem;
  margin-bottom: 0.6rem;
  color: var(--ifm-color-gray-700);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const BinaryRow = styled.div`
  display: grid;
  grid-template-columns: 4.5rem max-content max-content;
  gap: 1.1rem;
  align-items: start;
  margin-bottom: 0.35rem;
`;

const BinaryOffset = styled.div`
  color: var(--ifm-color-gray-700);
  font-weight: 700;
`;

const BinaryBytes = styled.div<BinaryBytesProps>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$bytesPerRow}, minmax(0, max-content));
  gap: 0.45rem;
`;

const BinaryByte = styled.div`
  width: 1.85rem;
  text-align: center;
`;

const BinaryAscii = styled.div`
  white-space: pre;
`;

const TextViewport = styled.pre`
  min-height: 100%;
  margin: 0;
  padding: 1rem 1.05rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--ifm-color-gray-900);
  font-family: var(--ifm-font-family-monospace);
  font-size: 0.8rem;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const BinaryOverflow = styled.div`
  margin-top: 0.9rem;
  color: var(--ifm-color-gray-700);
  font-weight: 600;
`;

const PreviewTable = styled.table`
  width: max-content;
  min-width: 100%;
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.85rem;
  color: var(--ifm-color-gray-900);
  background: rgba(255, 255, 255, 0.96);
`;

const PreviewTableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 6;
`;

const HeaderCell = styled.th`
  position: sticky;
  top: 0;
  z-index: 3;
  width: 1%;
  min-width: 7rem;
  max-width: 28rem;
  padding: 0.7rem 0.95rem;
  text-align: left;
  white-space: nowrap;
  background: var(--ifm-color-gray-200);
  background-clip: padding-box;
  border-bottom: 1px solid rgba(43, 56, 72, 0.12);
  box-shadow: 0 1px 0 rgba(43, 56, 72, 0.12);
  color: var(--ifm-color-gray-900);
  font-size: 0.83rem;
  font-weight: 700;
`;

const RowIndexHeaderCell = styled(HeaderCell)`
  left: 0;
  z-index: 5;
  width: 3.25rem;
  min-width: 3.25rem;
  max-width: 3.25rem;
  text-align: right;
  box-shadow:
    1px 0 0 rgba(43, 56, 72, 0.12),
    0 1px 0 rgba(43, 56, 72, 0.12);
`;

const BodyCell = styled.td`
  width: 1%;
  min-width: 7rem;
  max-width: 28rem;
  padding: 0.68rem 0.95rem;
  white-space: nowrap;
  border-bottom: 1px solid rgba(43, 56, 72, 0.08);
  color: var(--ifm-color-gray-800);
`;

const RowIndexCell = styled(BodyCell)`
  position: sticky;
  left: 0;
  z-index: 2;
  width: 3.25rem;
  min-width: 3.25rem;
  max-width: 3.25rem;
  background: rgba(255, 255, 255, 0.96);
  background-clip: padding-box;
  box-shadow: 1px 0 0 rgba(43, 56, 72, 0.08);
  color: var(--ifm-color-gray-700);
  font-weight: 700;
  text-align: right;
`;

const StatusContainer = styled.div`
  display: flex;
  min-height: 6rem;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: var(--ifm-color-emphasis-700);
`;

const GlobalPreviewStyle = styled.div`
  html[data-theme='dark'] & ${PaneCard} {
    border-color: rgba(158, 174, 192, 0.26);
    background: rgba(29, 38, 49, 0.94);
  }

  html[data-theme='dark'] & ${BinaryViewport},
  html[data-theme='dark'] & ${TextViewport},
  html[data-theme='dark'] & ${PreviewTable} {
    background: rgba(36, 46, 58, 0.92);
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${BinaryHeader},
  html[data-theme='dark'] & ${BinaryOffset},
  html[data-theme='dark'] & ${BinaryAscii},
  html[data-theme='dark'] & ${BinaryOverflow},
  html[data-theme='dark'] & ${PaneMeta} {
    color: rgba(203, 213, 225, 0.9);
  }

  html[data-theme='dark'] & ${HeaderCell} {
    background: rgba(72, 86, 104, 0.72);
    border-bottom-color: rgba(225, 232, 240, 0.14);
    color: rgba(255, 255, 255, 0.92);
  }

  html[data-theme='dark'] & ${BodyCell},
  html[data-theme='dark'] & ${RowIndexCell} {
    border-bottom-color: rgba(225, 232, 240, 0.12);
    color: rgba(241, 245, 249, 0.9);
  }

  html[data-theme='dark'] & ${RowIndexCell} {
    background: rgba(36, 46, 58, 0.92);
  }
`;

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

    loadPointcloudPreview();

    return () => {
      isCancelled = true;
    };
  }, [exampleEntry, format]);

  return (
    <GlobalPreviewStyle>
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
      {state.status === 'loading' && <StatusContainer>Loading point cloud data...</StatusContainer>}
      {state.status === 'error' && <StatusContainer>{state.errorMessage}</StatusContainer>}
      {state.status === 'loaded' && (
        <PreviewLayout data-loader-live-pointcloud-data-preview>
          <PreviewPane>
            <PaneCard>
              <PaneHeader>
                <PaneLabel>{state.sourceText ? 'Source text' : 'Source bytes'}</PaneLabel>
                <PaneMeta>{formatByteCount(state.arrayBuffer.byteLength)}</PaneMeta>
              </PaneHeader>
              <SourceShell>
                {state.sourceText ? (
                  <SourceTextPreview sourceText={state.sourceText} />
                ) : (
                  <SourceBytesPreview arrayBuffer={state.arrayBuffer} />
                )}
              </SourceShell>
            </PaneCard>
          </PreviewPane>
          <PreviewPane>
            <PaneCard>
              <PaneHeader>
                <PaneLabel>Arrow table</PaneLabel>
                <PaneMeta>{formatRowCount(getPointCount((state.mesh as any).attributes || {}))}</PaneMeta>
              </PaneHeader>
              <TableShell>
                <PointcloudTable mesh={state.mesh} />
              </TableShell>
            </PaneCard>
          </PreviewPane>
          {children && (
            <PreviewPane>
              <PaneCard>
                <PaneHeader>
                  <PaneLabel>Deck canvas</PaneLabel>
                  <PaneMeta>&nbsp;</PaneMeta>
                </PaneHeader>
                <CanvasShell>{children}</CanvasShell>
              </PaneCard>
            </PreviewPane>
          )}
        </PreviewLayout>
      )}
    </GlobalPreviewStyle>
  );
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
    <BinaryViewport ref={sourceElementRef}>
      {formatBinaryPreview(arrayBuffer, bytesPerRow)}
    </BinaryViewport>
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
    <TextViewport>
      {previewText}
      {truncated ? `\n\n... ${formatByteCount(sourceText.length - SOURCE_TEXT_LIMIT)} more text` : ''}
    </TextViewport>
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
    return <StatusContainer>No point attributes</StatusContainer>;
  }

  return (
    <PreviewTable>
      <PreviewTableHead>
        <tr>
          <RowIndexHeaderCell>#</RowIndexHeaderCell>
          {columns.map((column) => (
            <HeaderCell key={column.name}>{column.name}</HeaderCell>
          ))}
        </tr>
      </PreviewTableHead>
      <tbody>
        {Array.from({length: rowCount}, (_, rowIndex) => (
          <tr key={rowIndex}>
            <RowIndexCell>{rowIndex}</RowIndexCell>
            {columns.map((column) => (
              <BodyCell key={column.name}>
                {formatAttributeValue(attributes, column.attributeName, rowIndex)}
              </BodyCell>
            ))}
          </tr>
        ))}
      </tbody>
    </PreviewTable>
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
      ply: {shape: 'arrow-table'}
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
        ply: {shape: 'arrow-table'}
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
      <BinaryRow key={offset}>
        <BinaryOffset>{offset.toString(16).padStart(6, '0')}</BinaryOffset>
        <BinaryBytes $bytesPerRow={bytesPerRow}>
          {rowBytes.map((byte, index) => (
            <BinaryByte key={index}>{byte.toString(16).padStart(2, '0')}</BinaryByte>
          ))}
        </BinaryBytes>
        <BinaryAscii>{formatAsciiPreview(rowBytes)}</BinaryAscii>
      </BinaryRow>
    );
  }

  return (
    <>
      <BinaryHeader>
        <span>Offset</span>
        <span>Bytes</span>
        <span>ASCII</span>
      </BinaryHeader>
      {rows}
      {bytes.length > previewLength && (
        <BinaryOverflow>{formatByteCount(bytes.length - previewLength)} more bytes</BinaryOverflow>
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
