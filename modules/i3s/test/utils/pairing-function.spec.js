/* eslint-disable camelcase */
import test from 'tape-promise/tape';
import {cantorPair, invertCantorPairing} from '../../src/lib/utils/pairing-function';

test('Cantor Pairing function#should produce natural number from two natural numbers', async (t) => {
  const first = 10;
  const second = 5;

  const result = cantorPair(first, second);
  const {x, y} = invertCantorPairing(result);

  t.equal(x, first);
  t.equal(y, second);

  const result_2 = cantorPair(second, first);
  const {x: x_1, y: y_1} = invertCantorPairing(result_2);

  t.equal(x_1, second);
  t.equal(y_1, first);

  t.end();
});
