import {expect, test} from 'vitest';
import {
  getUrlWithToken,
  generateTileAttributeUrls,
  generateTilesetAttributeUrls
  // @ts-expect-error
} from '@loaders.gl/i3s/lib/utils/url-utils';
import {getUrlWithoutParams} from '../../../src/lib/utils/url-utils';
test('i3s-utils#getUrlWithoutParams', async () => {
  const url = getUrlWithoutParams('http://a.b.c/x/y/z?token=efk');
  expect(url).toBe('http://a.b.c/x/y/z');
  const url2 = getUrlWithoutParams('@loaders.gl/core/test/data/url');
  expect(url2).toBe('@loaders.gl/core/test/data/url');
});
test('i3s-utils#getUrlWithToken Should return URL without token if token null', async () => {
  const url = getUrlWithToken('test', null);
  expect(url).toBeTruthy();
  expect(url).toBe('test');
});
test('i3s-utils#getUrlWithToken Should return URL with token token if token exists', async () => {
  const url = getUrlWithToken('test', '12345');
  expect(url).toBeTruthy();
  expect(url).toBe('test?token=12345');
});
test('i3s-utils#generateTileAttributeUrls Should return attribute URLs for tile', async () => {
  const tile = {
    attributeData: [{href: './attributes/f_0/0'}, {href: './attributes/f_1/0'}]
  };
  const attrUrlsStub = ['test/attributes/f_0/0', 'test/attributes/f_1/0'];
  const attributeUrls = generateTileAttributeUrls('test', tile);
  expect(attributeUrls).toBeTruthy();
  expect(attributeUrls).toEqual(attrUrlsStub);
});
test('i3s-utils#generateTilesetAttributeUrls Should return attribute URLs for tileset', async () => {
  const tileset = {
    attributeStorageInfo: [{key: 'f_0'}, {key: 'f_1'}],
    url: 'test'
  };
  const resource = '1';
  const attributeUrls = generateTilesetAttributeUrls(tileset, 'test', resource);
  const attrUrlsStub = ['test/nodes/1/attributes/f_0/0', 'test/nodes/1/attributes/f_1/0'];
  expect(attributeUrls).toBeTruthy();
  expect(attributeUrls).toEqual(attrUrlsStub);
});
