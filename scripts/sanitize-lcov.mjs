#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';

const coveragePath = path.resolve(process.argv[2] || 'coverage/lcov.info');
const lines = fs.readFileSync(coveragePath, 'utf8').split(/\r?\n/);
const records = [];
let currentRecord = [];

for (const line of lines) {
  currentRecord.push(line);
  if (line === 'end_of_record') {
    addRecordWhenItHasSource(records, currentRecord);
    currentRecord = [];
  }
}
addRecordWhenItHasSource(records, currentRecord);

fs.writeFileSync(coveragePath, `${records.join('\n')}\n`);

/** Adds an LCOV record when it identifies a non-empty source path. */
function addRecordWhenItHasSource(records_, recordLines) {
  const sourceFileLine = recordLines.find(recordLine => recordLine.startsWith('SF:'));
  const sourceFile = sourceFileLine ? sourceFileLine.slice(3).trim() : '';
  if (sourceFile) {
    records_.push(recordLines.join('\n'));
  }
}
