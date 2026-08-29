---
title: GPX format
description: A portable XML format for GPS waypoints, routes, and tracks.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="GPS exchange format"
  title="Carry tracks and waypoints between GPS tools."
  description="GPX is a focused XML format for exchanging routes, tracks, and waypoints. loaders.gl turns those records into geometry tables that can move into mapping, analysis, or Arrow-based pipelines."
  tone="mint"
  meta={['GPX 1.1', 'XML-based', 'Track data']}
  links={[
    {label: 'KML module', to: '/docs/modules/kml'},
    {label: 'GPXLoader', to: '/docs/modules/kml/api-reference/gpx-loader'}
  ]}
/>

<KmlDocsTabs active="gpx" />

<DocOrientation
  eyebrow="The GPX document"
  title="A small vocabulary for movement data."
  description="GPX keeps the model intentionally simple: named points, ordered tracks, and routes made from points. Extensions can carry useful metadata such as elevation, time, and heart rate."
  tone="mint"
  items={[
    {label: 'Waypoints', value: 'Named places or points of interest'},
    {label: 'Tracks', value: 'Recorded sequences of positions'},
    {label: 'Routes', value: 'Planned sequences of route points'},
    {label: 'Extensions', value: 'Activity and device-specific metadata'}
  ]}
/>

- [GPX - Wikipedia](https://en.wikipedia.org/wiki/GPS_Exchange_Format)

<ReferenceBoundary
  title="GPX format details"
  description="The notes below introduce the GPX schema and its role as an interchange format."
  tone="mint"
/>

GPX, or GPS Exchange Format, is an XML schema designed as a common GPS data
format for software applications. It can be used to describe waypoints,
tracks, and routes. ... Location data (and optionally elevation, time, and
other information) is stored in tags and can be interchanged between GPS
devices and software.
