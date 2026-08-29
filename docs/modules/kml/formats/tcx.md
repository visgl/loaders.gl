---
title: TCX format
description: Garmin's XML exchange format for activities, laps, and fitness metrics.
hide_title: true
page_style: designed
---

import {KmlDocsTabs} from '@site/src/components/docs/kml-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Training Center XML"
  title="Keep activity data with its useful measurements."
  description="TCX describes GPS-backed activities as structured workouts, with laps and measurements such as heart rate, cadence, calories, and elevation. loaders.gl makes the track geometry available alongside that activity context."
  tone="orange"
  meta={['TCX', 'XML-based', 'Activity data']}
  links={[
    {label: 'KML module', to: '/docs/modules/kml'},
    {label: 'TCXLoader', to: '/docs/modules/kml/api-reference/tcx-loader'}
  ]}
/>

<KmlDocsTabs active="tcx" />

<DocOrientation
  eyebrow="The TCX document"
  title="An activity model around a GPS track."
  description="Unlike GPX, TCX organizes positions as part of an Activity. This makes room for summaries, laps, sport metadata, and measurements recorded during the effort."
  tone="orange"
  items={[
    {label: 'Activities', value: 'A workout or recorded session'},
    {label: 'Laps', value: 'Intervals with summaries and totals'},
    {label: 'Trackpoints', value: 'Positions and measurements over time'},
    {label: 'Metrics', value: 'Heart rate, cadence, calories, and more'}
  ]}
/>

- [TCX - Wikipedia](https://en.wikipedia.org/wiki/Training_Center_XML)

<ReferenceBoundary
  title="TCX format details"
  description="The notes below describe TCX as an activity-oriented XML exchange format."
  tone="orange"
/>

Training Center XML (TCX) is a data exchange format introduced in 2007 as part
of Garmin's Training Center product. The XML is similar to GPX since it
exchanges GPS tracks, but treats a track as an Activity rather than simply a
series of GPS points. TCX provides standards for transferring heart rate,
running cadence, bicycle cadence, calories in the detailed track. It also
provides summary data in the form of laps.
