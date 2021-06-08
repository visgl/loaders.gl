// Fork of https://github.com/mapbox/wellknown under ISC license (MIT/BSD-2-clause equivalent)

import test from 'tape-promise/tape';
import parseWKT from '@loaders.gl/wkt/lib/parse-wkt';
import fuzzer from 'fuzzer';

test('parseWKT#fuzz', (t) => {
  fuzzer.seed(0);
  const inputs = [
    'MULTIPOLYGON (((30 20, 10 40, 45 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))',
    'POINT(1.1 1.1)',
    'LINESTRING (30 10, 10 30, 40 40)',
    'GeometryCollection(POINT(4 6),\nLINESTRING(4 6,7 10))'
  ];
  inputs.forEach(function (str) {
    for (let i = 0; i < 10000; i++) {
      const input = fuzzer.mutate.string(str);
      try {
        parseWKT(input);
      } catch (e) {
        t.fail(`could not parse ${input}, exception ${e}`);
      }
    }
  });
  t.end();
});
