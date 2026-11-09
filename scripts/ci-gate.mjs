// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {pathToFileURL} from 'node:url';

/** Reject failures, cancellations, missing results and unexpected skips. */
export function checkResults(needs, eventName) {
  const failures = [];
  for (const name of [
    'build',
    'test',
    'slow-tests',
    'coverage-finished',
    'tile-converter-tests',
    'website-build'
  ]) {
    if (needs[name]?.result !== 'success')
      failures.push(`${name}: ${needs[name]?.result ?? 'missing'}`);
  }
  const externalExpected = ['schedule', 'workflow_dispatch'].includes(eventName)
    ? 'success'
    : 'skipped';
  if (needs['external-tests']?.result !== externalExpected)
    failures.push(
      `external-tests: expected ${externalExpected}, got ${needs['external-tests']?.result ?? 'missing'}`
    );
  return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const failures = checkResults(JSON.parse(process.env.NEEDS), process.env.EVENT_NAME);
  if (failures.length) throw new Error(failures.join('\n'));
  console.log('All required CI jobs passed');
}
