import {expect, test} from 'vitest';
import {
  parseMIMEType,
  parseMIMETypeFromURL,
  compareMIMETypes
} from '@loaders.gl/core/lib/utils/mime-type-utils';
const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';
test('compareMIMETypes', () => {
  expect(compareMIMETypes('image/png', 'image/jpeg')).toBe(false);
  expect(compareMIMETypes('image/png', 'image/png')).toBe(true);
  expect(compareMIMETypes('image/png', 'image/PNG')).toBe(true);
});
test('parseMIMEType', () => {
  expect(parseMIMEType('image/png;')).toBe('image/png');
  expect(parseMIMEType('image/png')).toBe('image/png');
  expect(parseMIMEType('application/octet-stream;')).toBe('application/octet-stream');
  expect(parseMIMEType('text/csv;')).toBe('text/csv');
  expect(parseMIMEType('application/zip;')).toBe('application/zip');
});
test('parseMIMETypeFromURL', () => {
  expect(parseMIMETypeFromURL(DATA_URL)).toBe('image/png');
});
