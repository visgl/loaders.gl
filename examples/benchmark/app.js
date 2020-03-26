import React, {PureComponent} from 'react';
import {render} from 'react-dom';

import {BenchResults} from '@probe.gl/react-bench';
import {Bench} from '@probe.gl/bench';
import addBenchmarks from '../../test/bench/bench-modules';

const addReferenceBenchmarks = false;

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

    this.suite = new Bench({
      log: this._logResult.bind(this)
    });
    addBenchmarks(this.suite, addReferenceBenchmarks);

    this.state = {
      log: []
    };
  }

  componentDidMount() {
    this.suite
      // Calibrate performance
      .calibrate()
      .run()
      // when running in browser, notify test the driver that it's done
      .then(() => {});
  }

  _logResult(result) {
    const {entry, id, itersPerSecond, error} = result;

    const {log} = this.state;
    switch (entry) {
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
  render(<App />, container);
}
