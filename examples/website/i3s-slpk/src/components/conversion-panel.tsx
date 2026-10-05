import React, {useEffect, useRef, useState} from 'react';
import type {BrowserTilesetConversionInspection} from '@loaders.gl/tile-converter/v5/core';
import {
  inspectConversionInput,
  convertSelectedContent,
  type ConversionFormat
} from '../convert-tileset';

/** Conversion controls reuse the viewer for the finalized archive. */
export type ConversionPanelProps = {
  /** Opens a successfully generated local archive in the incremental viewer. */
  readonly onPreview: (file: File) => void;
};

/** Inspects a URL, explicitly selects one content placement, and downloads a bounded partial archive. */
export function ConversionPanel({onPreview}: ConversionPanelProps) {
  const controller = useRef<AbortController | null>(null);
  const [input, setInput] = useState('');
  const [inspection, setInspection] = useState<BrowserTilesetConversionInspection | null>(null);
  const [resourceId, setResourceId] = useState('');
  const [format, setFormat] = useState<ConversionFormat>('slpk');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Awaited<ReturnType<typeof convertSelectedContent>> | null>(
    null
  );
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    []
  );
  useEffect(() => {
    if (!result) {
      setDownloadUrl('');
      return;
    }
    const url = URL.createObjectURL(result.file);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  /** Cancels transport immediately; late decoding/packaging results are discarded. */
  function cancelConversion(): void {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setStatus('Canceled');
  }

  /** Runs a single operation and ignores callbacks or results from canceled operations. */
  async function runOperation(convert: boolean): Promise<void> {
    controller.current?.abort();
    const operation = new AbortController();
    controller.current = operation;
    setBusy(true);
    setError('');
    setResult(null);
    setStatus(convert ? 'Loading selected content' : 'Inspecting tileset');
    if (!convert) {
      setInspection(null);
      setResourceId('');
    }
    try {
      if (convert && inspection) {
        const output = await convertSelectedContent(
          inspection,
          resourceId,
          format,
          operation.signal,
          message => {
            if (controller.current === operation) setStatus(message);
          }
        );
        if (controller.current === operation) {
          setResult(output);
          setStatus(`Complete: ${output.file.size.toLocaleString()} bytes`);
        }
      } else {
        const inspected = await inspectConversionInput(input.trim(), operation.signal);
        if (controller.current === operation) {
          setInspection(inspected);
          setStatus(`${inspected.resources.length} content placements. Select one explicitly.`);
        }
      }
    } catch (operationError) {
      if (controller.current === operation) {
        setStatus('Failed');
        setError(operationError instanceof Error ? operationError.message : String(operationError));
      }
    } finally {
      if (controller.current === operation) {
        controller.current = null;
        setBusy(false);
      }
    }
  }

  return (
    <section style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      <strong>Convert a selected 3D Tiles mesh</strong>
      <small>
        Partial output: one static untextured GLB/B3DM primitive, native ECEF. Textures, feature
        metadata, external buffers, nested/implicit tilesets and multiple primitives are rejected.
      </small>
      <small>
        Limits: 16 MiB input, 1,000 declared contents, 32 MiB output/archive, 1 cm position error.
        These are not peak memory limits. Parsing runs on the main thread; cancel discards late
        results.
      </small>
      <form
        onSubmit={event => {
          event.preventDefault();
          void runOperation(false);
        }}
      >
        <label htmlFor="conversion-url">3D Tiles tileset URL (CORS required)</label>
        <input
          id="conversion-url"
          type="url"
          required
          disabled={busy}
          value={input}
          placeholder="https://example.com/tileset.json"
          style={{width: '100%', boxSizing: 'border-box'}}
          onChange={event => {
            setInput(event.target.value);
            setInspection(null);
            setResourceId('');
            setResult(null);
            setError('');
            setStatus('');
          }}
        />
        <button type="submit" disabled={busy || !input.trim()}>
          Inspect
        </button>
      </form>
      {inspection && (
        <>
          <label htmlFor="conversion-content">Content placement</label>
          <select
            id="conversion-content"
            disabled={busy}
            value={resourceId}
            onChange={event => {
              setResourceId(event.target.value);
              setResult(null);
            }}
          >
            <option value="">Select content</option>
            {inspection.resources.map(resource => (
              <option key={resource.resourceId} value={resource.resourceId}>
                {resource.resourceId}: {resource.uri}
              </option>
            ))}
          </select>
          <label htmlFor="conversion-format">Output archive</label>
          <select
            id="conversion-format"
            disabled={busy}
            value={format}
            onChange={event => {
              setFormat(event.target.value as ConversionFormat);
              setResult(null);
            }}
          >
            <option value="slpk">I3S / SLPK</option>
            <option value="3tz">3D Tiles / 3TZ</option>
          </select>
          <button disabled={busy || !resourceId} onClick={() => void runOperation(true)}>
            Convert selected content
          </button>
        </>
      )}
      {busy && <button onClick={cancelConversion}>Cancel</button>}
      {status && <small role="status">{status}</small>}
      {error && (
        <div role="alert" style={{color: '#ffb4ab'}}>
          {error}
        </div>
      )}
      {result && downloadUrl && (
        <>
          <a href={downloadUrl} download={result.file.name} style={{color: '#8ecbff'}}>
            Download {result.file.name}
          </a>
          <button onClick={() => onPreview(result.file)}>Preview generated archive</button>
          {result.report.diagnostics.map((diagnostic, index) => (
            <small key={index}>{diagnostic.message}</small>
          ))}
        </>
      )}
    </section>
  );
}
