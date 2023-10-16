import test from 'tape-promise/tape';
import {
  getUrlWithToken,
  generateTileAttributeUrls,
  generateTilesetAttributeUrls
  // @ts-expect-error
} from '@loaders.gl/i3s/lib/utils/url-utils';
import {getUrlWithoutParams} from '../../../src/lib/utils/url-utils';

test('i3s-utils#getUrlWithoutParams', async (t) => {
  const url = getUrlWithoutParams('http://a.b.c/x/y/z?token=efk');
  t.equal(url, 'http://a.b.c/x/y/z');

  const url2 = getUrlWithoutParams('@loaders.gl/core/test/data/url');
  t.equal(url2, '@loaders.gl/core/test/data/url');
  t.end();
});

test('i3s-utils#getUrlWithToken Should return URL without token if token null', async (t) => {
  const url = getUrlWithToken('test', null);

  t.ok(url);
  t.equal(url, 'test');
  t.end();
});

test('i3s-utils#getUrlWithToken Should return URL with token token if token exists', async (t) => {
  const url = getUrlWithToken('test', '12345');

  t.ok(url);
  t.equal(url, 'test?token=12345');
  t.end();
});

test('i3s-utils#generateTileAttributeUrls Should return attribute URLs for tile', async (t) => {
  const tile = {
    attributeData: [{href: './attributes/f_0/0'}, {href: './attributes/f_1/0'}]
  };
  const attrUrlsStub = ['test/attributes/f_0/0', 'test/attributes/f_1/0'];
  const attributeUrls = generateTileAttributeUrls('test', tile);

  t.ok(attributeUrls);
  t.deepEqual(attributeUrls, attrUrlsStub);
  t.end();
});

test('i3s-utils#generateTilesetAttributeUrls Should return attribute URLs for tileset', async (t) => {
  const tileset = {
    attributeStorageInfo: [{key: 'f_0'}, {key: 'f_1'}],
    url: 'test'
  };
  const resource = '1';
  const attributeUrls = generateTilesetAttributeUrls(tileset, 'test', resource);
  const attrUrlsStub = ['test/nodes/1/attributes/f_0/0', 'test/nodes/1/attributes/f_1/0'];

  t.ok(attributeUrls);
  t.deepEqual(attributeUrls, attrUrlsStub);
  t.end();
});
