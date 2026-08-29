---
title: WKT-CRS - Coordinate Systems
description: Represent coordinate reference systems and transformations in the OGC WKT syntax.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Coordinate reference syntax"
  title="Describe where the coordinates live."
  description="WKT-CRS is the standards-based text grammar for coordinate reference systems and their transformations. It gives geospatial data a precise spatial frame before reprojection or rendering begins."
  tone="orange"
  meta={['ISO 19162:2019', 'OGC WKT-CRS', 'CRS and transformations']}
  links={[
    {label: 'WKT module', to: '/docs/modules/wkt'},
    {label: 'CRS guide', to: '/docs/developer-guide/coordinate-reference-systems'},
    {label: 'WKT CRS loader', to: '/docs/modules/wkt/api-reference/wkt-crs-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The CRS path"
  title="Parse the authority. Preserve the axes. Reproject deliberately."
  description="A CRS definition describes coordinate meaning, units, axes, datums, and transformations. Parsing the definition is separate from choosing whether and how coordinates should be reprojected."
  tone="orange"
  items={[
    {label: 'Definition', value: 'Geographic, projected, vertical, or compound CRS'},
    {label: 'Axes', value: 'Names, directions, units, and order'},
    {label: 'Authority', value: 'EPSG, OGC, or other identifiers and metadata'},
    {label: 'Next step', value: 'Use the parsed CRS in an explicit reprojection policy'}
  ]}
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

- _[`@loaders.gl/wkt`](/docs/modules/wkt)_
- _[OGC Standard](https://www.ogc.org/standards/wkt-crs)_
- _[Wikipedia Page](https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems)_

Well-known text representation of coordinate reference systems (WKT or WKT-CRS) is a text markup language for representing spatial reference systems and transformations between spatial reference systems. The formats were originally defined by the Open Geospatial Consortium (OGC) and described in their Simple Feature Access and Well-known text representation of coordinate reference systems specifications. The current standard definition is ISO 19162:2019.

<ReferenceBoundary
  title="CRS grammar and interoperability details"
  description="The reference below covers WKT-CRS revisions, CRS components, authority metadata, axis handling, and loaders.gl integration."
  tone="orange"
/>

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for the
loaders.gl type model, format support matrix, and reprojection roadmap.

## Version History

| Name                  | Year   | Description                                                  | ISO              |
| --------------------- | ------ | ------------------------------------------------------------ | ---------------- |
| WKT                   | (1999  | As initially defined by the Open Geospatial Consortium (OGC) |
| "WKT 1"               | (2001  | WKT was extended in 2001. Sometimes known as "WKT 1".        | ISO 19125-1:2004 |
| "WKT 2" / "WKT-CRS 1" | (2015) | Addresses new requirements and inconsistencies in WKT 1.     | ISO 19162:2015   |
| "WKT-CRS 2"           | (2018) | A newer revision.                                            | ISO 19162:2019   |

## Ecosystem Support
