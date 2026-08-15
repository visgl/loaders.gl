// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import {expect} from 'vitest';
import {SAXParser, SAXParserOptions} from '@loaders.gl/xml';

type TestSAXParams = {
  xml?: string | {toString(): string};
  expect: any[];
  saxOptions?: SAXParserOptions;
};

// handy way to do simple unit tests
// if the options contains an xml string, it'll be written and the parser closed.
// otherwise, it's assumed that the test will write and close.

export function testSax(options: TestSAXParams): SAXParser {
  const xml = options.xml;
  const expectedEvents = options.expect;

  let e = 0;
  function onevent(n, ev, parser) {
    // Ignore ready
    // In sax-ts the Parser is instantiated (onready) before handlers are assigned
    if (e === 0 && ev === 'ready') {
      return;
    }
    if (e >= expectedEvents.length && (ev === 'end' || ev === 'ready')) {
      return;
    }

    expect(e, `unexpected ${ev} event`).toBeLessThan(expectedEvents.length);

    const expectedEvent = expectedEvents[e];
    expect(expectedEvent, `expected event ${e} is defined`).toBeTruthy();

    expect(ev, `event ${e} name`).toBe(expectedEvent[0]);
    if (ev === 'error') {
      expect(n.message, `event ${e} error`).toBe(expectedEvent[1]);
    } else {
      expect(n, `event ${e} data`).toEqual(expectedEvent[1]);
    }
    e++;
    if (ev === 'error') {
      parser.resume();
    }
  }

  const saxEvents: SAXParserOptions = {
    ontext: onevent,
    onprocessinginstruction: onevent,
    onsgmldeclaration: onevent,
    ondoctype: onevent,
    oncomment: onevent,
    onopentagstart: onevent,
    onattribute: onevent,
    onopentag: onevent,
    onclosetag: onevent,
    onopencdata: onevent,
    oncdata: onevent,
    onclosecdata: onevent,
    onerror: onevent,
    onend: onevent,
    onready: onevent,
    onscript: onevent,
    onopennamespace: onevent,
    onclosenamespace: onevent
  };

  const parser = new SAXParser({...options.saxOptions, ...saxEvents});

  if (xml) {
    parser.write(xml).close();
  }
  return parser;
}
