// loaders.gl, MIT license

/** Data returned by LERC loader */
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

export type LercPixelType = 'S8' | 'U8' | 'S16' | 'U16' | 'S32' | 'U32' | 'F32' | 'F64';

export interface BandStats {
  minValue: number;
  maxValue: number;
  depthStats?: {
    minValues: Float64Array;
    maxValues: Float64Array;
  };
}

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;
