---
title: KML, KMZ, GPX, and TCX formats
description: Load geographic annotations, packaged maps, GPS tracks, and training activities into shared geometry data shapes.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="XML geospatial formats"
  title="Bring annotated tracks into one geometry path."
  description="KML, KMZ, GPX, and TCX use related XML foundations but describe different kinds of geographic data. loaders.gl preserves their useful metadata while returning common geometry and table shapes for applications."
  tone="orange"
  meta={['KML/KMZ annotations', 'GPX tracks and routes', 'TCX activities']}
  links={[
    {label: 'KML module', to: '/docs/modules/kml'},
    {label: 'KMLLoader', to: '/docs/modules/kml/api-reference/kml-loader'},
    {label: 'GIS category', to: '/docs/specifications/category-gis'}
  ]}
/>

<KmlDocsTabs active="format" />

<DocOrientation
  eyebrow="Geographic document path"
  title="Keep the track data useful after XML."
  description="Each format has its own document vocabulary, but the application usually needs coordinates, features, properties, and timing. The loaders normalize those common pieces without discarding source metadata."
  tone="orange"
  items={[
    {label: 'KML', value: 'Placemarks, paths, regions, styles, and Earth-browser metadata.'},
    {label: 'GPX', value: 'Tracks, routes, waypoints, and elevation/time fields.'},
    {label: 'TCX', value: 'Training activity laps, tracks, and workout metadata.'},
    {label: 'Output', value: 'GeoJSON, geometry tables, object rows, or Arrow tables.'}
  ]}
/>

<ReferenceBoundary
  title="KML, GPX, and TCX details"
  description="The reference below compares the three XML formats, loader output shapes, metadata behavior, and supported entry points."
  tone="orange"
/>

| Characteristic       | Value                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| File Formats         | [KML and KMZ](/docs/modules/kml/formats/kml), [GPX](/docs/modules/kml/formats/gpx), [TCX](/docs/modules/kml/formats/tcx) |
| Data Format          | [Geometry Tables](/docs/specifications/category-gis), GeoJSON                              |
| File Extensions      | `.kml`, `.kmz`, `.gpx`, `.tcx`                                                             |
| MIME Types           | `application/vnd.google-earth.kml+xml`, `application/vnd.google-earth.kmz`, `application/gpx+xml`, `application/vnd.garmin.tcx+xml` |
| File Type            | Text/XML                                                                                   |
| Loader APIs          | `load`, `parse`, `parseTextSync`                                                           |
| Loader Worker Thread | No                                                                                         |
| Loader Streaming     | No                                                                                         |

## Loaders

<div className="docs-api-card-grid">
  <a className="docs-api-card" href="/docs/modules/kml/api-reference/kml-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>KMLLoader</strong>
    <span>Loads Keyhole Markup Language documents as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ObjectRowTable, ArrowTable</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/kml/api-reference/gpx-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>GPXLoader</strong>
    <span>Loads GPS Exchange Format tracks, routes, and waypoints as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ObjectRowTable, ArrowTable, BinaryFeatureCollection</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
  <a className="docs-api-card" href="/docs/modules/kml/api-reference/tcx-loader">
    <span className="docs-api-card__kind">Loader</span>
    <strong>TCXLoader</strong>
    <span>Loads Training Center XML activity files as loaders.gl geometry tables.</span>
    <span className="docs-api-card__meta">Output: GeoJSONTable, ObjectRowTable, ArrowTable, BinaryFeatureCollection</span>
    <span className="docs-api-card__meta">APIs: load, parse, parseTextSync</span>
  </a>
</div>

## XML-Based Formats

KML, GPX, and TCX are XML-based geospatial interchange formats. They are text files that describe placemarks, waypoints, routes, tracks, or activities using format-specific XML elements.

## Geospatial Output

The KML module converts these documents into loaders.gl geometry table shapes for application code. The default output is an `ArrowTable`; GeoJSON and object-row tables remain available through the format-specific `shape` option.
