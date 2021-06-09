import test from 'tape-promise/tape';
import JSONParser from '@loaders.gl/json/lib/parser/json-parser';

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

function runTests(t, json, description, Parser) {
  const expected = JSON.parse(json);
  const message = `${JSON.stringify(json)} -> ${JSON.stringify(expected)}${
    description ? ` (${description})` : ''
  }`;
  const actual = parse(json, Parser);
  t.deepEquals(actual, expected, message);
}

for (const cases of literalCases) {
  test(`JSONParser#${cases.type} literal`, (t) => {
    for (const json of cases.cases) {
      stringLiterals.push([`quoted ${cases.type}`, `"${json}"`]);
      // Clarinet does not current support (null | boolean | number | string) as root value.
      // To work around this, we wrap the literal in an array before passing to 'runTests()'.
      // (See: https://github.com/dscape/clarinet/issues/49)
      runTests(t, `[${json}]`, 'literal', JSONParser);
    }
    t.end();
  });
}

test('JSONParser#string literal', (t) => {
  for (const [description, json] of stringLiterals) {
    // Clarinet does not current support (null | boolean | number | string) as root value.
    // To work around this, we wrap the literal in an array before passing to 'runTests(t, )'.
    // (See: https://github.com/dscape/clarinet/issues/49)
    runTests(t, `[${json}]`, description, JSONParser);
  }
  t.end();
});

test('JSONParser#array literal', (t) => {
  for (const json of arrayLiterals) {
    runTests(t, json, 'array literal', JSONParser);
  }
  t.end();
});

test('JSONParser#object literal', (t) => {
  for (const json of objectLiterals) {
    runTests(t, json, 'object literal', JSONParser);
  }
  t.end();
});
