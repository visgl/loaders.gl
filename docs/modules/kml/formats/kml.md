---
title: KML format
description: An XML standard for geographic annotation, visualization, and Earth-browser content.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geographic annotation format"
  title="Put places, paths, and views in an Earth-ready document."
  description="KML uses XML elements to describe geographic annotations and visualization instructions for maps and 3D Earth browsers. loaders.gl keeps the format in the broader GIS and scene-data pipeline."
  tone="mint"
  meta={['KML 2.2', 'XML-based', 'OGC standard']}
  links={[
    {label: 'KML module', to: '/docs/modules/kml'},
    {label: 'KMLLoader', to: '/docs/modules/kml/api-reference/kml-loader'}
  ]}
/>

<KmlDocsTabs active="overview" />

<DocOrientation
  eyebrow="The KML document"
  title="Describe the feature and how it should appear."
  description="KML combines geographic content with presentation hints such as styles, views, overlays, and network links. It is a document format, not just a geometry container."
  tone="mint"
  items={[
    {label: 'Geometry', value: 'Points, paths, polygons, and models'},
    {label: 'Presentation', value: 'Styles, icons, labels, and camera views'},
    {label: 'Composition', value: 'Folders, documents, overlays, and links'},
    {label: 'Standard', value: 'OGC KML for interoperable Earth browsers'}
  ]}
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

- [KML Tutorial - Google](https://developers.google.com/kml/documentation/kml_tut)

Keyhole Markup Language (KML) is an XML notation for expressing geographic
annotation and visualization within two-dimensional maps and three-dimensional
Earth browsers.

KML is now an [Open Geospatial Consortium standard][kml_ogc_standard].

<ReferenceBoundary
  title="KML document structure"
  description="The sections below cover the KML standard and the surrounding loader and document concepts."
  tone="mint"
/>

[kml_ogc_standard]: https://www.ogc.org/standards/kml
