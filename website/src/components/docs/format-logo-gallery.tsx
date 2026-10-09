import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import {FORMAT_METADATA, FormatLogo, type FormatMetadata, type FormatTag} from './format-logo';
import styles from './format-logo-gallery.module.css';

type FormatFilter = 'all' | FormatTag;

type SidebarCategory = {
  readonly label?: string;
  readonly type?: string;
  readonly items?: readonly string[];
};

const docsSidebar = require('../../../../docs/docs-sidebar.json') as readonly SidebarCategory[];

const FILTERS: ReadonlyArray<{readonly label: string; readonly value: FormatFilter}> = [
  {label: 'All', value: 'all'},
  {label: 'Tables', value: 'tables'},
  {label: 'Geospatial', value: 'geospatial'},
  {label: 'Services', value: 'services'},
  {label: 'Textures', value: 'textures'},
  {label: 'Pointclouds', value: 'pointclouds'},
  {label: 'Meshes', value: 'meshes'}
];

/** Returns the gallery entries in the sidebar's Formats and Services order. */
function getFormatGallery(): Array<FormatMetadata & {path: string}> {
  const metadataBySlug = new Map(FORMAT_METADATA.map(format => [format.slug, format]));
  const seenSlugs = new Set<string>();
  const categories = docsSidebar.filter(
    category => category.type === 'category' && (category.label === 'Formats' || category.label === 'Services')
  );

  return categories.flatMap(category =>
    (category.items ?? []).flatMap(path => {
      const slug = path.split('/').pop() ?? path;
      const metadata = metadataBySlug.get(slug);
      if (seenSlugs.has(slug)) {
        return [];
      }
      if (!metadata && !path.endsWith('/README') && !path.includes('developer-guide/') && !path.includes('api-reference/')) {
        throw new Error(`Missing format gallery metadata for sidebar entry: ${path}`);
      }
      if (!metadata) {
        return [];
      }
      seenSlugs.add(slug);
      return [{...metadata, path}];
    })
  );
}

const FORMAT_GALLERY = getFormatGallery();

/** Renders the filterable format logo gallery on the documentation home page. */
export function FormatLogoGallery() {
  const [selectedFilter, setSelectedFilter] = useState<FormatFilter>('all');
  const visibleFormats = FORMAT_GALLERY.filter(
    format => selectedFilter === 'all' || format.tags.includes(selectedFilter)
  );

  return (
    <section className={styles.gallery}>
      <p>
        loaders.gl supports tabular, geospatial, 3D, texture, archive, and interchange formats.
        Official project logos are used where available. Other formats use simple name badges;
        OGC standards pair the OGC mark with the format name.
      </p>
      <div className={styles.tabList} aria-label="Format filters" role="tablist">
        {FILTERS.map(filter => (
          <button
            className={`${styles.tab} ${selectedFilter === filter.value ? styles.tabSelected : ''}`}
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={selectedFilter === filter.value}
            onClick={() => setSelectedFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {visibleFormats.map(format => (
          <Link className={styles.card} key={format.slug} to={`/docs/${format.path}`} title={format.label}>
            <FormatLogo slug={format.slug} />
            <span className={styles.label}>{format.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
