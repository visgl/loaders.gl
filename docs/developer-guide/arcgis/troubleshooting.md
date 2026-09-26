---
title: ArcGIS troubleshooting
description: Diagnose incomplete data, authentication errors, coordinate problems and unsupported operations.
---

# Troubleshoot an ArcGIS integration

| Symptom | Likely cause | What to check |
| --- | --- | --- |
| No source matches | Portal item URL, proxy URL, or ambiguous service type | Use a REST service/layer URL and explicit `core.type` |
| Root loader throws during construction | Metadata passed to synchronous `createDataSource` | Use async `load()` or import the `*WithParser` runtime subpath |
| Only some features appear | Record limit or query bounds | The feature client makes one request; use a paging client when completeness matters |
| Invalid GeoJSON response | Esri JSON response or ArcGIS error envelope | Keep `f: 'geojson'`; inspect the original service response without logging credentials |
| 401, 498 or 499 | Missing or expired token | Check the exact origin allowlist and the token callback |
| 403 after refresh | Insufficient access, restrictions, or wrong target server | Check service sharing, credential privileges, restrictions and federation |
| HTTP 200 contains an ArcGIS error | Error status is encoded in JSON | The built-in refresh path checks HTTP status; use an application ArcGIS transport for envelope-aware renewal |
| Initial request works, child resources fail | Different host, token scope or resource permissions | Authorize only the explicitly trusted child origins and validate resource access |
| Browser fetch fails but a server request works | CORS, TLS, cookies, proxy or network access | Fix server/proxy configuration; client code cannot override CORS |
| Features are displaced | Bounds or output data use an unexpected CRS | Inspect metadata and request a supported output spatial reference |
| Vector tiles look different from ArcGIS | Application styling differs | Full ArcGIS style, glyph, sprite and label evaluation is not implemented |
| LERC output is not an image | Response contains numeric bands and a mask | Select a raster visualization and honor NoData |
| Scene metadata loads but rendering fails | Profile/encoding/CRS mismatch | Consult the I3S profile and renderer requirements; a metadata fetch is not a rendering test |
| Service exists in discovery but cannot load | Catalog enumeration exceeds adapter support | Consult the [full inventory](/docs/modules/arcgis/services) |
| Embedded demo fails | Remote service unavailable or browser cannot access it | Check its visible error and service URL; examples do not silently substitute recorded data |

## Keep requests bounded

Select fields, filter on the server, debounce viewport changes, and cancel obsolete work. Use a
stable layer instance where possible. Avoid automatically retrying a request indefinitely; failures
may represent missing privileges or unsupported operations rather than a temporary outage.

## Report a reproducible issue

Include the loaders.gl version, service type, operation, relevant advertised capabilities, browser,
and a minimal request/result example with secrets removed. For Enterprise, include the server
version and whether the service is federated. Prefer a small public or synthetic fixture that
reproduces the response shape over a private endpoint that maintainers cannot access.
