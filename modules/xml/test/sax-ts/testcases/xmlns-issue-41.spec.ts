// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

/* TODO - NOT PORTED TO LOADERS.GL
const t = require(__dirname);

// should be the same both ways.
const xmls = [
  '<parent xmlns:a="http://ATTRIBUTE" a:attr="value" />',
  '<parent a:attr="value" xmlns:a="http://ATTRIBUTE" />',
];

const ex1 = [
  ['opentagstart', {name: 'parent', attributes: {}, ns: {}}],
  [
    'opennamespace',
    {
      prefix: 'a',
      uri: 'http://ATTRIBUTE',
    },
  ],
  [
    'attribute',
    {
      name: 'xmlns:a',
      value: 'http://ATTRIBUTE',
      prefix: 'xmlns',
      local: 'a',
      uri: 'http://www.w3.org/2000/xmlns/',
    },
  ],
  [
    'attribute',
    {
      name: 'a:attr',
      local: 'attr',
      prefix: 'a',
      uri: 'http://ATTRIBUTE',
      value: 'value',
    },
  ],
  [
    'opentag',
    {
      name: 'parent',
      uri: '',
      prefix: '',
      local: 'parent',
      attributes: {
        'a:attr': {
          name: 'a:attr',
          local: 'attr',
          prefix: 'a',
          uri: 'http://ATTRIBUTE',
          value: 'value',
        },
        'xmlns:a': {
          name: 'xmlns:a',
          local: 'a',
          prefix: 'xmlns',
          uri: 'http://www.w3.org/2000/xmlns/',
          value: 'http://ATTRIBUTE',
        },
      },
      ns: {
        a: 'http://ATTRIBUTE',
      },
      isSelfClosing: true,
    },
  ],
  ['closetag', 'parent'],
  [
    'closenamespace',
    {
      prefix: 'a',
      uri: 'http://ATTRIBUTE',
    },
  ],
];

// swap the order of elements 2 and 3
const ex2 = [ex1[0], ex1[1], ex1[3], ex1[2]].concat(ex1.slice(4));
const expected = [ex1, ex2];

xmls.forEach((x, i) => {
  t.test({
    xml: x,
    expect: expected[i],
    saxOptions: {
      strict: true,
      xmlns: true,
    },
  });
});
*/
