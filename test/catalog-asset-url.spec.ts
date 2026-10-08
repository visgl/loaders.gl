import {expect, test} from 'vitest';
import {getCatalogAssetUrl} from '../website/src/components/docs/catalog-asset-url';

test.each([
  'https://example.org/data.json',
  'http://127.0.0.1:3001/data.parquet'
])('permits HTTP(S) assets: %s', href => {
  expect(getCatalogAssetUrl(href)?.href).toBe(href);
});

test.each([
  'javascript:alert(1)',
  'java\nscript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'file:///tmp/data.json',
  'blob:https://example.org/id',
  '/relative.json',
  'invalid'
])('rejects unsupported asset URLs: %s', href => {
  expect(getCatalogAssetUrl(href)).toBeUndefined();
});
