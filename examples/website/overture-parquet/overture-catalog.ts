// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {STACSource} from '@loaders.gl/stac/stac-source';
import type {
  STACCatalog,
  STACCollection,
  STACItem,
  STACLink
} from '@loaders.gl/stac';
import type {
  ParquetDatasetFile,
  ParquetDatasetFileQuery
} from '@loaders.gl/parquet/parquet-dataset-source';

const OVERTURE_STAC_ROOT = 'https://stac.overturemaps.org/catalog.json';
const PARQUET_MEDIA_TYPE = 'application/vnd.apache.parquet';

/** Resolved Overture release metadata used by the example panel and file provider. */
export type OvertureRelease = {
  /** Release identifier published by the Overture STAC root. */
  id: string;
  /** STAC Collection containing partitioned place assets. */
  collectionSource: STACSource;
};

/**
 * Small Overture-specific adapter that turns the public STAC hierarchy into dataset descriptors.
 */
export class OverturePlacesCatalog {
  /** Cached latest release and place Collection discovery. */
  private releasePromise: Promise<OvertureRelease> | null = null;

  /** Returns current release metadata, retrying discovery after a failed request. */
  getRelease(signal?: AbortSignal): Promise<OvertureRelease> {
    if (!this.releasePromise) {
      const releasePromise = this.discoverRelease(signal).catch(error => {
        if (this.releasePromise === releasePromise) {
          this.releasePromise = null;
        }
        throw error;
      });
      this.releasePromise = releasePromise;
    }
    return this.releasePromise;
  }

  /** Yields AWS HTTPS GeoParquet assets whose STAC Item extents intersect the query. */
  async *getFiles(query: ParquetDatasetFileQuery): AsyncIterable<ParquetDatasetFile> {
    const release = await this.getRelease(query.signal);
    for await (const item of release.collectionSource.traverse({
      bbox: query.bbox,
      signal: query.signal,
      maxDepth: 1,
      maxRequests: 32
    })) {
      const asset = getPreferredParquetAsset(release.collectionSource, item);
      if (!asset) {
        continue;
      }
      yield {
        id: `${release.id}/places/place/${item.id}`,
        data: asset.href,
        bbox: item.bbox,
        partitions: {release: release.id, theme: 'places', type: 'place'},
        metadata: {
          stacItemId: item.id,
          rowCount: item.properties.num_rows,
          assetKey: asset.key
        }
      };
    }
  }

  /** Resolves root → latest release → places theme → place Collection without crawling history. */
  private async discoverRelease(signal?: AbortSignal): Promise<OvertureRelease> {
    const rootSource = new STACSource(OVERTURE_STAC_ROOT, {});
    const root = await rootSource.getRoot({signal});
    const releaseLink = getLatestReleaseLink(root);
    const releaseSource = new STACSource(releaseLink.href, {});
    const releaseCatalog = await releaseSource.getRoot({signal});
    const placesLink = getChildLink(releaseCatalog, 'places');
    const placesSource = new STACSource(placesLink.href, {});
    const placesCatalog = await placesSource.getRoot({signal});
    const collectionLink = getChildLink(placesCatalog, 'place');
    return {
      id: getReleaseId(root, releaseCatalog, releaseLink),
      collectionSource: new STACSource(collectionLink.href, {})
    };
  }
}

/** Selects the CORS-enabled AWS HTTPS asset from one Overture Item. */
function getPreferredParquetAsset(source: STACSource, item: STACItem) {
  const assets = source.getAssets(item, {
    roles: ['data'],
    mediaTypes: [PARQUET_MEDIA_TYPE]
  });
  return assets.find(asset => asset.key === 'aws') || assets[0];
}

/** Finds the explicitly latest release link published by the Overture root. */
function getLatestReleaseLink(root: STACCatalog | STACCollection): STACLink {
  const latestId = typeof root.latest === 'string' ? root.latest : undefined;
  const link = root.links.find(
    candidate =>
      candidate.rel === 'child' &&
      (candidate.latest === true || Boolean(latestId && candidate.href.includes(`/${latestId}/`)))
  );
  if (!link) {
    throw new Error('Overture STAC root did not publish a latest release link');
  }
  return link;
}

/** Finds one named child link without traversing unrelated catalog branches. */
function getChildLink(catalog: STACCatalog | STACCollection, id: string): STACLink {
  const link = catalog.links.find(
    candidate =>
      candidate.rel === 'child' &&
      (candidate.title === id || candidate.href.includes(`/${id}/`))
  );
  if (!link) {
    throw new Error(`Overture STAC catalog did not publish its ${id} child`);
  }
  return link;
}

/** Determines the release identifier from STAC extension fields and links. */
function getReleaseId(
  root: STACCatalog | STACCollection,
  release: STACCatalog | STACCollection,
  releaseLink: STACLink
): string {
  if (typeof release['release:version'] === 'string') {
    return release['release:version'];
  }
  if (typeof root.latest === 'string') {
    return root.latest;
  }
  return release.id || releaseLink.title || 'latest';
}
