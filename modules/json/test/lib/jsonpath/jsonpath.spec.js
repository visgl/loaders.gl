import {expect, test} from 'vitest';
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
test('JSONPath#parsing', async () => {
  for (const testCase of VALID_JSONPATHS) {
    const jsonpath = new _JSONPath(testCase.jsonpath);
    const expected = new _JSONPath(testCase.expected);
    expect(jsonpath.equals(expected), `${testCase.jsonpath} parses correctly`).toBeTruthy();
    expect(jsonpath.toString(), `${testCase.jsonpath} normalizes to ${testCase.canonical}`).toBe(
      testCase.canonical
    );
    const jsonpathCopy = new _JSONPath(jsonpath);
    expect(
      jsonpathCopy.equals(expected),
      `${testCase.jsonpath} copy parses correctly`
    ).toBeTruthy();
    expect(jsonpathCopy.toString(), `${testCase.jsonpath} copy normalizes correctly`).toBe(
      testCase.canonical
    );
    const jsonpathClone = jsonpath.clone();
    expect(
      jsonpathClone.equals(expected),
      `${testCase.jsonpath} clone parses correctly`
    ).toBeTruthy();
    expect(jsonpathClone.toString(), `${testCase.jsonpath} clone normalizes correctly`).toBe(
      testCase.canonical
    );
  }
});
test('JSONPath#validation', async () => {
  for (const testCase of INVALID_JSONPATHS) {
    expect(() => new _JSONPath(testCase.jsonpath), `${testCase.jsonpath} is rejected`).toThrow(
      testCase.message
    );
  }
});
test('JSONPath#deep set', async () => {
  const jsonpath = new _JSONPath('$.a.b');
  const deepValue = {a: {b: 1}};
  expect(jsonpath.getFieldAtPath(deepValue), 'JSONPath.getFieldAtPath').toBe(1);
  jsonpath.setFieldAtPath(deepValue, 2);
  expect(jsonpath.getFieldAtPath(deepValue), 'JSONPath.setFieldAtPath').toBe(2);
});
