import React, {useState} from 'react';
import type {ChangeEvent, FormEvent} from 'react';
import styled from 'styled-components';
import type {ArchiveFormat} from '../archive-source';

const Panel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  width: min(340px, calc(100% - 52px));
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  margin: 10px;
  border-radius: 8px;
  background: #0e111a;
  color: white;
  line-height: 1.4;
  z-index: 1;
`;

const Heading = styled.strong`
  font-size: 15px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const UrlForm = styled.form`
  display: flex;
  gap: 6px;
`;

const UrlInput = styled.input`
  min-width: 0;
  flex: 1;
`;

const Hint = styled.small`
  color: #c8d1e0;
`;

const ErrorMessage = styled.div`
  color: #ffb4ab;
`;

export type ControlPanelProps = {
  /** Label for the currently selected archive. */
  selectedSource: string | null;
  /** Current loading error, if any. */
  error: string | null;
  /** Called when the user selects a local SLPK/3TZ archive. */
  onFileSelected: (file: File) => void;
  /** Called when the user submits a remote SLPK/3TZ URL. */
  onUrlSelected: (url: string, format: ArchiveFormat) => void;
};

/** Selects a local or remote SLPK/3TZ archive. */
export function ControlPanel({
  selectedSource,
  error,
  onFileSelected,
  onUrlSelected
}: ControlPanelProps) {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<ArchiveFormat>('auto');

  /** Forward a selected local file to the shared archive renderer. */
  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelected(file);
      event.currentTarget.value = '';
    }
  }

  /** Forward a normalized remote URL to the shared archive renderer. */
  function handleUrlSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const normalizedUrl = url.trim();
    if (normalizedUrl) {
      onUrlSelected(normalizedUrl, format);
    }
  }

  return (
    <Panel>
      <Heading>Tile archive viewer</Heading>
      <Section>
        <label htmlFor="slpk-file">Drop a .slpk or .3tz file anywhere, or choose one</label>
        <input id="slpk-file" type="file" accept=".slpk,.3tz" onChange={handleFileChange} />
      </Section>
      <Section>
        <label htmlFor="slpk-url">From a URL</label>
        <label htmlFor="archive-format">Archive format</label>
        <select
          id="archive-format"
          value={format}
          onChange={event => setFormat(event.target.value as ArchiveFormat)}
        >
          <option value="auto">Detect from URL</option>
          <option value="slpk">I3S / SLPK</option>
          <option value="3tz">3D Tiles / 3TZ</option>
        </select>
        <UrlForm onSubmit={handleUrlSubmit}>
          <UrlInput
            id="slpk-url"
            type="url"
            value={url}
            placeholder="https://example.com/scene.slpk"
            onChange={event => setUrl(event.target.value)}
          />
          <button type="submit" disabled={!url.trim()}>
            Open
          </button>
        </UrlForm>
        <Hint>The server must allow CORS and return HTTP byte-range responses.</Hint>
      </Section>
      {selectedSource && (
        <Hint>
          Selected: {selectedSource}
          <br />
          Tiles load as you pan and zoom.
        </Hint>
      )}
      {error && <ErrorMessage role="alert">{error}</ErrorMessage>}
    </Panel>
  );
}
