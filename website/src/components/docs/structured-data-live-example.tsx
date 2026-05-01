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
import styled from 'styled-components';

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

const PreviewLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const SourceSummaryCard = styled.form<{$hasSamples?: boolean; $isDragActive?: boolean}>`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: ${(props) =>
    props.$hasSamples
      ? 'max-content minmax(10rem, max-content) minmax(0, 1fr) max-content'
      : 'max-content minmax(0, 1fr) max-content'};
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.7rem 0.9rem;
  border: 1px dashed
    ${(props) => (props.$isDragActive ? 'var(--ifm-color-primary)' : 'var(--ifm-color-gray-300)')};
  border-radius: 8px;
  background: ${(props) =>
    props.$isDragActive ? 'rgba(225, 245, 255, 0.96)' : 'rgba(255, 255, 255, 0.96)'};
  color: var(--ifm-color-gray-900);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.35rem;
  }
`;

const SourceSummaryLabel = styled.div`
  color: var(--ifm-color-gray-700);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const SourceSampleSelect = styled.select`
  min-width: 0;
  max-width: 16rem;
  border: 1px solid rgba(43, 56, 72, 0.18);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ifm-color-gray-800);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0.38rem 0.5rem;
`;

const SourceInput = styled.input`
  min-width: 0;
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--ifm-color-gray-900);
  font-family: var(--ifm-font-family-monospace);
  font-size: 0.78rem;
  outline: none;
  white-space: nowrap;
`;

const SourceAction = styled.button`
  border: 1px solid rgba(43, 56, 72, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ifm-color-gray-800);
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.42rem 0.58rem;

  &:hover {
    background: var(--ifm-color-gray-100);
  }
`;

const SourceErrorMessage = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  padding: 0.7rem 0.8rem;
  border: 1px solid rgba(185, 28, 28, 0.24);
  border-radius: 8px;
  background: rgba(254, 242, 242, 0.96);
  color: rgb(127, 29, 29);
`;

const SourceErrorLabel = styled.div`
  margin-bottom: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const SourceErrorText = styled.pre`
  margin: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  font-family: var(--ifm-font-family-monospace);
  font-size: 0.78rem;
  line-height: 1.45;
`;

const PreviewPane = styled.section`
  min-width: 0;
`;

const PaneCard = styled.div`
  min-height: 24rem;
  padding: 0.9rem;
  border: 1px solid var(--ifm-color-gray-400);
  border-radius: 8px;
  background: rgba(247, 250, 252, 0.92);
`;

const PaneLabel = styled.div`
  margin: 0 0 0.75rem;
  color: var(--ifm-color-gray-700);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const PaneHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 0.75rem;
`;

const HeaderLabel = styled(PaneLabel)`
  margin: 0;
`;

const ToggleButton = styled.button`
  border: 1px solid rgba(43, 56, 72, 0.2);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ifm-color-gray-800);
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.42rem 0.58rem;

  &:hover {
    background: var(--ifm-color-gray-100);
  }
`;

const PreviewText = styled.pre<{$wrap?: boolean}>`
  height: 22rem;
  margin: 0;
  padding: 1rem;
  overflow: auto;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: var(--ifm-color-gray-900);
  font-family: var(--ifm-font-family-monospace);
  font-size: 0.8rem;
  line-height: 1.5;
  overflow-wrap: ${(props) => (props.$wrap ? 'anywhere' : 'normal')};
  white-space: ${(props) => (props.$wrap ? 'pre-wrap' : 'pre')};
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
  html[data-theme='dark'] & ${SourceSummaryCard} {
    border-color: rgba(158, 174, 192, 0.22);
    background: rgba(30, 41, 59, 0.96);
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${SourceSummaryLabel} {
    color: rgba(203, 213, 225, 0.9);
  }

  html[data-theme='dark'] & ${SourceInput} {
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${SourceSampleSelect},
  html[data-theme='dark'] & ${SourceAction} {
    border-color: rgba(158, 174, 192, 0.28);
    background: rgba(51, 65, 85, 0.92);
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${SourceErrorMessage} {
    border-color: rgba(248, 113, 113, 0.32);
    background: rgba(69, 10, 10, 0.56);
    color: rgba(254, 226, 226, 0.96);
  }

  html[data-theme='dark'] & ${PaneCard} {
    border-color: rgba(158, 174, 192, 0.26);
    background: rgba(29, 38, 49, 0.94);
  }

  html[data-theme='dark'] & ${PreviewText} {
    background: rgba(36, 46, 58, 0.92);
    color: rgba(241, 245, 249, 0.92);
  }

  html[data-theme='dark'] & ${ToggleButton} {
    border-color: rgba(158, 174, 192, 0.28);
    background: rgba(51, 65, 85, 0.92);
    color: rgba(241, 245, 249, 0.92);
  }
`;

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
    <GlobalPreviewStyle>
      <PreviewLayout>
        <SourceSummaryCard
          $hasSamples={Boolean(config.sampleFiles?.length)}
          $isDragActive={isDragActive}
          onSubmit={(event) => {
            event.preventDefault();
            updateSourceUrl();
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <SourceSummaryLabel>{source.label}</SourceSummaryLabel>
          {config.sampleFiles?.length ? (
            <SourceSampleSelect
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
            </SourceSampleSelect>
          ) : null}
          <SourceInput
            aria-label="Source URL or dropped file"
            value={sourceInputValue}
            placeholder="Enter a source URL or drop a file"
            onChange={handleSourceInputChange}
            onBlur={updateSourceUrl}
            onKeyDown={handleSourceInputKeyDown}
            readOnly={source.type === 'file'}
            title={source.value}
          />
          <SourceAction type="submit">Load</SourceAction>
          {state.status === 'error' && (
            <SourceErrorMessage role="alert">
              <SourceErrorLabel>Loader error</SourceErrorLabel>
              <SourceErrorText>{state.errorMessage}</SourceErrorText>
            </SourceErrorMessage>
          )}
        </SourceSummaryCard>
        {state.status === 'loading' && (
          <StatusContainer>Loading structured data...</StatusContainer>
        )}
        {state.status === 'error' && state.sourceText && state.sourceLabel && (
          <>
            <StructuredSourcePane
              sourceLabel={state.sourceLabel}
              sourceText={state.sourceText}
              wrapSourceText={wrapSourceText}
              onToggleWrapSourceText={() => setWrapSourceText(value => !value)}
            />
            <PreviewPane>
              <PaneCard>
                <PaneLabel>{config.loaderName}</PaneLabel>
                <StatusContainer>No parsed output</StatusContainer>
              </PaneCard>
            </PreviewPane>
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
            <PreviewPane>
              <PaneCard>
                <PaneLabel>{config.loaderName}</PaneLabel>
                <PreviewText>{JSON.stringify(state.parsedData, null, 2)}</PreviewText>
              </PaneCard>
            </PreviewPane>
          </>
        )}
      </PreviewLayout>
    </GlobalPreviewStyle>
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
    <PreviewPane>
      <PaneCard>
        <PaneHeader>
          <HeaderLabel>{sourceLabel}</HeaderLabel>
          <ToggleButton type="button" onClick={onToggleWrapSourceText}>
            {wrapSourceText ? 'No Wrap' : 'Wrap'}
          </ToggleButton>
        </PaneHeader>
        <PreviewText $wrap={wrapSourceText}>{sourceText}</PreviewText>
      </PaneCard>
    </PreviewPane>
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
