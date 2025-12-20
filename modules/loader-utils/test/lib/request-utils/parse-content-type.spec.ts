import test from 'tape-promise/tape';
import {parseContentType} from '@loaders.gl/loader-utils';

test('parseContentType', (t) => {
  t.equal(parseContentType(null), null, 'returns null for null header');
  t.equal(parseContentType(''), null, 'returns null for empty header');
  t.equal(
    parseContentType('text/html; charset=utf-8'),
    'text/html',
    'strips charset'
  );
  t.equal(parseContentType(' Application/JSON '), 'application/json', 'normalizes case');
  t.end();
});
