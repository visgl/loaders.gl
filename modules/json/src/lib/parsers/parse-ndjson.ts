// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayRowTable, ObjectRowTable} from '@loaders.gl/schema';
import {makeTableFromData} from '@loaders.gl/schema';

export function parseNDJSONSync(ndjsonText: string): ArrayRowTable | ObjectRowTable {
  const lines = ndjsonText.trim().split('\n');
  const parsedLines = lines.map((line, counter) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`NDJSONLoader: failed to parse JSON on line ${counter + 1}`);
    }
  });

  return makeTableFromData(parsedLines);
}
