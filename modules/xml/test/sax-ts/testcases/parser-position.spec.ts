// SPDX-License-Identifier: ISC

import {expect, test} from 'vitest';
import {SAXParser} from '@loaders.gl/xml';

function testPosition(chunks, expectedEvents) {
  const parser = new SAXParser();
  expectedEvents.forEach(expectation => {
    parser[`on${expectation[0]}`] = function () {
      for (const prop in expectation[1]) {
        expect(parser[prop]).toBe(expectation[1][prop]);
      }
    };
  });
  chunks.forEach(chunk => {
    parser.write(chunk);
  });
}
test('SAXParser#parser-position', () => {
  testPosition(
    ['<div>abcdefgh</div>'],
    [
      ['opentagstart', {position: 5, startTagPosition: 1}],
      ['opentag', {position: 5, startTagPosition: 1}],
      ['text', {position: 19, startTagPosition: 14}],
      ['closetag', {position: 19, startTagPosition: 14}]
    ]
  );
  testPosition(
    ['<div>abcde', 'fgh</div>'],
    [
      ['opentagstart', {position: 5, startTagPosition: 1}],
      ['opentag', {position: 5, startTagPosition: 1}],
      ['text', {position: 19, startTagPosition: 14}],
      ['closetag', {position: 19, startTagPosition: 14}]
    ]
  );
});
