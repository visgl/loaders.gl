import React, {useEffect, useRef, useState} from 'react';
import type {MeshSourceFeatureOptions} from '@loaders.gl/tile-converter/v5/adapters';
import type {BrowserTilesetConversionInspection} from '@loaders.gl/tile-converter/v5/core';
import {
  ARCHIVE_MIME_TYPES,
  inspectConversionInput,
  type ConversionFormat
} from '../convert-tileset';
import {
  convertSelectedContentsInWorker,
  saveSelectedContentsInWorker,
  type SavedConversionResult
} from '../conversion-worker-client';

/** Conversion controls reuse the viewer for the finalized archive. */
export type ConversionPanelProps = {
  /** Opens a successfully generated local archive in the incremental viewer. */
  readonly onPreview: (file: File) => void;
};

/** Inspects a URL, explicitly selects content placements, and downloads or saves a bounded partial archive. */
export function ConversionPanel({onPreview}: ConversionPanelProps) {
  const controller = useRef<AbortController | null>(null);
  const commitStarted = useRef(false);
  const browserGlobal = globalThis as typeof globalThis & {
    /** Optional native picker, invoked synchronously from the save button's user activation. */
    showSaveFilePicker?: (options: {
      /** Suggested archive download filename. */
      suggestedName: string;
      /** Native file extension filters. */
      types: {
        /** Maps an archive MIME type to its accepted extensions. */
        accept: Record<string, string[]>;
      }[];
    }) => Promise<FileSystemFileHandle>;
  };
  const [input, setInput] = useState('');
  const [inspection, setInspection] = useState<BrowserTilesetConversionInspection | null>(null);
  const [resourceIds, setResourceIds] = useState<string[]>([]);
  const [format, setFormat] = useState<ConversionFormat>('slpk');
  const [featureMapping, setFeatureMapping] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<
    Awaited<ReturnType<typeof convertSelectedContentsInWorker>> | SavedConversionResult | null
  >(null);
  const [downloadUrl, setDownloadUrl] = useState('');

  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    []
  );
  useEffect(() => {
    if (!result || !('file' in result)) {
      setDownloadUrl('');
      return;
    }
    const url = URL.createObjectURL(result.file);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  /** Terminates active worker computation or aborts inspection transport. */
  function cancelConversion(): void {
    if (commitStarted.current) return;
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setStatus('Canceled');
  }

  /** Runs a single operation and ignores callbacks or results from canceled operations. */
  async function runOperation(convert: boolean, saveToFile = false): Promise<void> {
    controller.current?.abort();
    const operation = new AbortController();
    controller.current = operation;
    commitStarted.current = false;
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
        const features = parseFeatureMapping(featureMapping);
        let fileHandle: FileSystemFileHandle | undefined;
        let destination: FileSystemWritableFileStream | undefined;
        if (saveToFile) {
          if (!browserGlobal.showSaveFilePicker)
            throw new Error('Direct file saving is unavailable.');
          setStatus('Choose archive file');
          try {
            fileHandle = await browserGlobal.showSaveFilePicker({
              suggestedName: `${resourceIds.length > 1 ? 'selected-meshes' : 'selected-mesh'}.${format}`,
              types: [{accept: {[ARCHIVE_MIME_TYPES[format]]: [`.${format}`]}}]
            });
          } catch (pickerError) {
            if (pickerError instanceof DOMException && pickerError.name === 'AbortError')
              operation.abort(pickerError);
            throw pickerError;
          }
          operation.signal.throwIfAborted();
          destination = await fileHandle.createWritable();
        }
        /** Updates only this operation and marks the noncancelable file commit boundary. */
        const onProgress = (message: string): void => {
          if (controller.current === operation) {
            if (message === 'Saving archive') commitStarted.current = true;
            setStatus(message);
          }
        };
        const output = destination
          ? await saveSelectedContentsInWorker(
              inspection,
              resourceIds,
              format,
              operation.signal,
              onProgress,
              destination,
              features
            )
          : await convertSelectedContentsInWorker(
              inspection,
              resourceIds,
              format,
              operation.signal,
              onProgress,
              features
            );
        if (controller.current === operation) {
          setResult(output);
          setStatus(
            'file' in output
              ? `Complete: ${output.file.size.toLocaleString()} bytes`
              : `Saved ${fileHandle!.name}: ${output.size.toLocaleString()} bytes`
          );
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
        setStatus(operation.signal.aborted ? 'Canceled' : 'Failed');
        if (!operation.signal.aborted)
          setError(
            operationError instanceof Error ? operationError.message : String(operationError)
          );
      }
    } finally {
      if (controller.current === operation) {
        controller.current = null;
        commitStarted.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <section style={{display: 'flex', flexDirection: 'column', gap: 6}}>
      <strong>Convert selected 3D Tiles meshes</strong>
      <small>
        Partial output: static GLB/B3DM meshes in native ECEF. Both formats preserve material
        factors, one PNG/JPEG base-color texture and explicitly mapped features. External buffers
        and images share the input budget. SLPK supports UV transforms and wrapping, but rejects
        explicit texture filtering and vertex colors. Other texture maps/UV sets and nested/implicit
        tilesets are rejected.
      </small>
      <small>
        Both formats accept up to 64 mesh placements from selected leaf contents. Limits: 16 MiB input, 1,000
        declared contents, 32 MiB output/archive, 1 cm position error. These are not peak memory
        limits. Conversion runs in a worker; cancel terminates its parsing and packaging. Archive
        chunks are transferred on demand. Download/preview retains the complete archive; direct file
        saving writes chunks without collecting it. Cancel is disabled during final file commit.
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
          <label htmlFor="conversion-features">Feature mapping (optional JSON)</label>
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
          {browserGlobal.showSaveFilePicker && (
            <button
              disabled={
                busy || !resourceIds.length || (format === 'slpk' && resourceIds.length > 1)
              }
              onClick={() => void runOperation(true, true)}
            >
              Convert and save to file
            </button>
          )}
        </>
      )}
      {busy && (
        <button disabled={status === 'Saving archive'} onClick={cancelConversion}>
          Cancel
        </button>
      )}
      {status && <small role="status">{status}</small>}
      {error && (
        <div role="alert" style={{color: '#ffb4ab'}}>
          {error}
        </div>
      )}
      {result && 'file' in result && downloadUrl && (
        <>
          <a href={downloadUrl} download={result.file.name} style={{color: '#8ecbff'}}>
            Download {result.file.name}
          </a>
          <button onClick={() => onPreview(result.file)}>Preview generated archive</button>
        </>
      )}
      {result?.report.diagnostics.map((diagnostic, index) => (
        <small key={index}>{diagnostic.message}</small>
      ))}
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
