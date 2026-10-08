import React, {useMemo, useState} from 'react';
import {STACSource} from '@loaders.gl/stac/stac-source';

import {CatalogExplorerPanel} from './catalog-explorer-panel';
import {CatalogAssetPreview, type CatalogPreviewAsset} from './catalog-asset-preview';
import {ReactExamplePanel} from './example-panel-host';

/** Public catalogs available from the example's preset selector. */
const STAC_CATALOG_PRESETS = [
  {
    title: 'deck.gl-data Earth',
    url: 'https://raw.githubusercontent.com/visgl/deck.gl-data/2de3d08585770105e1b84a6c0308c934fcce4878/earth/stac/catalog.json'
  },
  {title: 'Overture Maps', url: 'https://stac.overturemaps.org/catalog.json'}
];

/** Demonstrates the catalog explorer against an arbitrary STAC catalog URL. */
export function STACCatalogLiveExample(): React.JSX.Element {
  const [url, setUrl] = useState(STAC_CATALOG_PRESETS[0].url);
  const source = useMemo(() => new STACSource(url, {}), [url]);
  const [selectedAsset, setSelectedAsset] = useState<CatalogPreviewAsset>();

  return (
    <div>
      <ReactExamplePanel title="Choose a catalog">
        <div style={{padding: 14}}>
          <label htmlFor="stac-catalog-preset">Catalog preset</label>
          <select
            id="stac-catalog-preset"
            style={{display: 'block', width: '100%', margin: '6px 0', padding: 7}}
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
          <label htmlFor="stac-catalog-url">STAC catalog URL</label>
          <input
            id="stac-catalog-url"
            style={{display: 'block', width: '100%', margin: '6px 0', padding: 7}}
            value={url}
            onChange={event => {
              setUrl(event.target.value);
              setSelectedAsset(undefined);
            }}
          />
          <button type="button" onClick={() => setSelectedAsset({key: 'Catalog JSON', href: url})}>
            Preview catalog JSON
          </button>
        </div>
      </ReactExamplePanel>
      <CatalogExplorerPanel
        sources={[{id: 'stac-source', title: 'STAC catalog', source}]}
        title="STAC catalog explorer"
        onSelectAsset={setSelectedAsset}
      />
      {selectedAsset ? (
        <CatalogAssetPreview key={selectedAsset.href} asset={selectedAsset} />
      ) : null}
    </div>
  );
}
