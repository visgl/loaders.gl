import test from 'tape-promise/tape';
import {_JSONPath} from '@loaders.gl/json';

const TEST_CASES = [
  {jsonpath: '$', expected: []},
  {jsonpath: '$.features', expected: ['features']},
  {jsonpath: '$.features.*', expected: ['features', '*']}
];

test('JSONPath#parsing', async t => {
  for (const tc of TEST_CASES) {
    const jsonpath = new _JSONPath(tc.jsonpath);
    const expected = new _JSONPath(tc.expected);
    t.ok(jsonpath.equals(expected), `${tc.jsonpath} parses correctly`);
  }
  t.end();
});

test('JSONPath#deep set', async t => {
  const jsonpath = new _JSONPath('$.a.b');
  const deepValue = {a: {b: 1}};
  t.equal(jsonpath.getFieldAtPath(deepValue), 1, 'JSONPath.getFieldAtPath');
  jsonpath.setFieldAtPath(deepValue, 2);
  t.equal(jsonpath.getFieldAtPath(deepValue), 2, 'JSONPath.setFieldAtPath');
  t.end();
});
