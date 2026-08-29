---
title: CSWService
description: Query a CSW catalog through typed capabilities, service-directory, and search methods.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="WMS module · catalog service"
  title="Give catalog search a typed application boundary."
  description="CSWService wraps the OGC Catalogue Service for the Web protocol and parses its responses into usable metadata, catalog records, domains, and referenced services."
  tone="orange"
  meta={['From v3.4', 'Experimental', 'HTTP GET / KVP']}
  links={[
    {label: 'CSW format', to: '/docs/modules/wms/formats/csw'},
    {label: 'WMS module', to: '/docs/modules/wms'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<DocOrientation
  eyebrow="The CSW service path"
  title="Discover, search, and resolve without parsing XML yourself."
  description="CSWService keeps protocol request construction and response parsing together, while leaving the decision about which discovered WMS, WMTS, or WFS endpoint to use with the application."
  tone="orange"
  items={[
    {label: 'Capabilities', value: 'Read and normalize GetCapabilities metadata'},
    {label: 'Catalog records', value: 'Search and retrieve typed records'},
    {label: 'Service directory', value: 'Extract known service references'},
    {label: 'Boundary', value: 'GET/KVP requests; XML POST generation is not supported'}
  ]}
/>

<ReferenceBoundary
  title="CSWService reference"
  description="The sections below document construction, capabilities, catalog records, service discovery, request options, and current protocol limits."
  tone="orange"
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square" alt="From-3.4" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

The `CSWService` class provides OGC CSW (catalog service for the web) access

- Type safe methods to call and parse results (and errors) from a CSW service's endpoints
- In particular, the big `GetCapabilities` metadata is normalized into a fully typed data structure.

> The `CSWService` generates URLs with URL parameters intended to be used with HTTP GET requests against a CSW server. The OGC CSW standard also allows CSW services to accept XML payloads with HTTP POST messages, however generation of such XML payloads is not supported by this class.

## Usage

A `CSWService` instance provides type safe methods that make calls to the service and parse the responses.

Get a normalized array of all the services and resources referenced by this catalog server:

```typescript
const cswService = new CSWService({url: CSW_SERVICE_URL});
const serviceDirectory = await cswService.getServiceDirectory({includeUnknown: true});
console.log(serviceDirectory);
```

Capabilities metadata can be queried:

```typescript
const cswService = new CSWService({url: CSW_SERVICE_URL});
const capabilities = await cswService.getCapabilities({});
// Check capabilities
```

Custom fetch options, such as HTTP headers, and loader-specific options can be specified via the
standard loaders.gl `loadOptions` argument, which is forwarded to all load and parse operations:

```typescript
const cswService = new CSWService({
  url: CSW_SERVICE_URL,
  loadOptions: {
    fetch: {
      headers: {
        Authentication: 'Bearer abc...'
      }
    }
  }
});

const serviceDirectory = await cswService.getServiceDirectory();
```

## Methods

### constructor()

Creates a `CSWService` instance

```typescript
export type CSWServiceProps = {
  url: string; // Base URL to the service
  loadOptions?: LoaderOptions; // Passed to loaders used by CSWService methods
};

constructor(props: CSWServiceProps)
```

### getCapabilities()

Get Capabilities

```typescript
async getCapabilities(
  cswParameters?: CSWGetCapabilitiesParameters,
  vendorParameters?: Record<string, unknown>
): Promise<CSWCapabilities>
```

### getServiceDirectory()

Get a list of all service exposed by this catalog server.

```typescript
async getServiceDirectory(
  options: CSWGetMapParameters,
  vendorParameters?: Record<string, unknown>
): Promise<Service[]>
```

```typescript
export type CSWGetMapParameters = {
  includeUnknown: boolean; // Include services and resources that loaders.gl cannot handle
};
```
