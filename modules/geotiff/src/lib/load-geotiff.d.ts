import { GeoTIFF } from 'geotiff';
import type TiffPixelSource from './tiff-pixel-source';
/** Options for initializing a tiff pixel source. */
interface GeoTIFFOptions {
    /** Headers passed to each underlying request. */
    headers?: Record<string, unknown>;
    /** Performance enhancment to index the remote tiff source using pre-computed byte-offsets. Generated via https://github.com/ilan-gold/generate-tiff-offsets */
    offsets?: number[];
    /** Indicates whether a multi-threaded pool of image decoders should be used to decode tiles. */
    pool?: boolean;
}
interface GeoTIFFData {
    data: TiffPixelSource<string[]>[];
    metadata: Record<string, unknown>;
}
/**
 * Opens an OME-TIFF via URL and returns data source and associated metadata for first image.
 *
 * @param source url string, File/Blob object, or GeoTIFF object
 * @param opts options for initializing a tiff pixel source.
 *  - `opts.headers` are passed to each underlying fetch request.
 *  - `opts.offsets` are a performance enhancment to index the remote tiff source using pre-computed byte-offsets.
 *  - `opts.pool` indicates whether a multi-threaded pool of image decoders should be used to decode tiles (default = true).
 * @return data source and associated OME-Zarr metadata.
 */
export declare function loadGeoTiff(source: string | Blob | GeoTIFF, opts?: GeoTIFFOptions): Promise<GeoTIFFData>;
export {};
