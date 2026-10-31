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
      createElement('div', null, children),
    ReactExampleSidebar: ({open, children}: {open: boolean; children: React.ReactNode}) =>
      open
        ? createElement(
            'div',
            {style: {position: 'absolute', inset: 0, pointerEvents: 'none'}},
            children
          )
        : null
  };
});

test('keeps entries and long previews bounded and clears details when the source changes', async () => {
  const source = {
    capabilities: {search: true, collections: true},
    getMetadata: async () => ({mode: 'static', root: {title: 'Fixture catalog'}}),
    getCollections: async () => [
      {
        id: 'fixture-collection',
        title: 'Alpine glacier reconstruction',
        description: 'Native ice-sheet model grids.'
      }
    ],
    search: async function* () {
      for (let index = 0; index < 25; index++) {
        yield {
          id: `entry-${index}`,
          collection: index === 4 ? 'fixture-collection' : undefined,
          properties: {
            model: 'EGM96',
            title:
              index === 4
                ? undefined
                : index === 5
                  ? 'CC-BY-4.0 entry-5'
                  : index === 6
                    ? 'CC0'
                    : index === 1 || index === 2
                      ? `entry-${index}`
                      : index === 3
                        ? 'CC0 Geoid entry-3'
                        : `Geoid entry-${index}`,
            description:
              index === 4
                ? undefined
                : index === 5
                  ? 'License-prefixed title fallback. Full description.'
                  : index === 6
                    ? 'License-only title fallback. Full description.'
                    : index === 1
                      ? 'CC-BY-4.0 Human-readable geoid preview. Heights are meters.'
                      : index === 2
                        ? 'Public-domain NGA geoid grid. Heights are meters.'
                        : 'A geoid snapshot'
          },
          assets: {
            data: {href: 'https://example.org/data.parquet'},
            manifest: {href: 'https://example.org/manifest.json'},
            attribution: {href: 'https://example.org/ATTRIBUTION.md'},
            grid: {href: 'https://example.org/grid.pgm'}
          }
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
    onCatalogTitle: vi.fn(),
    onSelectAsset: vi.fn()
  };
  try {
    await act(async () => root.render(React.createElement(CatalogExplorerPanel, props)));
    await expect
      .poll(() => container.querySelector('[aria-label="Catalog entries"]')?.textContent)
      .toContain('entry-0');
    const explorer = container.querySelector<HTMLElement>('[aria-label="Catalog explorer"]')!;
    const entries = container.querySelector<HTMLElement>('[aria-label="Catalog entries"]')!;
    expect(props.onCatalogTitle).toHaveBeenCalledWith('Fixture catalog');
    expect(explorer.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    const height = explorer.getBoundingClientRect().height;
    const fullListWidth = entries.getBoundingClientRect().width;
    expect(container.querySelector('[aria-label="Catalog inspector"]')).toBeNull();
    await expect.poll(() => entries.textContent).toContain('Alpine glacier reconstruction');
    expect(entries.textContent).toContain('Native ice-sheet model grids.');
    expect(entries.scrollHeight).toBeGreaterThan(entries.clientHeight);
    expect(entries.clientHeight).toBeGreaterThan(0);
    await act(async () => entries.querySelector('button')!.click());
    const inspector = container.querySelector<HTMLElement>('[aria-label="Catalog inspector"]')!;
    expect(entries.getBoundingClientRect().width).toBeLessThan(fullListWidth);
    await expect.poll(() => inspector.textContent).toContain('EGM96');
    expect(inspector.textContent).toContain('Geoid entry-0');
    expect(inspector.textContent).toContain('A geoid snapshot');
    expect(entries.querySelectorAll('a')).toHaveLength(0);
    expect(entries.textContent).toContain('Human-readable geoid preview');
    expect(entries.textContent).toContain('NGA geoid grid');
    expect(entries.querySelectorAll('button')[5].firstElementChild?.textContent).toBe(
      'License-prefixed title fallback'
    );
    expect(entries.querySelectorAll('button')[6].firstElementChild?.textContent).toBe(
      'License-only title fallback'
    );
    expect(entries.textContent).not.toContain('CC-BY-4.0');
    expect(entries.textContent).not.toContain('Public-domain');
    expect(entries.textContent).not.toContain('CC0');
    await act(async () => entries.querySelectorAll('button')[1].click());
    expect(inspector.textContent).toContain('Human-readable geoid preview');
    expect(inspector.textContent).toContain('CC-BY-4.0 Human-readable geoid preview');
    expect(inspector.querySelector('strong')?.textContent).toBe('Human-readable geoid preview');
    const tabs = Array.from(inspector.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
    expect(tabs.map(tab => tab.textContent)).toEqual([
      'Details',
      'Map',
      'Table',
      'Manifest',
      'Attribution'
    ]);
    await act(async () =>
      tabs[0].dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowRight', bubbles: true}))
    );
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(props.onSelectAsset).toHaveBeenCalledWith({
      key: 'data',
      href: 'https://example.org/data.parquet',
      view: 'map'
    });
    await act(async () => tabs[2].click());
    expect(tabs[1].getAttribute('aria-selected')).toBe('false');
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(props.onSelectAsset).toHaveBeenLastCalledWith({
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
          previewAssetHref: 'https://example.org/catalog.json',
          preview: React.createElement('div', null, 'Catalog JSON preview')
        })
      )
    );
    expect(inspector.textContent).toContain('Catalog JSON preview');
    expect(inspector.querySelector('[role="tablist"]')).toBeNull();
    await act(async () =>
      root.render(
        React.createElement(CatalogExplorerPanel, {
          ...props,
          sources: [{...props.sources[0], source: {...source} as CatalogExplorerSource['source']}]
        })
      )
    );
    await expect.poll(() => container.querySelector('[aria-label="Catalog inspector"]')).toBeNull();
    expect(entries.getBoundingClientRect().width).toBe(fullListWidth);
    const onClosePreview = vi.fn();
    await act(async () =>
      root.render(
        React.createElement(CatalogExplorerPanel, {
          ...props,
          previewAssetHref: 'https://example.org/catalog.json',
          preview: React.createElement('div', null, 'Catalog JSON preview'),
          onClosePreview
        })
      )
    );
    const standaloneInspector = container.querySelector<HTMLElement>(
      '[aria-label="Catalog inspector"]'
    )!;
    expect(standaloneInspector.querySelector('button')?.textContent).toBe('Close preview');
    expect(standaloneInspector.textContent).not.toContain('Back to entry details');
    await act(async () => standaloneInspector.querySelector('button')!.click());
    expect(onClosePreview).toHaveBeenCalledOnce();
  } finally {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
