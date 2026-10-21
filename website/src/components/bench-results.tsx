// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React from 'react';

/** Presentation row for the React benchmark examples. */
type BenchmarkResultRow = {
  /** Benchmark name or group heading, optionally with React formatting. */
  id: React.ReactNode;
  /** Numeric throughput used to size the score bar. */
  value?: number;
  /** Formatted throughput supplied by probe.gl. */
  formattedValue?: string;
  /** Formatted measurement uncertainty. */
  formattedError?: string;
};

/** Renders benchmark rows while preserving React labels and custom display scores. */
export function BenchResults({
  log
}: {
  /** Ordered benchmark groups and result rows. */
  log: readonly BenchmarkResultRow[];
}): JSX.Element {
  return (
    <table style={{width: '100%'}}>
      <caption>Benchmark results</caption>
      <thead>
        <tr>
          <th>Id</th>
          <th>Throughput</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {log.map((row, index) => {
          const throughput = row.value || 0;
          const percent =
            Number.isFinite(throughput) && throughput > 0
              ? Math.min(Math.max(((Math.log10(throughput) - 5) * 100) / 3, 5), 100)
              : 0;
          return row.value === undefined ? (
            <tr key={index}>
              <th colSpan={3} scope="row">
                {row.id}
              </th>
            </tr>
          ) : (
            <tr key={index}>
              <th scope="row">{row.id}</th>
              <td title={`±${row.formattedError}`}>{row.formattedValue}</td>
              <td style={{width: '35%'}}>
                <div
                  aria-hidden="true"
                  style={{
                    width: `${percent}%`,
                    minHeight: 20,
                    background:
                      throughput < 1e6 ? '#ff2e00' : throughput < 1e7 ? '#ffbf00' : '#85cc00'
                  }}
                >
                  {Number.isFinite(throughput) && throughput > 0
                    ? '★'.repeat(Math.min(Math.floor(throughput / 5e7), 5))
                    : ''}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
