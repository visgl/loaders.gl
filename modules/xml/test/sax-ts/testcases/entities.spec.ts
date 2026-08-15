import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#entities', () => {
  testSax({
    xml:
      '<r>&rfloor; ' +
      '&spades; &copy; &rarr; &amp; ' +
      '&lt; < <  <   < &gt; &real; &weierp; &euro;</r>',
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['text', '⌋ ♠ © → & < < <  <   < > ℜ ℘ €'],
      ['closetag', 'R']
    ]
  });
});
