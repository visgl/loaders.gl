import React, {useMemo, useState} from 'react';
import {STACSource} from '@loaders.gl/ogc/stac-source';

import {CatalogExplorerPanel} from './catalog-explorer-panel';
import {CatalogAssetPreview, type CatalogPreviewAsset} from './catalog-asset-preview';
import styled from 'styled-components';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

/** Public catalogs available from the example's preset selector. */
const STAC_CATALOG_PRESETS = [
  {
    title: 'deck.gl-data Earth',
    url: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/earth/stac/catalog.json'
  },
  {title: 'Overture Maps', url: 'https://stac.overturemaps.org/catalog.json'}
];

/** Demonstrates the catalog explorer against an arbitrary STAC catalog URL. */
export function STACCatalogLiveExample({
  children
}: {
  /** Markdown explanation displayed separately from the catalog workspace. */
  children?: React.ReactNode;
}): React.JSX.Element {
  const [catalogTitle, setCatalogTitle] = useState('vis.gl Earth datasets');
  const [url, setUrl] = useState(STAC_CATALOG_PRESETS[0].url);
  const source = useMemo(() => new STACSource(url, {}), [url]);
  const [selectedAsset, setSelectedAsset] = useState<CatalogPreviewAsset>();

  return (
    <Tabs>
      <TabItem value="catalog" label={catalogTitle}>
        <CatalogControls aria-label="Choose a catalog">
          <label>
            Catalog preset
            <select
              id="stac-catalog-preset"
              value={STAC_CATALOG_PRESETS.some(preset => preset.url === url) ? url : ''}
              onChange={event => {
                setUrl(event.target.value);
                setSelectedAsset(undefined);
              }}
            >
              <option value="" disabled>
                Custom URL
              </option>
              {STAC_CATALOG_PRESETS.map(preset => (
                <option key={preset.url} value={preset.url}>
                  {preset.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            STAC catalog URL
            <input
              id="stac-catalog-url"
              value={url}
              onChange={event => {
                setUrl(event.target.value);
                setSelectedAsset(undefined);
              }}
            />
          </label>
          <button type="button" onClick={() => setSelectedAsset({key: 'Catalog JSON', href: url})}>
            Preview catalog JSON
          </button>
        </CatalogControls>
        <CatalogExplorerPanel
          sources={[{id: 'stac-source', title: 'STAC catalog', source}]}
          title="STAC catalog explorer"
          onCatalogTitle={setCatalogTitle}
          onSelectAsset={setSelectedAsset}
          onSelectRecord={() => setSelectedAsset(undefined)}
          preview={
            selectedAsset ? (
              <CatalogAssetPreview
                key={`${selectedAsset.href}-${selectedAsset.view || 'default'}`}
                asset={selectedAsset}
                autoScroll={false}
              />
            ) : undefined
          }
          previewAssetHref={selectedAsset?.href}
          onClosePreview={() => setSelectedAsset(undefined)}
        />
      </TabItem>
      <TabItem value="explanation" label="Explanation">
        <Explanation>{children}</Explanation>
      </TabItem>
    </Tabs>
  );
}

/** Keeps catalog selection compact above the bounded explorer workspace. */
const CatalogControls = styled.div`
  display:grid;grid-template-columns:minmax(140px,1fr) minmax(0,2fr) auto;gap:10px;
  align-items:end;padding:12px;border:1px solid var(--ifm-color-emphasis-300);border-radius:8px;
  label{display:flex;flex-direction:column;gap:4px;font-size:.78rem;min-width:0;margin:0;}
  input,select{width:100%;min-width:0;padding:6px;border:1px solid var(--ifm-color-emphasis-300);border-radius:4px;background:var(--ifm-background-color);color:inherit;}
  button{font-size:.78rem;padding:6px;}
  @media(max-width:700px){grid-template-columns:1fr auto;label:nth-child(2){grid-row:2;grid-column:1/-1;}}
`;

/** Contains documentation scrolling within the same workspace as the catalog. */
const Explanation = styled.div`height:calc(100dvh - 220px);min-height:200px;overflow:auto;overscroll-behavior:contain;`;
