// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useEffect, useState} from 'react';

import {Bench, type LogEntry} from '@probe.gl/bench';
import {BenchResults} from '@probe.gl/react-bench';
import {parse} from '@loaders.gl/core';
import {PLYLoader} from '@loaders.gl/ply/bundled';

const GAUSSIAN_SPLAT_PLY_URL =
  'https://raw.githubusercontent.com/visgl/loaders.gl/master/modules/ply/test/data/gaussian/train-1000.ply';
const SPLAT_COUNT = 1000;
const BENCHMARK_OPTIONS = {minIterations: 3, multiplier: SPLAT_COUNT, unit: 'splats'};

type BenchmarkResultRow = {
  id: React.ReactNode;
  value?: number;
  formattedValue?: string;
  formattedError?: string;
};

type BenchmarkStatus = 'loading' | 'running' | 'complete' | 'failed';

/**
 * Renders live PLY parser benchmarks in the visitor's browser.
 */
export default function PlyBenchmarksApp(): JSX.Element {
  const [rows, setRows] = useState<BenchmarkResultRow[]>([]);
  const [status, setStatus] = useState<BenchmarkStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setRows([]);
    setStatus('loading');
    setErrorMessage(null);

    /** Appends one probe.gl log entry to the rendered table state. */
    const appendLogEntry = (entry: LogEntry): void => {
      if (!isMounted) {
        return;
      }

      const row = createBenchmarkResultRow(entry);
      if (row) {
        setRows(previousRows => [...previousRows, row]);
      }
    };

    /** Runs the benchmark suite once the browser-only component is mounted. */
    const runBenchmarks = async (): Promise<void> => {
      try {
        const response = await fetch(GAUSSIAN_SPLAT_PLY_URL);
        const arrayBuffer = await response.arrayBuffer();
        const bench = new Bench({
          id: 'loaders-gl-ply-website-benchmarks',
          log: appendLogEntry
        });

        addPLYBenchmarksToSuite(bench, arrayBuffer);
        if (isMounted) {
          setStatus('running');
        }
        await bench.calibrate().run();
        if (isMounted) {
          setStatus('complete');
        }
      } catch (error) {
        if (isMounted) {
          setStatus('failed');
          setErrorMessage(error instanceof Error ? error.message : String(error));
        }
      }
    };

    runBenchmarks();

    return () => {
      isMounted = false;
    };
  }, [runId]);

  /** Starts a fresh browser benchmark run. */
  const restartBenchmarks = (): void => {
    setRunId(previousRunId => previousRunId + 1);
  };

  const isRunning = status === 'loading' || status === 'running';
  const canRestart = status === 'complete' || status === 'failed';

  return (
    <div className="benchmark-page">
      <p>Live PLY Gaussian splat parser performance in this browser.</p>
      <div className="benchmark-status-row" aria-live="polite">
        {isRunning ? <span className="benchmark-spinner" aria-hidden="true" /> : null}
        <p className="benchmark-status">Status: {status}</p>
        {canRestart ? (
          <button className="benchmark-restart-button" type="button" onClick={restartBenchmarks}>
            Restart
          </button>
        ) : null}
      </div>
      {errorMessage ? <pre className="benchmark-error">{errorMessage}</pre> : null}
      <div className="benchmark-results">
        <BenchResults log={rows} />
      </div>
    </div>
  );
}

/**
 * Adds PLY parser benchmarks to a benchmark suite.
 * @param bench Target benchmark suite.
 * @param arrayBuffer Gaussian splat PLY fixture bytes.
 */
function addPLYBenchmarksToSuite(bench: Bench, arrayBuffer: ArrayBuffer): void {
  bench.group('PLY Decode - Gaussian Splat Binary Arrow');
  bench.addAsync('PLYLoader arrow-table direct', BENCHMARK_OPTIONS, async () => {
    await parse(arrayBuffer, PLYLoader, {
      ply: {shape: 'arrow-table'}
    });
  });
  bench.addAsync('PLYLoader arrow-table legacy mesh conversion', BENCHMARK_OPTIONS, async () => {
    await parse(arrayBuffer, PLYLoader, {
      ply: {shape: 'arrow-table', _useLegacyBinaryPointCloudParser: true}
    });
  });
}

/**
 * Creates a table row from one probe.gl log entry.
 * @param entry Probe log entry.
 * @returns Benchmark result row or null for completion entries.
 */
function createBenchmarkResultRow(entry: LogEntry): BenchmarkResultRow | null {
  switch (entry.type) {
    case 'group':
      return {id: entry.id};
    case 'test':
      return {
        id: entry.id,
        value: Number.parseFloat(entry.itersPerSecond),
        formattedValue: entry.itersPerSecond,
        formattedError: `${(entry.error * 100).toFixed(2)}%`
      };
    case 'complete':
      return null;
    default:
      return null;
  }
}
