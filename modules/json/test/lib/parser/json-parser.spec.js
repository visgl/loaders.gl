import {expect, test} from 'vitest';
import JSONParser from '../../../src/lib/json-parser/json-parser';
// tslint:disable:object-literal-sort-keys
const literalCases = [
  {type: 'null', cases: ['null']},
  {type: 'boolean', cases: ['true', 'false']},
  {type: 'integer', cases: ['0', '9007199254740991', '-9007199254740991']},
  {
    type: 'real',
    cases: [
      '1E1',
      '0.1e1',
      '1e-1',
      '1e+00',
      JSON.stringify(Number.MAX_VALUE),
      JSON.stringify(Number.MIN_VALUE)
    ]
  }
];
// tslint:enable:object-literal-sort-keys
const stringLiterals = [
  ['empty', JSON.stringify('')],
  ['space', JSON.stringify(' ')],
  ['quote', JSON.stringify('"')],
  ['backslash', JSON.stringify('\\')],
  ['slash', '"/ & \\/"'],
  ['control', JSON.stringify('\b\f\n\r\t')],
  ['unicode', JSON.stringify('\u0022')],
  ['non-unicode', JSON.stringify('&#34; %22 0x22 034 &#x22;')],
  ['surrogate', '"😀"']
];
const arrayLiterals = ['[]', '[null]', '[true, false]', '[0,1, 2,  3,\n4]', '[["2 deep"]]'];
const objectLiterals = ['{}', '\n {\n "\\b"\n :\n""\n }\n ', '{"":""}', '{"1":{"2":"deep"}}'];
const parse = (json, Parser) => {
  const parser = new Parser();
  parser.write(json);
  parser.close();
  return parser.result;
};
function runTests(json, description, Parser) {
  const expected = JSON.parse(json);
  const message = `${JSON.stringify(json)} -> ${JSON.stringify(expected)}${description ? ` (${description})` : ''}`;
  const actual = parse(json, Parser);
  expect(actual, message).toEqual(expected);
}
for (const cases of literalCases) {
  test(`JSONParser#${cases.type} literal`, () => {
    for (const json of cases.cases) {
      stringLiterals.push([`quoted ${cases.type}`, `"${json}"`]);
      // Clarinet does not current support (null | boolean | number | string) as root value.
      // To work around this, we wrap the literal in an array before passing to 'runTests()'.
      // (See: https://github.com/dscape/clarinet/issues/49)
      runTests(`[${json}]`, 'literal', JSONParser);
    }
  });
}
test('JSONParser#string literal', () => {
  for (const [description, json] of stringLiterals) {
    // Clarinet does not current support (null | boolean | number | string) as root value.
    // To work around this, we wrap the literal in an array before passing to 'runTests(t, )'.
    // (See: https://github.com/dscape/clarinet/issues/49)
    runTests(`[${json}]`, description, JSONParser);
  }
});
test('JSONParser#array literal', () => {
  for (const json of arrayLiterals) {
    runTests(json, 'array literal', JSONParser);
  }
});
test('JSONParser#object literal', () => {
  for (const json of objectLiterals) {
    runTests(json, 'object literal', JSONParser);
  }
});
