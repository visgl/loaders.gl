import React, {useEffect, useRef, useState} from 'react';
import type {MeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import type {BrowserTilesetConversionInspection} from '@loaders.gl/tile-converter/v5/core';
import {inspectConversionInput, type ConversionFormat} from '../convert-tileset';
import {convertSelectedContentsInWorker} from '../conversion-worker-client';

/** Conversion controls reuse the viewer for the finalized archive. */
export type ConversionPanelProps = {
  /** Opens a successfully generated local archive in the incremental viewer. */
  readonly onPreview: (file: File) => void;
};

/** Inspects a URL, explicitly selects content placements, and downloads a bounded partial archive. */
export function ConversionPanel({onPreview}: ConversionPanelProps) {
  const controller = useRef<AbortController | null>(null);
  const [input, setInput] = useState('');
  const [inspection, setInspection] = useState<BrowserTilesetConversionInspection | null>(null);
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [format, setFormat] = useState<ConversionFormat>('slpk');
  const [featureMapping, setFeatureMapping] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof convertSelectedContentsInWorker>
  > | null>(null);
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

  /** Terminates active worker computation or aborts inspection transport. */
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
      setResourceIds([]);
    }
    try {
      if (convert && inspection) {
        const output = await convertSelectedContentsInWorker(
          inspection,
          resourceIds,
          format,
          operation.signal,
          message => {
            if (controller.current === operation) setStatus(message);
          },
          parseFeatureMapping(featureMapping)
        );
        if (controller.current === operation) {
          setResult(output);
          setStatus(`Complete: ${output.file.size.toLocaleString()} bytes`);
        }
      } else {
        const inspected = await inspectConversionInput(input.trim(), operation.signal);
        if (controller.current === operation) {
          setInspection(inspected);
          setStatus(`${inspected.resources.length} content placements. Select explicitly.`);
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
      <strong>Convert selected 3D Tiles meshes</strong>
      <small>
        Partial output: one static untextured GLB/B3DM primitive per content, native ECEF. Material
        factors are preserved. 3TZ supports vertex colors; SLPK supports explicitly mapped features.
        Textures, external buffers, nested/implicit tilesets and multiple primitives are rejected.
      </small>
      <small>
        3TZ accepts up to 64 selected leaf contents; SLPK accepts one. Limits: 16 MiB input, 1,000
        declared contents, 32 MiB output/archive, 1 cm position error. These are not peak memory
        limits. Conversion runs in a worker; cancel terminates its parsing and packaging. Archive
        chunks are transferred on demand; the complete download is retained in memory.
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
            setResourceIds([]);
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
          <label htmlFor="conversion-content">Content placements</label>
          <select
            id="conversion-content"
            disabled={busy}
            multiple
            size={Math.min(6, inspection.resources.length + 1)}
            value={resourceIds}
            onChange={event => {
              setResourceIds(Array.from(event.target.selectedOptions, option => option.value));
              setResult(null);
            }}
          >
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
            <option value="slpk" disabled={resourceIds.length > 1}>
              I3S / SLPK
            </option>
            <option value="3tz">3D Tiles / 3TZ</option>
          </select>
          <label htmlFor="conversion-features">SLPK feature mapping (optional JSON)</label>
          <textarea
            id="conversion-features"
            disabled={busy}
            value={featureMapping}
            rows={4}
            placeholder={
              '{"metadataClass":"building","schema":{"fields":[{"name":"feature_id","type":"int32","nullable":false}]}}'
            }
            onChange={event => {
              setFeatureMapping(event.target.value);
              setResult(null);
            }}
          />
          <small>
            Declare every property and its Arrow type. No schema is inferred. Exact 64-bit values
            require explicit decimal-string encoding; unsupported feature mappings fail.
          </small>
          <button
            disabled={busy || !resourceIds.length || (format === 'slpk' && resourceIds.length > 1)}
            onClick={() => void runOperation(true)}
          >
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

/** Reads an explicit feature mapping; detailed type/value and target validation belongs to the adapters. */
function parseFeatureMapping(input: string): MeshSourceFeatureOptions | undefined {
  if (!input.trim()) return undefined;
  const mapping = JSON.parse(input) as MeshSourceFeatureOptions;
  if (
    !mapping ||
    typeof mapping.metadataClass !== 'string' ||
    !mapping.metadataClass.trim() ||
    !Array.isArray(mapping.schema?.fields) ||
    !mapping.schema.fields.length
  )
    throw new Error('Feature mapping requires metadataClass and schema.fields.');
  return mapping;
}
