// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Writes a machine-readable Vitest performance profile after a test run. */
export default class TestProfileReporter {
  /** Wall-clock start time for the current run. */
  startedAt = 0;

  /** Vitest controller used to read aggregate transform time. */
  vitest;

  /** Captures the Vitest controller for aggregate transform diagnostics. */
  onInit(vitest) {
    this.vitest = vitest;
  }

  /** Records the wall-clock start time for the current run. */
  onTestRunStart() {
    this.startedAt = Date.now();
  }

  /** Writes aggregate, per-module, and slow-test timing data. */
  onTestRunEnd(testModules, unhandledErrors, reason) {
    const moduleProfiles = testModules.map(testModule => createModuleProfile(testModule));
    const testProfiles = moduleProfiles.flatMap(moduleProfile => moduleProfile.tests);
    const totals = moduleProfiles.reduce(
      (profileTotals, moduleProfile) => {
        profileTotals.environmentSetupMilliseconds += moduleProfile.environmentSetupMilliseconds;
        profileTotals.prepareMilliseconds += moduleProfile.prepareMilliseconds;
        profileTotals.collectMilliseconds += moduleProfile.collectMilliseconds;
        profileTotals.setupMilliseconds += moduleProfile.setupMilliseconds;
        profileTotals.testMilliseconds += moduleProfile.testMilliseconds;
        profileTotals.importMilliseconds += moduleProfile.importMilliseconds;
        return profileTotals;
      },
      {
        environmentSetupMilliseconds: 0,
        prepareMilliseconds: 0,
        collectMilliseconds: 0,
        setupMilliseconds: 0,
        testMilliseconds: 0,
        importMilliseconds: 0
      }
    );

    const profile = {
      generatedAt: new Date().toISOString(),
      reason,
      runtime: {
        node: process.version,
        platform: process.platform,
        architecture: process.arch,
        availableParallelism: os.availableParallelism()
      },
      wallMilliseconds: Date.now() - this.startedAt,
      totals,
      transformMilliseconds: this.vitest?.state?.transformTime || 0,
      counts: {
        files: moduleProfiles.length,
        tests: testProfiles.length,
        passed: testProfiles.filter(testProfile => testProfile.state === 'passed').length,
        failed: testProfiles.filter(testProfile => testProfile.state === 'failed').length,
        skipped: testProfiles.filter(testProfile => testProfile.state === 'skipped').length,
        pending: testProfiles.filter(testProfile => testProfile.state === 'pending').length,
        unhandledErrors: unhandledErrors.length
      },
      slowestFiles: [...moduleProfiles]
        .sort((left, right) => right.totalMilliseconds - left.totalMilliseconds)
        .slice(0, 25)
        .map(({tests, ...moduleProfile}) => moduleProfile),
      slowestTests: [...testProfiles]
        .sort((left, right) => right.durationMilliseconds - left.durationMilliseconds)
        .slice(0, 50)
    };

    const outputFile = path.resolve(
      process.env.LOADERS_GL_TEST_PROFILE_OUTPUT || 'test-results/test-profile.json'
    );
    fs.mkdirSync(path.dirname(outputFile), {recursive: true});
    fs.writeFileSync(outputFile, `${JSON.stringify(profile, null, 2)}\n`);
    console.log(`Test profile written to ${path.relative(process.cwd(), outputFile)}`);
  }
}

/** Builds the profile entry for one Vitest test module. */
function createModuleProfile(testModule) {
  const diagnostic = testModule.diagnostic();
  const tests = [...testModule.children.allTests()].map(testCase => {
    const testDiagnostic = testCase.diagnostic();
    return {
      file: testModule.relativeModuleId,
      name: testCase.fullName,
      state: testCase.result().state,
      durationMilliseconds: testDiagnostic?.duration || 0
    };
  });
  const importMilliseconds = Object.values(diagnostic.importDurations).reduce(
    (total, importDuration) => total + importDuration.selfTime,
    0
  );
  const prepareMilliseconds = isValidDuration(diagnostic.prepareDuration)
    ? diagnostic.prepareDuration
    : 0;

  return {
    file: testModule.relativeModuleId,
    state: testModule.state(),
    environmentSetupMilliseconds: diagnostic.environmentSetupDuration,
    prepareMilliseconds,
    collectMilliseconds: diagnostic.collectDuration,
    setupMilliseconds: diagnostic.setupDuration,
    testMilliseconds: diagnostic.duration,
    importMilliseconds: importMilliseconds || diagnostic.collectDuration,
    totalMilliseconds:
      diagnostic.environmentSetupDuration +
      prepareMilliseconds +
      diagnostic.collectDuration +
      diagnostic.setupDuration +
      diagnostic.duration,
    tests
  };
}

/** Filters non-duration browser timestamps reported by affected Vitest versions. */
function isValidDuration(durationMilliseconds) {
  return (
    Number.isFinite(durationMilliseconds) &&
    durationMilliseconds >= 0 &&
    durationMilliseconds <= 5_000
  );
}
