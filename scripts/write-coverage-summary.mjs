#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';

const repositoryRoot = process.cwd();
const inputPath = path.resolve(process.argv[2] || 'test-results/coverage-check.json');
const outputPath = path.resolve(process.argv[3] || 'test-results/coverage-summary.md');
const report = readJson(inputPath);
const metrics = ['statements', 'lines', 'functions', 'branches'];
const rows = [...report.results].sort((left, right) => {
  const leftFloor = Math.min(...metrics.map(metric => left.merged[metric].percentage));
  const rightFloor = Math.min(...metrics.map(metric => right.merged[metric].percentage));
  return leftFloor - rightFloor || left.name.localeCompare(right.name);
});

const lines = [
  '# Coverage summary',
  '',
  `Generated: ${report.generatedAt}`,
  `Target: ${report.target}% | Packages at target: ${report.packagesAtTarget}/${report.packageCount}`,
  '',
  '| Package | Browser S/L/F/B | Merged S/L/F/B | Lowest merged metric |',
  '| --- | ---: | ---: | ---: |'
];

for (const result of rows) {
  const browser = formatMetrics(result.browser);
  const merged = formatMetrics(result.merged);
  const lowestMetric = metrics.reduce((lowest, metric) =>
    result.merged[metric].percentage < result.merged[lowest].percentage ? metric : lowest
  );
  lines.push(
    `| ${result.name} | ${browser} | ${merged} | ${lowestMetric} ` +
      `${result.merged[lowestMetric].percentage.toFixed(2)}% |`
  );
}

if (report.violations.length > 0) {
  lines.push('', '## Violations', '');
  for (const violation of report.violations) {
    lines.push(`- ${violation}`);
  }
}

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
}

console.log(`Coverage summary written to ${path.relative(repositoryRoot, outputPath)}`);

/** Reads a required JSON report. */
function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required coverage report does not exist: ${path.relative(repositoryRoot, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Formats the four coverage metrics in the stable roadmap order. */
function formatMetrics(coverage) {
  return metrics.map(metric => `${coverage[metric].percentage.toFixed(2)}%`).join('/');
}
