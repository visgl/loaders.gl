import test from 'tape-promise/tape';
import {_JSONPath} from '@loaders.gl/json';

const VALID_JSONPATHS = [
  {jsonpath: '$', expected: [], canonical: '$'},
  {jsonpath: '$.features', expected: ['features'], canonical: '$.features'},
  {jsonpath: '$["features"]', expected: ['features'], canonical: '$.features'},
  {jsonpath: '$[:]', expected: [], canonical: '$'},
  {jsonpath: '$.items[*]', expected: ['items'], canonical: '$.items'},
  {jsonpath: '$.items[ : ]', expected: ['items'], canonical: '$.items'},
  {jsonpath: '$.items.*', expected: ['items'], canonical: '$.items'},
  {jsonpath: '$.items[0:10]', expected: ['items'], canonical: '$.items'},
  {jsonpath: '$["feature-name"]', expected: ['feature-name'], canonical: "$['feature-name']"}
  // {
  //   jsonpath: '$["nested \\'quote\\' key"]',
  //   expected: ["nested 'quote' key"],
  //   canonical: "$['nested \\'quote\\' key']"
  // }
];

const INVALID_JSONPATHS = [
  {jsonpath: 'features', message: /JSONPath must start with \$/},
  {jsonpath: '$.trailing.', message: /JSONPath cannot end with a period/},
  {jsonpath: '$.store..book', message: /JSONPath descendant selectors \(..\) are not supported/},
  {
    jsonpath: '$.items[*].id',
    message: /JSONPath cannot select fields after array element selectors/
  },
  {jsonpath: '$.items[0]', message: /JSONPath array index selectors are not supported/},
  {jsonpath: '$.items[0,1]', message: /JSONPath union selectors are not supported/},
  {jsonpath: '$.items[?(@.price > 10)]', message: /JSONPath filter selectors are not supported/},
  {jsonpath: '$.items[@.price]', message: /JSONPath current node selector \(@\) is not supported/},
  {jsonpath: '$.items[(@.length-1)]', message: /JSONPath script selectors are not supported/},
  {
    jsonpath: '$["unclosed',
    message: /JSONPath string in bracket property selector is unterminated/
  }
];

test('JSONPath#parsing', async (t) => {
  for (const testCase of VALID_JSONPATHS) {
    const jsonpath = new _JSONPath(testCase.jsonpath);
    const expected = new _JSONPath(testCase.expected);
    t.ok(jsonpath.equals(expected), `${testCase.jsonpath} parses correctly`);
    t.equals(
      jsonpath.toString(),
      testCase.canonical,
      `${testCase.jsonpath} normalizes to ${testCase.canonical}`
    );

    const jsonpathCopy = new _JSONPath(jsonpath);
    t.ok(jsonpathCopy.equals(expected), `${testCase.jsonpath} copy parses correctly`);
    t.equals(
      jsonpathCopy.toString(),
      testCase.canonical,
      `${testCase.jsonpath} copy normalizes correctly`
    );

    const jsonpathClone = jsonpath.clone();
    t.ok(jsonpathClone.equals(expected), `${testCase.jsonpath} clone parses correctly`);
    t.equals(
      jsonpathClone.toString(),
      testCase.canonical,
      `${testCase.jsonpath} clone normalizes correctly`
    );
  }

  t.end();
});

test('JSONPath#validation', async (t) => {
  for (const testCase of INVALID_JSONPATHS) {
    t.throws(
      () => new _JSONPath(testCase.jsonpath),
      testCase.message,
      `${testCase.jsonpath} is rejected`
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
