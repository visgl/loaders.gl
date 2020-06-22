import test from 'tape-promise/tape';
import {parseMIMEType, parseMIMETypeFromURL} from '@loaders.gl/core/lib/utils/mime-type-utils';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAGUExURf///wAAAFXC034AAAAMSURBVAjXY3BgaAAAAUQAwetZAwkAAAAASUVORK5CYII=';

test('parseMIMEType', t => {
  t.equal(parseMIMEType('image/png;'), 'image/png');
  t.equal(parseMIMEType('image/png'), 'image/png');

  t.end();
});

test('parseMIMETypeFromURL', t => {
  t.equal(parseMIMETypeFromURL(DATA_URL), 'image/png');
  t.end();
});
