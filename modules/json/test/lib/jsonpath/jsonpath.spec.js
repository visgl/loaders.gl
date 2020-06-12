import test from 'tape-promise/tape';
import {_JSONPath} from '@loaders.gl/json';

const TEST_CASES = [
  {jsonpath: '$', path: []},
  {jsonpath: '$.features', path: ['features']},
  {jsonpath: '$.features.*', path: ['features', '*']},
];

test.only('clarinet#track position', async t => {
  for (const tc of TEST_CASES) {
    const jsonpath = new _JSONPath(tc.jsonpath);
    const expected = new _JSONPath(tc.expected);
    t.ok(jsonpath.equals(expected), `${tc.jsonpath} parses correctly`);
  }
  t.end();
});
