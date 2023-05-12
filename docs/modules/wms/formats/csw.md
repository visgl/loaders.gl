# CSW - Catalog Service - Web

- *[`@loaders.gl/wms`](/docs/modules/wms)*
- *[Wikipedia article)][csw]*

CSW (Catalogue Service for the Web, sometimes written Catalogue Service - Web), is an OGC standard for exposing a catalogue of geospatial records in XML on the Internet (over HTTP). The catalogue is made up of records that describe geospatial data (e.g. KML), geospatial services (e.g. WMS), and related resources.

Operations defined by the CSW standard include:

| Operation                | Description                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `GetCapabilities`        | allows CSW clients to retrieve service metadata from a server                                 |
| `DescribeRecord`         | allows a client to discover the information model supported by a target catalogue or service. |
| `GetRecords`             | search for records, returning record IDs                                                      |
| `GetRecordById`          | retrieves the default representation of catalogue records using their identifier              |
| `GetDomain` (optional)   | obtain information about the range of values of a metadata record or request parameter        |
| `Harvest` (optional)     | create/update metadata by asking the server to 'pull' metadata from somewhere                 |
| `Transaction` (optional) | create/edit metadata by 'pushing' the metadata to the server                                  |

Requests can encode the parameters in three different ways:

| Parameter encoding               | loaders.gl support |
| -------------------------------- | ------------------ |
| `GET` with URL parameters        | Yes                |
| `POST` with form-encoded payload | No                 |
| `POST` with XML payload          | No                 |

Responses are in XML.

[csw]: https://en.wikipedia.org/wiki/Catalogue_Service_for_the_Web
