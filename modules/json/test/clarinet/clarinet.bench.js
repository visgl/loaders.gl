import {ClarinetParser} from '@loaders.gl/json';

import BASIC from '../data/clarinet/basic.json';

export default function clarinetBench(bench) {
  const STRING = JSON.stringify(BASIC);

  const parser = new ClarinetParser();

  bench.group('Clarinet - JSON parsing');

  bench.add('ClarinetParser(basic.json)', () => {
    parser.write(STRING);
  });

  bench.add('JSON.parse(basic.json)', () => {
    JSON.parse(STRING);
  });
}
