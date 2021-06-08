declare type TypedArray = import('../constants').TypedArray;

declare module 'geotiff' {
  function fromUrl(url: string, headers?: Record<string, unknown>): Promise<GeoTIFF>;
  function fromBlob(blob: Blob): Promise<GeoTIFF>;
  function fromFile(path: string): Promise<GeoTIFF>;

  class GeoTIFF {
    readRasters(options?: RasterOptions): Promise<TypedArray>;
    getImage(index: number): Promise<GeoTIFFImage>;
    parseFileDirectoryAt(offset: number): Promise<ImageFileDirectory>;
    ifdRequests: {[key: number]: Promise<ImageFileDirectory>};
    dataView: DataView;
    littleEndian: boolean;
    cache: any;
    source: any;
  }

  interface Pool {
    decode(fileDirectory: FileDirectory, buffer: ArrayBuffer): Promise<ArrayBuffer>;
  }

  interface RasterOptions {
    window?: number[];
    bbox?: number[];
    samples?: number[];
    interleave?: boolean;
    pool?: Pool;
    width?: number;
    height?: number;
    resampleMethod?: string;
    enableAlpha?: boolean;
    signal?: AbortSignal;
  }

  type RasterData = (TypedArray | TypedArray[]) & {
    width: number;
    height: number;
  };
  class GeoTIFFImage {
    constructor(
      fileDirectory: FileDirectory,
      geoKeyDirectory: any,
      dataView: DataView,
      littleEndian: boolean,
      cache: any,
      source: any
    );
    fileDirectory: FileDirectory;
    getBoundingBox(): number[];
    getFileDirectory(): FileDirectory;
    getBytesPerPixel(): number;
    getHeight(): number;
    getSamplesPerPixel(): number;
    getTileHeight(): number;
    getTileWidth(): number;
    getWidth(): number;
    readRasters(options?: RasterOptions): Promise<RasterData>;
  }

  interface FileDirectory {
    ImageDescription: string;
    SubIFDs?: number[];
    PhotometricInterpretation?: number;
  }

  interface ImageFileDirectory {
    fileDirectory: FileDirectory;
    geoKeyDirectory: any;
  }
}
