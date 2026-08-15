import {test} from 'vitest';
import {testSax} from '../utils/test-utils';
test('SAXParser#cdata-fake-end', () => {
  const p = testSax({
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', '[[[[[[[[]]]]]]]]'],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  });
  let x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>';
  for (let i = 0; i < x.length; i++) {
    p.write(x.charAt(i));
  }
  p.close();
  const p2 = testSax({
    expect: [
      ['opentagstart', {name: 'R', attributes: {}}],
      ['opentag', {name: 'R', attributes: {}, isSelfClosing: false}],
      ['opencdata', undefined],
      ['cdata', '[[[[[[[[]]]]]]]]'],
      ['closecdata', undefined],
      ['closetag', 'R']
    ]
  });
  x = '<r><![CDATA[[[[[[[[[]]]]]]]]]]></r>';
  p2.write(x).close();
});
