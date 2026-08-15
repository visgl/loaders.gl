#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';

const COVERAGE_METRICS = ['statements', 'lines', 'functions', 'branches'];
const repositoryRoot = process.cwd();
const manifestPath = path.resolve('test/coverage-thresholds.json');
const browserSummaryPath = path.resolve(
  getArgumentValue('--browser') || 'coverage/browser/coverage-summary.json'
);
const mergedSummaryPath = path.resolve(
  getArgumentValue('--merged') || 'coverage/coverage-summary.json'
);
const outputPath = path.resolve('test-results/coverage-check.json');
const initialize = process.argv.includes('--initialize');
const update = process.argv.includes('--update') || initialize;
const manifest = readJsonFile(manifestPath);
const browserSummary = readJsonFile(browserSummaryPath);
const mergedSummary = readJsonFile(mergedSummaryPath);
const publishedPackages = findPublishedPackages();
const results = [];
const violations = [];

for (const publishedPackage of publishedPackages) {
  const browserCoverage = aggregatePackageCoverage(browserSummary, publishedPackage.path);
  const mergedCoverage = aggregatePackageCoverage(mergedSummary, publishedPackage.path);
  checkCoveragePresence(publishedPackage.name, 'browser', browserCoverage, violations);
  checkCoveragePresence(publishedPackage.name, 'merged', mergedCoverage, violations);
  let packageThresholds = manifest.packages[publishedPackage.name];

  if (!packageThresholds) {
    if (initialize) {
      packageThresholds = {
        path: publishedPackage.path,
        browser: floorCoverage(browserCoverage),
        merged: floorCoverage(mergedCoverage)
      };
    } else if (update) {
      packageThresholds = {
        path: publishedPackage.path,
        browser: createMetricThresholds(manifest.target),
        merged: createMetricThresholds(manifest.target)
      };
    } else {
      violations.push(
        `${publishedPackage.name} has no threshold entry; new published packages start at ${manifest.target}%`
      );
      continue;
    }
    manifest.packages[publishedPackage.name] = packageThresholds;
  }

  if (update && !initialize) {
    raiseThresholds(packageThresholds.browser, browserCoverage);
    raiseThresholds(packageThresholds.merged, mergedCoverage);
  }

  checkThresholds(
    publishedPackage.name,
    'browser',
    browserCoverage,
    packageThresholds.browser,
    violations
  );
  checkThresholds(
    publishedPackage.name,
    'merged',
    mergedCoverage,
    packageThresholds.merged,
    violations
  );
  results.push({
    name: publishedPackage.name,
    path: publishedPackage.path,
    browser: browserCoverage,
    merged: mergedCoverage,
    thresholds: packageThresholds
  });
}

const publishedPackageNames = new Set(publishedPackages.map(publishedPackage => publishedPackage.name));
for (const manifestPackageName of Object.keys(manifest.packages)) {
  if (!publishedPackageNames.has(manifestPackageName)) {
    violations.push(`Coverage threshold entry is stale: ${manifestPackageName}`);
  }
}

if (update) {
  const sortedPackages = Object.fromEntries(
    Object.entries(manifest.packages).sort(([leftName], [rightName]) =>
      leftName.localeCompare(rightName)
    )
  );
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify({...manifest, packages: sortedPackages}, null, 2)}\n`
  );
}

const report = {
  generatedAt: new Date().toISOString(),
  target: manifest.target,
  packagesAtTarget: results.filter(result =>
    COVERAGE_METRICS.every(metric => result.merged[metric].percentage >= manifest.target)
  ).length,
  packageCount: results.length,
  results,
  violations
};
fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `Coverage thresholds: ${report.packagesAtTarget}/${report.packageCount} packages at ` +
    `${manifest.target}%, ${violations.length} violations`
);
console.log(`Coverage check report written to ${path.relative(repositoryRoot, outputPath)}`);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
}

/** Returns a named command-line argument value. */
function getArgumentValue(argumentName) {
  const argumentIndex = process.argv.indexOf(argumentName);
  return argumentIndex >= 0 ? process.argv[argumentIndex + 1] : undefined;
}

/** Reads and parses a required JSON file. */
function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Required coverage file does not exist: ${path.relative(repositoryRoot, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Discovers non-private published packages under modules. */
function findPublishedPackages() {
  const packages = [];
  for (const directoryName of fs.readdirSync(path.resolve('modules')).sort()) {
    const packagePath = path.resolve('modules', directoryName, 'package.json');
    if (!fs.existsSync(packagePath)) {
      continue;
    }
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!packageJson.private) {
      packages.push({name: packageJson.name, path: `modules/${directoryName}`});
    }
  }
  return packages;
}

/** Aggregates file-level Istanbul summary counts for one package. */
function aggregatePackageCoverage(coverageSummary, packagePath) {
  const aggregate = Object.fromEntries(
    COVERAGE_METRICS.map(metric => [metric, {total: 0, covered: 0, percentage: 100}])
  );
  const packageSourcePath = `${packagePath}/src/`;

  for (const [sourceFile, sourceCoverage] of Object.entries(coverageSummary)) {
    if (sourceFile === 'total') {
      continue;
    }
    const normalizedSourceFile = sourceFile.replaceAll('\\', '/');
    const relativeSourceFile = path.isAbsolute(normalizedSourceFile)
      ? path.relative(repositoryRoot, normalizedSourceFile).replaceAll(path.sep, '/')
      : normalizedSourceFile.replace(/^\.\//, '');
    if (!relativeSourceFile.startsWith(packageSourcePath)) {
      continue;
    }

    for (const metric of COVERAGE_METRICS) {
      aggregate[metric].total += sourceCoverage[metric].total;
      aggregate[metric].covered += sourceCoverage[metric].covered;
    }
  }

  for (const metric of COVERAGE_METRICS) {
    const metricCoverage = aggregate[metric];
    metricCoverage.percentage =
      metricCoverage.total === 0 ? 100 : (metricCoverage.covered / metricCoverage.total) * 100;
  }
  return aggregate;
}

/** Converts exact package coverage to whole-number baseline floors. */
function floorCoverage(coverage) {
  return Object.fromEntries(
    COVERAGE_METRICS.map(metric => [metric, Math.floor(coverage[metric].percentage)])
  );
}

/** Creates identical thresholds for each coverage metric. */
function createMetricThresholds(threshold) {
  return Object.fromEntries(COVERAGE_METRICS.map(metric => [metric, threshold]));
}

/** Raises committed thresholds to whole-number achieved coverage without lowering any metric. */
function raiseThresholds(thresholds, coverage) {
  for (const metric of COVERAGE_METRICS) {
    thresholds[metric] = Math.max(thresholds[metric], Math.floor(coverage[metric].percentage));
  }
}

/** Adds violations for package metrics below their committed thresholds. */
function checkThresholds(packageName, coverageKind, coverage, thresholds, violations_) {
  for (const metric of COVERAGE_METRICS) {
    if (coverage[metric].percentage + Number.EPSILON < thresholds[metric]) {
      violations_.push(
        `${packageName} ${coverageKind} ${metric} coverage ` +
          `${coverage[metric].percentage.toFixed(2)}% is below ${thresholds[metric]}%`
      );
    }
  }
}

/** Rejects a package summary that silently omitted all explicitly included production source. */
function checkCoveragePresence(packageName, coverageKind, coverage, violations_) {
  if (coverage.statements.total === 0) {
    violations_.push(`${packageName} has no ${coverageKind} production coverage records`);
  }
}
