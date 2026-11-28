# Data Attribution

## WMTS

- `get-capabilities-response.xml` is adapted from the OGC WMTS 1.0.0 example
  http://schemas.opengis.net/wmts/1.0/examples/wmtsGetCapabilities_response.xml.
  Local change: the upstream XML comments are removed. The `TopLeftCorner` values use the
  upstream order (`-180 84`, longitude first for the CRS84 matrix set).
- `ogc-schema-example.xml` is adapted from the OGC WMTS 1.0.0 example
  http://schemas.opengis.net/wmts/1.0/examples/wmtsGetCapabilities_response_RESTful.xml.
  Local changes: the `ows:Get` hrefs are `http://cite.deegree.org/1.0.0`, the second operation
  uses `ows:Post`, and the service abstract is shorter. The upstream file closes `<ows:Get>` with
  `</ows:Get>`; the local copy had `</ows:Post>`, which is now corrected to match upstream, so the
  document is well-formed XML. Its `WholeWorld_CRS_84` matrix set uses the
  `urn:ogc:def:crs:OGC:1.3:CRS84` URN and the GlobalCRS84Pixel scale set (matrix `2g` is
  2 degrees per pixel).
- `epsg-3035-laea-europe.xml` is hand-written with synthetic values, trimmed to two matrices. It
  uses the ETRS89-extended / LAEA Europe CRS (EPSG:3035, axes northing, easting), so its
  `TopLeftCorner` is written N E. The resolutions are 4000 and 2000 m per pixel.

OGC license: https://www.ogc.org/license

## OGC API Tiles

- `ogc-api-tiles/*.json` are hand-written tileset metadata, tile matrix set list, and TileMatrixSet
  2.0 documents, shaped after public OGC API - Tiles responses. The tile matrix values follow the
  OGC WebMercatorQuad and WorldCRS84Quad registry definitions.

## WMS

- get-capabilities `inherited-crs.xml` is hand-written. A root layer lists EPSG:4326 and
  EPSG:3857, one child layer adds EPSG:25832, and one child layer lists no CRS. One child layer
  spells EPSG:3857 as a URN and adds EPSG:3035. It tests the
  WMS 1.3.0 inheritance of CRS and BoundingBox values (Table 7).
- get-capabilities `analyses.xml`, `dmsp.xml`, `forecasts.xml`, `obs.xml`, `wwa.xml` were copied from from https://github.com/w8r/wms-capabilities under OpenLayers license:

## OpenLayers license

> The OpenLayers license emphasizes attribution not only in text but also in binary form, potentially making this emphasis contagious to applications built on loaders.gl. Therefore, loaders.gl only uses OpenLayers licensed files for test cases and other auxillary code that does not become part of the published application libraries.

```
Copyright 2005-2016 OpenLayers Contributors. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY OPENLAYERS CONTRIBUTORS ``AS IS'' AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

The views and conclusions contained in the software and documentation are those of the authors and should not be interpreted as representing official policies, either expressed or implied, of OpenLayers Contributors.
```
