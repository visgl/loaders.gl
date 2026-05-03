// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const SORTED_GROUP_FLAG = Symbol.for('loaders.gl.bench.sortedGroup');
const SORTED_GROUP_PATCHED_FLAG = Symbol.for('loaders.gl.bench.sortedGroup.patched');
const sortedGroupIds = new WeakMap();

/**
 * Adds a `groupSorted()` helper to @probe.gl/bench suites.
 * @param {typeof import('@probe.gl/bench').Bench} Bench Benchmark class.
 * @returns {void}
 */
export function installSortedGroupBenchOverride(Bench) {
  if (Bench.prototype[SORTED_GROUP_PATCHED_FLAG]) {
    return;
  }

  const originalGroup = Bench.prototype.group;
  const originalRun = Bench.prototype.run;

  Bench.prototype.groupSorted = function groupSorted(id) {
    originalGroup.call(this, id);
    this.testCases[id][SORTED_GROUP_FLAG] = true;
    getSortedGroupIds(this).add(id);
    return this;
  };

  Bench.prototype.run = async function runSortedGroups() {
    const originalLog = this.props.log;
    const sortedLog = createSortedGroupLog(originalLog, getSortedGroupIds(this));
    this.props.log = sortedLog;

    try {
      return await originalRun.call(this);
    } finally {
      sortedLog.flush();
      this.props.log = originalLog;
    }
  };

  Bench.prototype[SORTED_GROUP_PATCHED_FLAG] = true;
}

/**
 * Gets the sorted group id registry for a suite.
 * @param {object} bench Benchmark suite.
 * @returns {Set<string>} Sorted group ids.
 */
function getSortedGroupIds(bench) {
  let ids = sortedGroupIds.get(bench);
  if (!ids) {
    ids = new Set();
    sortedGroupIds.set(bench, ids);
  }
  return ids;
}

/**
 * Creates a logger that buffers marked groups until all group results are available.
 * @param {(entry: object) => void} log Original benchmark logger.
 * @param {Set<string>} groupIds Sorted group ids.
 * @returns {((entry: object) => void) & {flush: () => void}} Wrapped logger.
 */
function createSortedGroupLog(log, groupIds) {
  let activeGroup = null;
  let activeGroupResults = [];

  function sortedLog(entry) {
    if (entry.type === 'group') {
      flushActiveGroupResults(log, activeGroup, activeGroupResults);
      activeGroup = groupIds.has(entry.id) ? entry : null;
      activeGroupResults = [];

      if (!activeGroup) {
        log(entry);
      }
      return;
    }

    if (entry.type === 'complete') {
      flushActiveGroupResults(log, activeGroup, activeGroupResults);
      activeGroup = null;
      activeGroupResults = [];
      log(entry);
      return;
    }

    if (activeGroup && entry.type === 'test') {
      activeGroupResults.push(entry);
      return;
    }

    log(entry);
  }

  sortedLog.flush = () => {
    flushActiveGroupResults(log, activeGroup, activeGroupResults);
    activeGroup = null;
    activeGroupResults = [];
  };

  return sortedLog;
}

/**
 * Logs a sorted group after all its benchmark results have completed.
 * @param {(entry: object) => void} log Original benchmark logger.
 * @param {object | null} group Group log entry.
 * @param {object[]} results Completed benchmark result log entries.
 * @returns {void}
 */
function flushActiveGroupResults(log, group, results) {
  if (!group) {
    return;
  }

  log(group);

  const sortedResults = results.toSorted(
    (left, right) => getIterationsPerSecond(right) - getIterationsPerSecond(left)
  );
  for (const result of sortedResults) {
    log(result);
  }
}

/**
 * Converts a formatted SI benchmark rate to a sortable number.
 * @param {object} result Benchmark result log entry.
 * @returns {number} Numeric iterations per second.
 */
function getIterationsPerSecond(result) {
  const text = String(result.itersPerSecond || '');
  const value = Number.parseFloat(text);
  if (!Number.isFinite(value)) {
    return 0;
  }

  const suffix = text.trim().match(/[a-zA-Z]+$/)?.[0] || '';
  const multipliers = {
    k: 1e3,
    K: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12
  };

  return value * (multipliers[suffix] || 1);
}
