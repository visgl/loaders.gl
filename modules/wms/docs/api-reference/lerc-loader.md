# LERCLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.3-blue.svg?style=flat-square" alt="From-3.3" />
	<img src="https://img.shields.io/badge/-BETA-teal.svg" alt="BETA" />
</p>

The `LERCLoader` parses the binary compressed raster format as described in [LERC Byte Stream Specification](https://github.com/Esri/lerc/blob/master/doc/Lerc_ByteStream_Specification.pdf).

LERC (Limited Error Raster Compression), also written Lerc, is a format for compressed raster image data. It was developed by Esri.
It may appear in a file by itself, or as part of MRF format, or be used as a compression method in a format such as GeoTIFF.
There are two major versions, known as "Lerc1" and "Lerc2".

| Loader                | Characteristic                                       |
| --------------------- | ---------------------------------------------------- |
| File Extension        | `.lrc`, `.lerc`, `.lerc2`, `.lerc1`                                                |
| File Type             | Binary                                                 |
| File Format           | [LERC](https://en.wikipedia.org/wiki/Web_Map_Service) |
| Data Format           | Data structure         |
| Decoder Type          | Synchronous                                          |
| Worker Thread Support | Yes                                                  |
| Streaming Support     | No                                                   |

## Usage

```js
import {LERCLoader} from '@loaders.gl/wms';
import {load} from '@loaders.gl/core';

// Form a LERC request
const url = `${WFS_SERVICE_URL}?REQUEST=GetFeature&...`;

const data = await load(url, LERCLoader, options);
```

## Parsed Data Format

Data returned by `LERCLoader`

```typescript
export type LERCData = {
  /**	Width of decoded image */
  width: number;
  /**	Height of decoded image */
  height: number;
  /**	The type of pixels represented in the output */
  pixelType: LercPixelType;
  /**	[statistics_band1, statistics_band2, …] Each element is a statistics object representing min and max values  */
  statistics: BandStats[];
  /**	[band1, band2, …] Each band is a typed array of width * height * depthCount */
  pixels: TypedArray[];
  /**	Typed array with a size of width*height, or null if all pixels are valid */
  mask: Uint8Array;
  /**	Depth count  */
  depthCount: number;
  /**	array	[band1_mask, band2_mask, …] Each band is a Uint8Array of width * height * depthCount */
  bandMasks?: Uint8Array[];
};

export type LercPixelType = "S8" | "U8" | "S16" | "U16" | "S32" | "U32" | "F32" | "F64";

export interface BandStats {
  minValue: number;
  maxValue: number;
  depthStats?: {
    minValues: Float64Array;
    maxValues: Float64Array;
  };
}
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `lerc.inputOffset?` | `number` | `0` | The number of bytes to skip in the input byte stream. A valid Lerc file is expected at that position |
| `lerc.noDataValue?` | `number` | `false` | It is recommended to use the returned mask instead of setting this value |
| `lerc.returnInterleaved?` | `boolean` | `false` | (ndepth LERC2 only) If true, returned depth values are pixel-interleaved |
