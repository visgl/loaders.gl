import React, {PureComponent} from 'react';
import {render} from 'react-dom';

import {BenchResults} from '@probe.gl/react-bench';
import {Bench} from '@probe.gl/bench';

import {addModuleBenchmarksToSuite} from '../../test/bench/modules';

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
    this.state = {
      log: []
    };
  }

  async componentDidMount() {
    console.debug('Init bench');
    const suite = new Bench({
      log: this._logResult.bind(this)
    });
    await addModuleBenchmarksToSuite(suite, addReferenceBenchmarks);
    console.debug('Start bench');
    suite
      // Calibrate performance
      .calibrate()
      .run()
      // when running in browser, notify test the driver that it's done
      .then(() => {
        console.debug('Finish bench');
      });
  }

  _logResult(result) {
    console.debug(result);
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
    console.warn(log);
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
