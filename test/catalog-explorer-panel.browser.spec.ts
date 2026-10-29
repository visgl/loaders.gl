import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {expect, test, vi} from 'vitest';
import {
  CatalogExplorerPanel,
  type CatalogExplorerSource
} from '../website/src/components/docs/catalog-explorer-panel';

// Exercise the explorer layout without the external panels adapter's Preact dependency graph.
vi.mock('../website/src/components/docs/example-panel-host', async () => {
  const {createElement} = await import('react');
  return {
    ReactExamplePanel: ({children}: {children: React.ReactNode}) =>
      createElement('div', null, children)
  };
});

test('keeps entries and long previews bounded and clears details when the source changes', async () => {
  const source = {
    capabilities: {search: true},
    getMetadata: async () => ({root: {title: 'Fixture catalog'}}),
    search: async function* () {
      for (let index = 0; index < 25; index++) {
        yield {
          id: `entry-${index}`,
          properties: {
            model: 'EGM96',
            title: `Geoid entry-${index}`,
            description: 'A geoid snapshot'
          },
          assets: {data: {href: 'https://example.org/data.parquet'}}
        };
      }
    }
  } as unknown as CatalogExplorerSource['source'];
  const container = document.createElement('div');
  container.style.width = '800px';
  document.body.append(container);
  const root = createRoot(container);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const props = {
    sources: [{id: 'fixture', title: 'Fixture catalog', source}],
    onSelectAsset: vi.fn()
  };
  try {
    await act(async () => root.render(React.createElement(CatalogExplorerPanel, props)));
    await expect
      .poll(() => container.querySelector('[aria-label="Catalog entries"]')?.textContent)
      .toContain('entry-0');
    const explorer = container.querySelector<HTMLElement>('[aria-label="Catalog explorer"]')!;
    const entries = container.querySelector<HTMLElement>('[aria-label="Catalog entries"]')!;
    const inspector = container.querySelector<HTMLElement>('[aria-label="Catalog inspector"]')!;
    const height = explorer.getBoundingClientRect().height;
    expect(entries.scrollHeight).toBeGreaterThan(entries.clientHeight);
    expect(entries.clientHeight).toBeGreaterThan(0);
    await act(async () => entries.querySelector('button')!.click());
    await expect.poll(() => inspector.textContent).toContain('EGM96');
    expect(inspector.textContent).toContain('Geoid entry-0');
    expect(inspector.textContent).toContain('A geoid snapshot');
    await act(async () => entries.querySelectorAll('a')[1].click());
    expect(inspector.textContent).toContain('Geoid entry-1');
    expect(props.onSelectAsset).toHaveBeenCalledWith({
      key: 'data',
      href: 'https://example.org/data.parquet'
    });
    await act(async () =>
      root.render(
        React.createElement(CatalogExplorerPanel, {
          ...props,
          preview: React.createElement('div', {style: {height: 3000}}, 'Long asset preview')
        })
      )
    );
    expect(inspector.textContent).toContain('Long asset preview');
    expect(inspector.scrollHeight).toBeGreaterThan(inspector.clientHeight);
    expect(explorer.getBoundingClientRect().height).toBe(height);
    await act(async () =>
      root.render(
        React.createElement(CatalogExplorerPanel, {
          ...props,
          sources: [{...props.sources[0], source: {...source} as CatalogExplorerSource['source']}]
        })
      )
    );
    await expect
      .poll(() => inspector.querySelector('[aria-label="Catalog entry details"]'))
      .toBeNull();
    expect(inspector.textContent).toContain('Select an entry');
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
