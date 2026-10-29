WMS module · catalog service

![](/next/images/format-logos/ogc-mark.svg)OGCCSW

# Give catalog search a typed application boundary.

CSWService wraps the OGC Catalogue Service for the Web protocol and parses its responses into usable metadata, catalog records, domains, and referenced services.

[CSW format](https://loaders.gl/next/docs/modules/ogc/wms/formats/csw.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/formats/csw.md)[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

The CSW service path

## Discover, search, and resolve without parsing XML yourself.

CSWService keeps protocol request construction and response parsing together, while leaving the decision about which discovered WMS, WMTS, or WFS endpoint to use with the application.

01

Capabilities

Read and normalize GetCapabilities metadata

02

Catalog records

Search and retrieve typed records

03

Service directory

Extract known service references

04

Boundary

GET/KVP requests; XML POST generation is not supported

Detailed guide

## CSWService reference

The sections below document construction, capabilities, catalog records, service discovery, request options, and current protocol limits.

![From-3.4](https://img.shields.io/badge/From-v3.4-blue.svg?style=flat-square)![Status: Experimental](https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square)

The `CSWService` class provides OGC CSW (catalog service for the web) access

* Type safe methods to call and parse results (and errors) from a CSW service's endpoints
* In particular, the big `GetCapabilities` metadata is normalized into a fully typed data structure.

> The `CSWService` generates URLs with URL parameters intended to be used with HTTP GET requests against a CSW server. The OGC CSW standard also allows CSW services to accept XML payloads with HTTP POST messages, however generation of such XML payloads is not supported by this class.

## Usage[​](#usage "Direct link to Usage")

A `CSWService` instance provides type safe methods that make calls to the service and parse the responses.

Get a normalized array of all the services and resources referenced by this catalog server:

```
const cswService = createDataSource(CSW_SERVICE_URL, [CSWSourceLoader]);

const serviceDirectory = await cswService.getServiceDirectory({includeUnknown: true});

console.log(serviceDirectory);
```

Capabilities metadata can be queried:

```
const cswService = createDataSource(CSW_SERVICE_URL, [CSWSourceLoader]);

const capabilities = await cswService.getCapabilities({});

// Check capabilities
```

For shared loading controls and parser configuration, see [Source options](https://loaders.gl/next/docs/developer-guide/using-sources.md#options).

## Methods[​](#methods "Direct link to Methods")

### constructor()[​](#constructor "Direct link to constructor()")

Creates a `CSWCatalogSource` instance. Prefer `createDataSource` to inject the core parsing API.

```
constructor(url: string, options: CSWSourceLoaderOptions, coreApi?: CoreAPI)
```

### getCapabilities()[​](#getcapabilities "Direct link to getCapabilities()")

Get Capabilities

```
async getCapabilities(

  cswParameters?: CSWGetCapabilitiesParameters,

  vendorParameters?: Record<string, unknown>

): Promise<CSWCapabilities>
```

### getServiceDirectory()[​](#getservicedirectory "Direct link to getServiceDirectory()")

Get a list of all service exposed by this catalog server.

```
async getServiceDirectory(

  options: CSWGetMapParameters,

  vendorParameters?: Record<string, unknown>

): Promise<Service[]>
```

```
export type CSWGetMapParameters = {

  includeUnknown: boolean; // Include services and resources that loaders.gl cannot handle

};
```
