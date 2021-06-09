import test from 'tape-promise/tape';
import {_JSONPath} from '@loaders.gl/json';

const TEST_CASES = [
  {jsonpath: '$', expected: []},
  {jsonpath: '$.features', expected: ['features']},
  {jsonpath: '$.features.*', expected: ['features', '*']}
];

test('JSONPath#parsing', async (t) => {
  for (const tc of TEST_CASES) {
    const jsonpath = new _JSONPath(tc.jsonpath);
    const expected = new _JSONPath(tc.expected);
    t.ok(jsonpath.equals(expected), `${tc.jsonpath} parses correctly`);
    t.equals(jsonpath.toString(), tc.jsonpath, `${tc.jsonpath} generates original string`);

    const jsonpathCopy = new _JSONPath(jsonpath);
    t.ok(jsonpathCopy.equals(expected), `${tc.jsonpath} copy parses correctly`);
    t.equals(jsonpathCopy.toString(), tc.jsonpath, `${tc.jsonpath} copy generates original string`);

    const jsonpathClone = jsonpath.clone();
    t.ok(jsonpathClone.equals(expected), `${tc.jsonpath} clone parses correctly`);
    t.equals(
      jsonpathClone.toString(),
      tc.jsonpath,
      `${tc.jsonpath} clone generates original string`
    );
  }
  t.end();
});

test('JSONPath#deep set', async (t) => {
  const jsonpath = new _JSONPath('$.a.b');
  const deepValue = {a: {b: 1}};
  t.equal(jsonpath.getFieldAtPath(deepValue), 1, 'JSONPath.getFieldAtPath');
  jsonpath.setFieldAtPath(deepValue, 2);
  t.equal(jsonpath.getFieldAtPath(deepValue), 2, 'JSONPath.setFieldAtPath');
  t.end();
});
