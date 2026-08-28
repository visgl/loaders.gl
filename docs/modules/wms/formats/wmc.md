import {WmsDocsTabs} from '@site/src/components/docs/wms-docs-tabs';

# WMC - Web Map Context

<WmsDocsTabs active="wmc" />

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Web Map Context is a legacy OGC document format for saving and exchanging a configured set of map
layers.

## Feature support

| Capability | Support | Recommendation |
| --- | --- | --- |
| WMC document parsing | Not implemented | Parse XML with `@loaders.gl/xml` when maintaining legacy applications |
| WMC document writing | Not implemented | Keep application state in a modern JSON configuration |
| Referenced WMS layers | Supported separately | Use `WMSSourceLoader` for each referenced service |
| Modern context exchange | Not implemented | OWS Context is documented separately but also has no dedicated loader |

This page is retained so users can distinguish WMC from WMS. loaders.gl v5 supports the referenced
WMS services, not the context document itself.

## References

- [OGC Web Map Context specification](https://www.ogc.org/standard/wmc/)
