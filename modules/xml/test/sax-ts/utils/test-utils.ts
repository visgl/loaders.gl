// loaders.gl, MIT license
// Forked from sax-ts & sax under ISC license

import type {Test} from 'tape-promise/tape';
import {SAXParser, SAXParserOptions} from '@loaders.gl/xml';

type TestSAXParams = {
  xml?: string | Buffer;
  expect: any[];
  saxOptions?: SAXParserOptions;
};

// handy way to do simple unit tests
// if the options contains an xml string, it'll be written and the parser closed.
// otherwise, it's assumed that the test will write and close.

export function testSax(t: Test, options: TestSAXParams): SAXParser {
  const xml = options.xml;
  const expect = options.expect;

  let e = 0;
  function onevent(n, ev, parser) {
    t.comment(`event on${ev} (vs ${expect[e]})`);

    // Ignore ready
    // In sax-ts the Parser is instantiated (onready) before handlers are assigned
    if (e === 0 && ev === 'ready') {
      return;
    }
    if (e >= expect.length && (ev === 'end' || ev === 'ready')) {
      return;
    }

    t.ok(e < expect.length, 'no unexpected events');

    if (!expect[e]) {
      t.fail('did not expect this event');
      // , {
      //   event: ev,
      //   expect: expect,
      //   data: n,
      // });
      return;
    }

    t.equal(ev, expect[e][0], expect[e][0]);
    if (ev === 'error') {
      t.equal(n.message, expect[e][1], expect[e][1]);
    } else {
      t.deepEqual(n, expect[e][1], expect[e][1]);
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
