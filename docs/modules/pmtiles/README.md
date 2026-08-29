---
title: PMTiles module
description: Read tiled datasets from a single cloud-friendly PMTiles archive.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {RangeRequestGraphic} from '@site/src/components/docs/range-request-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Archive-backed tiles"
  title="One archive. The tiles the view actually needs."
  description="The PMTiles module connects a single HTTP range-readable archive to tiled data sources, so applications can request tile metadata and payloads without managing a directory of objects."
  tone="violet"
  meta={['PMTiles archives', 'HTTP ranges', 'Tiled sources']}
  links={[
    {label: 'PMTiles format', to: '/docs/modules/pmtiles/formats/pmtiles'},
    {label: 'PMTiles source', to: '/docs/modules/pmtiles/api-reference/pmtiles-source-loader'}
  ]}
/>

<RangeRequestGraphic />

<DocOrientation
  eyebrow="The archive boundary"
  title="Keep tile addressing separate from tile decoding."
  description="PMTiles provides the archive index and byte ranges. The selected payload can then be handed to the appropriate vector, raster, or scene loader."
  tone="violet"
  items={[
    {label: 'Index', value: 'Archive metadata and tile directory'},
    {label: 'Request', value: 'Tile coordinates and HTTP byte ranges'},
    {label: 'Payload', value: 'MVT, raster, or another tiled format'},
    {label: 'Runtime', value: 'Source scheduling and cache integration'}
  ]}
/>

Support for loading tiled data from [PMTiles](/docs/modules/pmtiles/formats/pmtiles) archives.

<ReferenceBoundary
  title="PMTiles sources and attribution"
  description="The sections below list the available source entry point and the underlying PMTiles library attribution."
  tone="violet"
/>

## Loaders and Writers

| Source | Description |
| ------ | ----------- |
| [`PMTilesSourceLoader`](/docs/modules/pmtiles/api-reference/pmtiles-source-loader) | Loads tiled data from PMTiles archives. |

## Attribution

This module wraps the [protomaps PMTiles library](https://github.com/protomaps/PMTiles/blob/main/LICENSE)
under BSD 3-Clause license.
