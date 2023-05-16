# LERC - Limited Error Raster Compression

![ogc-logo](../../../images/logos/ogc-logo-60.png)

- *[`loaders.gl/wms`](/docs/modules/wms)*
- *[LERC specification](http://esri.github.io/lerc/)*

LERC is an open-source image or raster format which supports rapid encoding and decoding for any pixel type (not just RGB or Byte). Users set the maximum compression error per pixel while encoding, so the precision of the original input image is preserved (within user defined error bounds).
