---
title: KML, GPX, and TCX
description: Load geographic and fitness-tracking XML into application data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="KML module"
  title="Bring map and track files into one data path."
  description="`@loaders.gl/kml` reads KML, GPX, and TCX documents and converts their geographic content into application-ready data. The formats differ in origin, but share an XML boundary and a geospatial use case."
  tone="orange"
  meta={['KML', 'GPX', 'TCX']}
  links={[
    {label: 'KML format', to: '/docs/modules/kml/formats/kml'},
    {label: 'GPX loader', to: '/docs/modules/kml/api-reference/gpx-loader'},
    {label: 'TCX loader', to: '/docs/modules/kml/api-reference/tcx-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The geographic XML path"
  title="Read the document. Extract the track or feature data."
  description="KML carries map annotations and styling, while GPX and TCX describe tracks, routes, and activity records. The module’s loaders translate these document shapes into usable JavaScript data."
  tone="orange"
  items={[
    {label: 'KML', value: 'Map features, placemarks, and overlays'},
    {label: 'GPX', value: 'Tracks, routes, and waypoints'},
    {label: 'TCX', value: 'Fitness activity and training records'},
    {label: 'Decoder', value: 'GeoJSON-oriented document conversion'}
  ]}
/>

<ReferenceBoundary
  title="Format and loader details"
  description="The reference below covers installation, individual format pages, loader entry points, external references, and attribution."
  tone="orange"
/>

![ogc-logo](../../images/logos/ogc-logo-60.png)

The `@loaders.gl/kml` module supports the KML, GPX, and TCX formats.

KML (Keyhole Markup Language) is an XML-based file format used to display geographic data in an Earth browser such as Google Earth (originally named "Keyhole Earth Viewer"). It can be used with any 2D or 3D maps.

GPX (GPS Exchange Format) is an XML-based file format commonly used by GPS tracking software.

TCX (Training Center XML) is an XML-based file format commonly used by fitness watches or similar GPS tracking software.

References:

- [Keyhole Markup Language - Wikipedia](https://en.wikipedia.org/wiki/Keyhole_Markup_Language)
- [KML Tutorial - Google](https://developers.google.com/kml/documentation/kml_tut)
- [GPX - Wikipedia](https://en.wikipedia.org/wiki/GPS_Exchange_Format)
- [TCX - Wikipedia](https://en.wikipedia.org/wiki/Training_Center_XML)

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/kml
```

## Attribution

The three loaders use [`@tmcw/togeojson`](https://github.com/tmcw/togeojson) under the BSD-2-Clause license.
