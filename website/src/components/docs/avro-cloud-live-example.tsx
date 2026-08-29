import React, {useCallback, useState} from 'react';

import {AvroLoaderWithParser} from '@loaders.gl/avro/avro-loader';

const AVRO_FILES = [
  {
    label: 'Apache weather · compatibility fixture',
    sourceLabel: 'Apache Avro test data',
    sourceUrl: 'https://github.com/apache/avro/tree/main/share/test/data',
    url: 'https://raw.githubusercontent.com/apache/avro/main/share/test/data/weather.avro'
  },
  {
    label: 'Jagged 1 · 4.2 GB',
    sourceLabel: 'Zenodo jagged-array benchmark',
    sourceUrl: 'https://zenodo.org/records/14538340',
    url: 'https://zenodo.org/records/14538340/files/zlib9-jagged1.avro?download=1'
  },
  {
    label: 'Jagged 2 · 4.2 GB',
    sourceLabel: 'Zenodo jagged-array benchmark',
    sourceUrl: 'https://zenodo.org/records/14538340',
    url: 'https://zenodo.org/records/14538340/files/zlib9-jagged2.avro?download=1'
  },
  {
    label: 'Jagged 3 · 4.3 GB',
    sourceLabel: 'Zenodo jagged-array benchmark',
    sourceUrl: 'https://zenodo.org/records/14538340',
    url: 'https://zenodo.org/records/14538340/files/zlib9-jagged3.avro?download=1'
  }
] as const;

/** Demonstrates range-backed Avro loading without downloading the full dataset. */
export function AvroCloudLiveExample(): JSX.Element {
  const [fileIndex, setFileIndex] = useState(0);
  const [status, setStatus] = useState('Ready');
  const [rows, setRows] = useState<unknown[]>([]);
  const [error, setError] = useState('');
  const file = AVRO_FILES[fileIndex];

  const loadSample = useCallback(async () => {
    const file = AVRO_FILES[fileIndex];
    setStatus('Reading OCF header and first block…');
    setRows([]);
    setError('');
    try {
      for await (const batch of AvroLoaderWithParser.parseInBatchesFromUrl(file.url, {
        avro: {batchSize: 10, blockIndices: [0]}
      })) {
        setRows(batch.data.toArray().slice(0, 10));
      }
      setStatus('Loaded block 0 with HTTP ranges');
    } catch (loadError) {
      setStatus('Load failed');
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }, [fileIndex]);

  return (
    <section
      style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 8,
        padding: 20,
        margin: '24px 0'
      }}
    >
      <h2>Cloud Avro range loader</h2>
      <p>
        These public Avro files range from a small compatibility fixture to several gigabytes. This
        demo reads only the OCF header and first compressed block, returning the result as an Arrow
        table.
      </p>
      <label>
        Dataset{' '}
        <select value={fileIndex} onChange={event => setFileIndex(Number(event.target.value))}>
          {AVRO_FILES.map((file, index) => (
            <option key={file.url} value={index}>
              {file.label}
            </option>
          ))}
        </select>
      </label>{' '}
      <button type="button" onClick={loadSample}>
        Load first block
      </button>
      <p aria-live="polite">
        <strong>{status}</strong>
      </p>
      {error ? <pre style={{color: 'var(--ifm-color-danger)'}}>{error}</pre> : null}
      {rows.length > 0 ? (
        <pre style={{maxHeight: 360, overflow: 'auto'}}>{JSON.stringify(rows, null, 2)}</pre>
      ) : null}
      <small>
        Source: <a href={file.sourceUrl}>{file.sourceLabel}</a>.
      </small>
    </section>
  );
}
