---
title: Cloud-native geospatial formats
description: Design data access around cloud object storage, spatial selection, and portable metadata.
hide_title: true
page_style: designed
---

import {RangeRequestGraphic} from '@site/src/components/docs/range-request-graphic';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Cloud-native data access"
  title="Ask the cloud for the part of the dataset you need."
  description="Cloud-native geospatial formats combine spatial or tabular organization with ordinary object storage. Their indexes, chunks, tiles, and metadata let clients read selectively without an application server in the middle."
  tone="mint"
  meta={['Object storage', 'HTTP ranges', 'Spatial selection']}
  links={[
    {label: 'Common scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'Range requests', to: '/docs/developer-guide/using-range-requests'}
  ]}
/>

<RangeRequestGraphic />

<DocOrientation
  eyebrow="The cloud-native pattern"
  title="Index first. Range-read second. Decode only what matters."
  description="The formats differ—columnar files, tiled archives, indexed point clouds, and catalogs—but the application goal is the same: turn a remote object into a bounded, useful request."
  tone="mint"
  items={[
    {label: 'Storage', value: 'Files or archives on S3, CDN, or similar object storage'},
    {label: 'Index', value: 'Metadata identifies relevant chunks, tiles, or columns'},
    {label: 'Transport', value: 'HTTP range requests fetch selected byte spans'},
    {label: 'Output', value: 'Typed tables, rasters, features, or point batches'}
  ]}
/>

Cloud-native formats organize files, chunks, or tiles so clients can read selected
data from object storage without downloading a complete dataset.

<ReferenceBoundary
  title="Formats and access patterns"
  description="The sections below compare cloud-native characteristics, notable formats, and the catalog or object-storage layers around them."
  tone="mint"
/>

## Access patterns

| Pattern | Purpose |
| --- | --- |
| Indexed records | Identify features, points, or row groups relevant to a query. |
| Tiled or chunked storage | Fetch a subset of a raster, scene, or array. |
| HTTP range requests | Read selected byte spans when the server supports partial responses. |
| Catalog metadata | Discover assets and their bounds before opening the data. |

## Formats in loaders.gl

| Format | Access pattern | Reference |
| --- | --- | --- |
| FlatGeobuf | Indexed feature access | [FlatGeobuf](/docs/modules/flatgeobuf) |
| GeoParquet | Columnar rows with geospatial metadata | [GeoParquet](/docs/modules/parquet/formats/geoparquet) |
| COG | Tiled TIFF raster ranges | [GeoTIFF](/docs/modules/geotiff) |
| COPC | Indexed LAS/LAZ point-cloud ranges | [COPC](/docs/modules/copc) |
| PMTiles | Tile archive ranges | [PMTiles](/docs/modules/pmtiles) |
| Zarr | Chunked multidimensional arrays | [Zarr](/docs/modules/zarr) |
| STAC | Catalog and asset discovery | [STAC](/docs/modules/stac) |

Format structure alone does not guarantee selective reads. Check the source's
supported queries and the server's range/CORS behavior. See the
[range request guide](/docs/developer-guide/using-range-requests) and
[common scan architecture](/docs/developer-guide/common-scan-architecture).
