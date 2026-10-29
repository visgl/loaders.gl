import React, {act} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {afterEach, beforeEach, expect, test, vi} from 'vitest';
import {CatalogJsonTree} from '../website/src/components/docs/catalog-json-tree';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

test('expands nested metadata lazily and preserves complete long strings', async () => {
  const longValue = 'provenance '.repeat(30);
  await act(async () =>
    root.render(
      React.createElement(CatalogJsonTree, {
        label: 'Metadata',
        value: {geoid: {model: 'EGM96', source: longValue, toString: 'custom metadata'}}
      })
    )
  );
  expect(container.querySelectorAll('details')).toHaveLength(1);
  expect(container.textContent).not.toContain('EGM96');
  await act(async () => container.querySelector('summary')!.click());
  await expect.poll(() => container.querySelectorAll('details').length).toBe(2);
  expect(container.textContent).not.toContain('EGM96');
  await act(async () => container.querySelectorAll('summary')[1].click());
  await expect.poll(() => container.textContent).toContain('EGM96');
  expect(container.querySelector('pre')).toBeNull();
  await act(async () => container.querySelectorAll('summary')[2].click());
  await expect.poll(() => container.querySelector('pre')?.textContent).toBe(longValue);
  await act(async () => container.querySelector('summary')!.click());
  await expect.poll(() => container.querySelectorAll('details').length).toBe(1);
});

test('pages large arrays instead of mounting every child at once', async () => {
  await act(async () =>
    root.render(
      React.createElement(CatalogJsonTree, {
        label: 'Rows',
        value: Array.from({length: 150}, (_, index) => `row-${index}`)
      })
    )
  );
  await act(async () => container.querySelector('summary')!.click());
  await expect
    .poll(() => container.querySelector('button')?.textContent)
    .toBe('Show next 50 entries');
  expect(container.textContent).not.toContain('row-149');
  await act(async () => container.querySelector('button')!.click());
  expect(container.textContent).toContain('row-149');
  expect(container.querySelector('button')).toBeNull();
});
