import {ClarinetParser} from '@loaders.gl/json';

import BASIC from '../data/clarinet/basic.json';

export default function clarinetBench(bench) {
  const STRING = JSON.stringify(BASIC);

  const parser = new ClarinetParser();

  bench.group('Clarinet - JSON parsing from string');

  bench.add('JSON.parse (used by parseSync)', () => {
    JSON.parse(STRING);
  });

  bench.add('ClarinetParser (used by parseInBatches)', () => {
    parser.write(STRING);
  });
}
