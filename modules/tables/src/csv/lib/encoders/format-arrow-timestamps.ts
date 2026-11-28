// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {TimeUnit, type Timestamp, type Vector} from 'apache-arrow';

/** Iterate native timestamp storage without rounding through JavaScript numbers. */
export function* formatArrowTimestamps(column: Vector<Timestamp>): Generator<string | null, void> {
  const digits = [0, 3, 6, 9][column.type.unit];
  const unitsPerSecond = 10n ** BigInt(digits);
  for (const chunk of column.data) {
    for (let index = 0; index < chunk.length; index++) {
      if (!chunk.getValid(index)) {
        yield null;
        continue;
      }
      // Arrow slices their value buffers; offset applies only to validity bits here.
      const value = chunk.values[index];
      let seconds = value / unitsPerSecond;
      let remainder = value % unitsPerSecond;
      if (remainder < 0n) {
        seconds--;
        remainder += unitsPerSecond;
      }
      const date = new Date(Number(seconds) * 1000);
      if (!Number.isFinite(date.getTime())) {
        throw new Error('CSVWriter: timestamp is outside the ISO date range');
      }
      const prefix = date.toISOString().slice(0, -5);
      const fraction =
        column.type.unit === TimeUnit.SECOND ? '' : `.${String(remainder).padStart(digits, '0')}`;
      yield `${prefix}${fraction}Z`;
    }
  }
}
