import React, {useMemo, useState} from 'react';
import {STACSource} from '@loaders.gl/stac/stac-source';

import {CatalogExplorerPanel} from './catalog-explorer-panel';

const DEFAULT_STAC_URL = 'https://stac.overturemaps.org/catalog.json';

/** Demonstrates the catalog explorer against an arbitrary STAC catalog URL. */
export function STACCatalogLiveExample(): JSX.Element {
  const [url, setUrl] = useState(DEFAULT_STAC_URL);
  const source = useMemo(() => new STACSource(url, {}), [url]);

  return (
    <div>
      <label htmlFor="stac-catalog-url">STAC catalog URL</label>
      <input
        id="stac-catalog-url"
        style={{display: 'block', width: '100%', margin: '6px 0', padding: 7}}
        value={url}
        onChange={event => setUrl(event.target.value)}
      />
      <CatalogExplorerPanel
        sources={[{id: 'stac-source', title: 'STAC catalog', source}]}
        title="STAC catalog explorer"
      />
    </div>
  );
}

