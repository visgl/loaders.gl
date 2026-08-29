---
title: WMSFeatureInfoLoader
description: Parse a WMS GetFeatureInfo response into a typed result for map inspection workflows.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WMS API · feature information"
  title="Ask a map service what is under the cursor."
  description="WMSFeatureInfoLoader parses the XML response from a GetFeatureInfo request into a typed JavaScript result. It keeps verbose protocol details behind a smaller boundary for identify, tooltip, and inspection tools."
  tone="blue"
  meta={['From v3.3', 'GetFeatureInfo', 'Experimental']}
  links={[
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'WMS format', to: '/docs/modules/wms/formats/wms'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The identify path"
  title="Keep map rendering and feature inspection separate."
  description="The WMS map response is an image; GetFeatureInfo is a separate request that returns information about the queried location. This loader parses that second response without becoming a full XML client."
  tone="blue"
  items={[
    {label: 'Input', value: 'XML response from a WMS GetFeatureInfo request'},
    {label: 'Output', value: 'Typed WMSFeatureInfo data'},
    {label: 'Runtime', value: 'Synchronous XML parsing; no worker path'},
    {label: 'Fallback', value: 'Use XMLLoader when fields outside the normalized result are needed'}
  ]}
/>

<ReferenceBoundary
  title="WMSFeatureInfoLoader reference"
  description="The sections below document request usage, parsed data, options, and the boundary between normalized fields and raw XML."
  tone="blue"
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-v3.3" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

The `WMSFeatureInfoLoader` parses the XML-formatted response from the
the [OGC](https://www.opengeospatial.org/) [WMS](https://www.ogc.org/standards/wms) (Web Map Service) standard `GetFeatureInfo` request into a typed JavaScript data structure.

> Note that the WMS standard is rather verbose and the XML responses can contain many rarely used metadata fields, not all of which are extracted by this loader. If this is a problem, it is possible to use the `XMLLoader` directly though the result will be untyped and not normalized.

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.xml`                                               |
| File Type             | Text                                                 |
| File Format           | [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure                                       |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | No                                                   |
| Streaming Support     | No                                                   |

## Usage

```typescript
import {WMSFeatureInfoLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a WMS request
const url = `${WMS_SERVICE_URL}?REQUEST=GetFeatureInfo&LAYER=...`;

const data = (await load(url, WMSFeatureInfoLoader, options)) as WMSFeatureInfo;
```

## Parsed Data Format

```typescript
/** All capabilities of a WMS service. Typed data structure extracted from XML */
export type WMSFeatureInfo = {
  // TO BE DOCUMENTED
};
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
