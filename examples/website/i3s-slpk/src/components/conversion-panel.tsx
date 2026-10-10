import React, {useEffect, useRef, useState} from 'react';
import {inspectI3SConversionInput} from '../i3s-conversion-input';
import {
  ARCHIVE_MIME_TYPES,
  inspectConversionInput,
  type ConversionFormat
} from '../convert-tileset';
import {
  convertSelectedContentsInWorker,
  saveSelectedContentsInWorker,
  type ConversionInspection,
  type ConversionFeatureOptions,
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
  const [inputFormat, setInputFormat] = useState<
    '3d-tiles' | 'i3s' | 'slpk' | 'slpk-url' | '3tz' | '3tz-url'
  >('3d-tiles');
  const localArchive = inputFormat === 'slpk' || inputFormat === '3tz';
  const [file, setFile] = useState<File | null>(null);
  const [geometricError, setGeometricError] = useState('');
  const [inspection, setInspection] = useState<ConversionInspection | null>(null);
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
        const metricError =
          'kind' in inspection && format === '3tz'
            ? geometricError.trim()
              ? Number(geometricError)
              : NaN
            : undefined;
        if (metricError !== undefined && (!Number.isFinite(metricError) || metricError < 0))
          throw new Error('Declare a nonnegative geometric error in meters for I3S to 3TZ.');
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
              features,
              metricError
            )
          : await convertSelectedContentsInWorker(
              inspection,
              resourceIds,
              format,
              operation.signal,
              onProgress,
              features,
              metricError
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
        if (localArchive && !file) throw new Error('Choose a local archive file.');
        const inspected =
          inputFormat === '3d-tiles' || inputFormat === '3tz' || inputFormat === '3tz-url'
            ? await inspectConversionInput(
                localArchive ? file! : input.trim(),
                operation.signal,
                fetch,
                inputFormat !== '3d-tiles'
              )
            : await inspectI3SConversionInput(
                localArchive ? file! : input.trim(),
                operation.signal,
                fetch,
                inputFormat === 'slpk-url'
              );
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
      <strong>Convert selected tile meshes</strong>
      <small>
        Partial output: static GLB/B3DM meshes in native ECEF, or I3S leaf meshes from a layer URL
        or local/remote SLPK. Explicit local/remote 3TZ meshes are also accepted. Both formats
        preserve material factors, one PNG/JPEG base-color texture and explicitly mapped features.
        External buffers and images share the input budget. SLPK supports UV transforms and
        wrapping, but rejects explicit texture filtering and vertex colors. Other texture maps/UV
        sets and nested/implicit 3D Tiles are rejected. I3S atlas regions, colors and richer
        materials are unsupported; archive dependencies must remain inside the selected archive.
        Remote archives require CORS, byte-range responses and exposed validators; CRS/height
        resources are not inferred or downloaded.
      </small>
      <small>
        Both formats accept up to 64 mesh placements from selected leaf contents. Limits: 16 MiB
        input, 1,000 declared contents, 32 MiB output/archive, 1 cm position error. These are not
        peak memory limits. Conversion runs in a worker; cancel terminates its parsing and
        packaging. Archive chunks are transferred on demand. Download/preview retains the complete
        archive; direct file saving writes chunks without collecting it. Cancel is disabled during
        final file commit.
      </small>
      <form
        onSubmit={event => {
          event.preventDefault();
          void runOperation(false);
        }}
      >
        <label htmlFor="conversion-input-format">Input format</label>
        <select
          id="conversion-input-format"
          disabled={busy}
          value={inputFormat}
          onChange={event => {
            setInputFormat(event.target.value as typeof inputFormat);
            setFile(null);
            setInspection(null);
            setResourceIds([]);
            setResult(null);
            setError('');
            setStatus('');
          }}
        >
          <option value="3d-tiles">3D Tiles URL</option>
          <option value="i3s">I3S layer URL</option>
          <option value="slpk">Local SLPK file (up to 16 MiB)</option>
          <option value="slpk-url">SLPK URL (up to 16 MiB)</option>
          <option value="3tz">Local 3TZ file (up to 16 MiB)</option>
          <option value="3tz-url">3TZ URL (up to 16 MiB)</option>
        </select>
        {localArchive ? (
          <>
            <label htmlFor="conversion-file">{inputFormat.toUpperCase()} file</label>
            <input
              key={`conversion-file-${inputFormat}`}
              id="conversion-file"
              type="file"
              accept={`.${inputFormat}`}
              required
              disabled={busy}
              onChange={event => {
                setFile(event.target.files?.[0] ?? null);
                setInspection(null);
                setResourceIds([]);
                setResult(null);
                setError('');
                setStatus('');
              }}
            />
          </>
        ) : (
          <>
            <label htmlFor="conversion-url">
              {inputFormat === 'i3s'
                ? 'I3S layer'
                : inputFormat === 'slpk-url'
                  ? 'SLPK archive'
                  : inputFormat === '3tz-url'
                    ? '3TZ archive'
                    : '3D Tiles tileset'}{' '}
              URL (CORS required)
            </label>
            <input
              key="conversion-url-input"
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
          </>
        )}
        <button type="submit" disabled={busy || (localArchive ? !file : !input.trim())}>
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
            <option value="slpk">I3S / SLPK</option>
            <option value="3tz">3D Tiles / 3TZ</option>
          </select>
          {'kind' in inspection && format === '3tz' && (
            <>
              <label htmlFor="conversion-geometric-error">Maximum geometric error (meters)</label>
              <input
                id="conversion-geometric-error"
                type="number"
                min="0"
                step="any"
                disabled={busy}
                value={geometricError}
                onChange={event => {
                  setGeometricError(event.target.value);
                  setResult(null);
                }}
              />
              <small>
                Declare a conservative error for the selected I3S leaf meshes. Screen-size LOD
                metrics cannot be converted to meters automatically. Source hierarchy/LOD is not
                exported.
              </small>
            </>
          )}
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
            Declare every property and its Arrow type. No schema is inferred. SLPK requires explicit
            decimal-string encoding for 64-bit values; 3TZ retains binary integers; unsupported
            feature mappings fail. I3S mapping also requires objectIdProperty and maxAttributeBytes;
            the object-ID column must match geometry identifiers.
          </small>
          <button disabled={busy || !resourceIds.length} onClick={() => void runOperation(true)}>
            Convert selected content
          </button>
          {browserGlobal.showSaveFilePicker && (
            <button
              disabled={busy || !resourceIds.length}
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
function parseFeatureMapping(input: string): ConversionFeatureOptions | undefined {
  if (!input.trim()) return undefined;
  const mapping = JSON.parse(input) as ConversionFeatureOptions;
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
