// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
// Forked from sax-ts & sax under ISC license

import test from 'tape-promise/tape';
import {SAXParser} from '@loaders.gl/xml';

function testPosition(t, chunks, expectedEvents) {
  const parser = new SAXParser();
  expectedEvents.forEach((expectation) => {
    parser[`on${expectation[0]}`] = function () {
      for (const prop in expectation[1]) {
        t.equal(parser[prop], expectation[1][prop]);
      }
    };
  });
  chunks.forEach((chunk) => {
    parser.write(chunk);
  });
}

test('SAXParser#parser-position', (t) => {
  testPosition(
    t,
    ['<div>abcdefgh</div>'],
    [
      ['opentagstart', {position: 5, startTagPosition: 1}],
      ['opentag', {position: 5, startTagPosition: 1}],
      ['text', {position: 19, startTagPosition: 14}],
      ['closetag', {position: 19, startTagPosition: 14}]
    ]
  );

  testPosition(
    t,
    ['<div>abcde', 'fgh</div>'],
    [
      ['opentagstart', {position: 5, startTagPosition: 1}],
      ['opentag', {position: 5, startTagPosition: 1}],
      ['text', {position: 19, startTagPosition: 14}],
      ['closetag', {position: 19, startTagPosition: 14}]
    ]
  );

  t.end();
});
