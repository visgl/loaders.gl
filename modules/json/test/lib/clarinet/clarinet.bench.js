import {_ClarinetParser} from '@loaders.gl/json';

import BASIC from '../../data/clarinet/basic.json';

export default function clarinetBench(bench) {
  const STRING = JSON.stringify(BASIC);

  const parser = new _ClarinetParser();

  bench.group('Clarinet - JSON parsing from string');

  bench.add('ClarinetParser', {multiplier: STRING.length, unit: 'bytes'}, () => {
    parser.write(STRING);
  });

  bench.add('JSON.parse', {multiplier: STRING.length, unit: 'bytes'}, () => {
    JSON.parse(STRING);
  });
}
