// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {PureComponent} from 'react';
import {createRoot} from 'react-dom/client';

import {BenchResults} from '../../website/src/components/bench-results';
import {Bench} from 'probe.gl/bench';
import {LOADERS_GL_RAW_FIXTURE_URL} from '@loaders.gl/core/constants';

import {addModuleBenchmarksToSuite} from '../../test/bench/modules';
import {installSortedGroupBenchOverride} from '../../test/bench/group-sorted';
import aliases from '../../test/aliases';

installSortedGroupBenchOverride(Bench);

const fixtureAliases = Object.fromEntries(Object.entries(aliases).map(([name, path]) => [
  name,
  path.replace('/__loaders_gl_test_fixtures__/', LOADERS_GL_RAW_FIXTURE_URL)
]));

const LOG_ENTRY = {
  GROUP: 'group',
  TEST: 'test',
  COMPLETE: 'complete'
};

function parseSIPrefix(itersPerSecond) {
  const value = parseFloat(itersPerSecond);
  const prefix = itersPerSecond[itersPerSecond.length - 1];
  switch (prefix) {
    case 'M':
      return value * 1000000;
    case 'K':
      return value * 1000;
    default:
      return value;
  }
}

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      log: []
    };
  }

  async componentDidMount() {
    const suite = new Bench({
      log: this._logResult.bind(this)
    });
    const benchmarkFilters = new URLSearchParams(window.location.search).getAll('module');
    await addModuleBenchmarksToSuite(suite, benchmarkFilters, fixtureAliases);
    suite
      // Calibrate performance
      .calibrate()
      .run();
  }

  _logResult(result) {
    const {type, id, itersPerSecond, error} = result;

    const {log} = this.state;
    switch (type) {
      case LOG_ENTRY.GROUP:
        log.push({id});
        break;
      case LOG_ENTRY.TEST:
        const value = parseSIPrefix(itersPerSecond);
        // log.push(`├─ ${id}: ${itersPerSecond} iterations/s ±${(error * 100).toFixed(2)}%`);
        log.push({
          id,
          value,
          formattedValue: itersPerSecond,
          formattedError: `${(error * 100).toFixed(2)}%`
        });
        break;
      case LOG_ENTRY.COMPLETE:
        break;
      default:
    }
    this.forceUpdate();
  }

  render() {
    const {log} = this.state;
    return (
      <div>
        <BenchResults log={log} />
      </div>
    );
  }
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
