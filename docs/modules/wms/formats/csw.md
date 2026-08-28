# CSW - Catalogue Service for the Web

![ogc-logo](../../../images/logos/ogc-logo-60.png)

CSW is an OGC protocol for searching catalogs of geospatial datasets, services, and related
resources. `CSWSourceLoader` adapts read-only CSW endpoints to the loaders.gl `CatalogSource`
contract.

## Feature support

| Capability | Support | API and behavior |
| --- | --- | --- |
| `GetCapabilities` | Supported | `getCapabilities()` returns parsed, typed service metadata |
| `GetRecords` | Supported | `getRecords()` and async `search()` return catalog records |
| `GetDomain` | Supported | `getDomain()` parses advertised parameter domains |
| Service directory | Supported | `getServiceDirectory()` extracts WMS, WMTS, and WFS references |
| Normalized catalog contract | Supported | Implements read-only `CatalogSource` metadata and search |
| Vendor query parameters | Supported | Appended to generated GET requests |
| HTTP GET / KVP | Supported | All implemented operations use query parameters |
| XML or form POST | Not supported | Request payload generation is outside the source |
| `DescribeRecord` / `GetRecordById` | Not exposed | Use a custom request and the low-level XML loaders if needed |
| Pagination and CQL filtering | Not normalized | The minimal catalog contract reports these capabilities as unavailable |
| Harvest and transactions | Not supported | The source is read-only |
| deck.gl rendering | Not applicable | Select a referenced visual service, then pass that service to `SourceLayer` |

## Search a catalog

```ts
import {createDataSource} from '@loaders.gl/core';
import {CSWSourceLoader} from '@loaders.gl/wms';

const catalog = createDataSource(cswUrl, [CSWSourceLoader]);
const metadata = await catalog.getMetadata();

for await (const record of catalog.search()) {
  console.log(record.title, record.references);
}
```

## Discover referenced services

```ts
const services = await catalog.getServiceDirectory({includeUnknown: true});

// Each recognized entry includes a normalized type, base URL, and original query parameters.
const firstWms = services.find(service => service.type === 'ogc-wms-service');
```

The directory recognizes `OGC:WMS`, `OGC:WMTS`, and `OGC:WFS` reference schemes. Unknown schemes
can be retained for application-specific handling.

## Request customization

Authentication headers and custom transports use standard fetch options. Operation-specific and
vendor parameters can be supplied separately:

```ts
const records = await catalog.getRecords(
  {version: '2.0.0', typenames: 'csw:Record'},
  {outputSchema: 'http://www.isotc211.org/2005/gmd'}
);
```

## References

- [OGC Catalogue Service standard](https://www.ogc.org/standard/cat/)
- [CSW overview](https://en.wikipedia.org/wiki/Catalogue_Service_for_the_Web)
