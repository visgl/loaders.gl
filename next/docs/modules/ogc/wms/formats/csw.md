OGC catalog format

![](/next/images/format-logos/ogc-mark.svg)OGCCSW

# Find the dataset before requesting its pixels or features.

Catalogue Service for the Web (CSW) is an OGC protocol for searching geospatial catalogs. loaders.gl adapts the read-only catalog operations into typed records and a normalized service directory.

[WMS module](https://loaders.gl/next/docs/modules/ogc/wms.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms.md)[CSW service](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/csw-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/ogc/wms/api-reference/csw-source-loader.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

The catalog path

## Search records, then follow their service references.

CSW sits above map, feature, tile, and coverage services. The source exposes catalog metadata first, keeping the decision about which service to request in the application.

01

Discover

Read capabilities and advertised domains

02

Search

Request typed catalog records asynchronously

03

Resolve

Extract WMS, WMTS, and WFS service references

04

Boundary

Read-only GET/KVP support; POST XML is outside the source

Detailed guide

## CSW operations and support

The reference below covers supported operations, catalog search, service-directory extraction, request customization, and current protocol boundaries.

CSW is an OGC protocol for searching catalogs of geospatial datasets, services, and related resources. `CSWSourceLoader` adapts read-only CSW endpoints to the loaders.gl `CatalogSource` contract.

## Feature support[​](#feature-support "Direct link to Feature support")

| Capability                         | Support           | API and behavior                                                            |
| ---------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| `GetCapabilities`                  | ✅ Supported      | `getCapabilities()` returns parsed, typed service metadata                  |
| `GetRecords`                       | ✅ Supported      | `getRecords()` and async `search()` return catalog records                  |
| `GetDomain`                        | ✅ Supported      | `getDomain()` parses advertised parameter domains                           |
| Service directory                  | ✅ Supported      | `getServiceDirectory()` extracts WMS, WMTS, and WFS references              |
| Normalized catalog contract        | ✅ Supported      | Implements read-only `CatalogSource` metadata and search                    |
| Vendor query parameters            | ✅ Supported      | Appended to generated GET requests                                          |
| HTTP GET / KVP                     | ✅ Supported      | All implemented operations use query parameters                             |
| XML or form POST                   | ❌ Not supported  | Request payload generation is outside the source                            |
| `DescribeRecord` / `GetRecordById` | ❌ Not exposed    | Use a custom request and the low-level XML loaders if needed                |
| Pagination and CQL filtering       | ❌ Not normalized | The minimal catalog contract reports these capabilities as unavailable      |
| Harvest and transactions           | ❌ Not supported  | The source is read-only                                                     |
| deck.gl rendering                  | Not applicable    | Select a referenced visual service, then pass that service to `SourceLayer` |

## Search a catalog[​](#search-a-catalog "Direct link to Search a catalog")

```
import {createDataSource} from '@loaders.gl/core';

import {CSWSourceLoader} from '@loaders.gl/ogc/wms';



const catalog = createDataSource(cswUrl, [CSWSourceLoader]);

const metadata = await catalog.getMetadata();



for await (const record of catalog.search()) {

  console.log(record.title, record.references);

}
```

## Discover referenced services[​](#discover-referenced-services "Direct link to Discover referenced services")

```
const services = await catalog.getServiceDirectory({includeUnknown: true});



// Each recognized entry includes a normalized type, base URL, and original query parameters.

const firstWms = services.find(service => service.type === 'ogc-wms-service');
```

The directory recognizes `OGC:WMS`, `OGC:WMTS`, and `OGC:WFS` reference schemes. Unknown schemes can be retained for application-specific handling.

## Request customization[​](#request-customization "Direct link to Request customization")

Authentication headers and custom transports use standard fetch options. Operation-specific and vendor parameters can be supplied separately:

```
const records = await catalog.getRecords(

  {version: '2.0.0', typenames: 'csw:Record'},

  {outputSchema: 'http://www.isotc211.org/2005/gmd'}

);
```

## References[​](#references "Direct link to References")

* [OGC Catalogue Service standard](https://www.ogc.org/standard/cat/)
* [CSW overview](https://en.wikipedia.org/wiki/Catalogue_Service_for_the_Web)
