import React, {useCallback, useState} from 'react';

import {load} from '@loaders.gl/core';
import {ORCLoader} from '../../../../modules/orc/src';

const ORC_FILE =
  'https://raw.githubusercontent.com/apache/orc/rel/release-2.0.1/examples/demo-11-none.orc';

/** Demonstrates loading a hosted ORC file into an Apache Arrow table. */
export function OrcCloudLiveExample(): JSX.Element {
  const [status, setStatus] = useState('Ready');
  const [rows, setRows] = useState<unknown[]>([]);
  const [error, setError] = useState('');

  const loadSample = useCallback(async () => {
    setStatus('Downloading and decoding ORC…');
    setRows([]);
    setError('');
    try {
      const table = await load(ORC_FILE, ORCLoader);
      setRows(table.data.toArray().slice(0, 10));
      setStatus(`Loaded ${table.data.numRows} rows into an Arrow table`);
    } catch (loadError) {
      setStatus('Load failed');
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    }
  }, []);

  return (
    <section
      style={{
        border: '1px solid var(--ifm-color-emphasis-300)',
        borderRadius: 8,
        padding: 20,
        margin: '24px 0'
      }}
    >
      <h2>Hosted ORC loader</h2>
      <p>
        This Apache ORC compatibility fixture is fetched directly in the browser and decoded to an
        Apache Arrow table.
      </p>
      <button type="button" onClick={loadSample}>
        Load hosted ORC
      </button>
      <p aria-live="polite">
        <strong>{status}</strong>
      </p>
      {error ? <pre style={{color: 'var(--ifm-color-danger)'}}>{error}</pre> : null}
      {rows.length > 0 ? (
        <pre style={{maxHeight: 360, overflow: 'auto'}}>{JSON.stringify(rows, null, 2)}</pre>
      ) : null}
      <small>
        Source:{' '}
        <a href="https://github.com/apache/orc/blob/rel/release-2.0.1/examples/demo-11-none.orc">
          Apache ORC v0 compatibility fixture
        </a>.
      </small>
    </section>
  );
}
