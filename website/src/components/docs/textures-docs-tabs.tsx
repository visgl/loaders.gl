import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type TexturesDocsTab = {
  /** Stable tab identifier. */
  id: TexturesDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Texture documentation tab identifiers. */
export type TexturesDocsTabId =
  | 'overview'
  | 'compressed-textures'
  | 'basis'
  | 'crunch'
  | 'dds'
  | 'hdr'
  | 'ktx'
  | 'pvr'
  | 'basisloader'
  | 'compressedtextureloader'
  | 'crunchloader'
  | 'radiancehdrloader'
  | 'compressedtexturewriter'
  | 'ktx2basiswriter';

const TEXTURES_TABS = {
  overview: {id: 'overview', label: 'Overview', href: '/docs/modules/textures'},
  compressedTextures: {
    id: 'compressed-textures',
    label: 'Compressed Textures',
    href: '/docs/modules/textures/formats/compressed-textures'
  },
  basis: {id: 'basis', label: 'Basis', href: '/docs/modules/textures/formats/basis'},
  crunch: {id: 'crunch', label: 'Crunch', href: '/docs/modules/textures/formats/crunch'},
  dds: {id: 'dds', label: 'DDS', href: '/docs/modules/textures/formats/dds'},
  hdr: {id: 'hdr', label: 'HDR', href: '/docs/modules/textures/formats/hdr'},
  ktx: {id: 'ktx', label: 'KTX', href: '/docs/modules/textures/formats/ktx'},
  pvr: {id: 'pvr', label: 'PVR', href: '/docs/modules/textures/formats/pvr'},
  basisLoader: {
    id: 'basisloader',
    label: 'BasisLoader',
    href: '/docs/modules/textures/api-reference/basis-loader'
  },
  compressedTextureLoader: {
    id: 'compressedtextureloader',
    label: 'CompressedTextureLoader',
    href: '/docs/modules/textures/api-reference/compressed-texture-loader'
  },
  crunchLoader: {
    id: 'crunchloader',
    label: 'CrunchWorkerLoader',
    href: '/docs/modules/textures/api-reference/crunch-loader'
  },
  radianceHdrLoader: {
    id: 'radiancehdrloader',
    label: 'RadianceHDRLoader',
    href: '/docs/modules/textures/api-reference/radiance-hdr-loader'
  },
  compressedTextureWriter: {
    id: 'compressedtexturewriter',
    label: 'CompressedTextureWriter',
    href: '/docs/modules/textures/api-reference/compressed-texture-writer'
  },
  ktx2BasisWriter: {
    id: 'ktx2basiswriter',
    label: 'KTX2BasisWriter',
    href: '/docs/modules/textures/api-reference/ktx2-basis-texture-writer'
  }
} satisfies Record<string, TexturesDocsTab>;

const TEXTURES_TAB_GROUPS: Record<string, TexturesDocsTab[]> = {
  overview: [TEXTURES_TABS.overview],
  compressed: [
    TEXTURES_TABS.compressedTextures,
    TEXTURES_TABS.compressedTextureLoader,
    TEXTURES_TABS.compressedTextureWriter
  ],
  basis: [TEXTURES_TABS.basis, TEXTURES_TABS.basisLoader, TEXTURES_TABS.ktx2BasisWriter],
  crunch: [TEXTURES_TABS.crunch, TEXTURES_TABS.crunchLoader],
  dds: [TEXTURES_TABS.dds, TEXTURES_TABS.compressedTextureLoader],
  hdr: [TEXTURES_TABS.hdr, TEXTURES_TABS.radianceHdrLoader],
  ktx: [
    TEXTURES_TABS.ktx,
    TEXTURES_TABS.compressedTextureLoader,
    TEXTURES_TABS.basisLoader,
    TEXTURES_TABS.ktx2BasisWriter
  ],
  pvr: [TEXTURES_TABS.pvr, TEXTURES_TABS.compressedTextureLoader]
};

function getTextureTabs(active: TexturesDocsTabId): TexturesDocsTab[] {
  if (active === 'overview') {
    return TEXTURES_TAB_GROUPS.overview;
  }
  if (
    active === 'compressed-textures' ||
    active === 'compressedtextureloader' ||
    active === 'compressedtexturewriter'
  ) {
    return TEXTURES_TAB_GROUPS.compressed;
  }
  if (active === 'basis' || active === 'basisloader' || active === 'ktx2basiswriter') {
    return TEXTURES_TAB_GROUPS.basis;
  }
  if (active === 'crunch' || active === 'crunchloader') {
    return TEXTURES_TAB_GROUPS.crunch;
  }
  if (active === 'dds') {
    return TEXTURES_TAB_GROUPS.dds;
  }
  if (active === 'hdr' || active === 'radiancehdrloader') {
    return TEXTURES_TAB_GROUPS.hdr;
  }
  if (active === 'ktx') {
    return TEXTURES_TAB_GROUPS.ktx;
  }
  return TEXTURES_TAB_GROUPS.pvr;
}

/**
 * Renders page links with the same visual treatment as tabs for texture documentation pages.
 */
export function TexturesDocsTabs({
  active
}: {
  /** Active tab identifier. */
  active: TexturesDocsTabId;
}): ReactNode {
  const tabs = getTextureTabs(active);

  return (
    <nav className="docs-page-tabs" aria-label="Texture documentation sections">
      {tabs.map(tab => (
        <Link
          key={tab.id}
          className={
            tab.id === active
              ? 'docs-page-tabs__tab docs-page-tabs__tab--active'
              : 'docs-page-tabs__tab'
          }
          to={tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
