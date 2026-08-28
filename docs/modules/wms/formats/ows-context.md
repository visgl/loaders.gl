# OWS Context

![ogc-logo](../../../images/logos/ogc-logo-60.png)

OWS Context is an OGC exchange format for packaging a collection of configured geospatial
resources and services.

## Feature support

| Capability | Support | Recommendation |
| --- | --- | --- |
| OWS Context Atom encoding | Not implemented | Parse the XML with `@loaders.gl/xml` and adapt links in application code |
| OWS Context JSON encoding | Not implemented | Load JSON normally and pass referenced endpoints to service loaders |
| Referenced WMS services | Supported separately | Use `WMSSourceLoader` |
| Referenced WMTS services | Supported separately | Use `WMTSSourceLoader` |
| Referenced WFS services | Supported separately | Use `WFSSourceLoader` |
| General service discovery | Supported separately | Use `discoverServiceGraph` or a `CSWSourceLoader` catalog |

This page is retained to clarify the boundary between a context document and the services it can
reference. loaders.gl v5 does not expose an OWS Context loader.

## References

- [OGC OWS Context standard](https://www.ogc.org/standard/owc/)
