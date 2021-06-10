import {fromUrl, fromBlob, GeoTIFF} from 'geotiff';

import {
  // createPoolProxy,
  createOffsetsProxy,
  checkProxies
} from './utils/proxies';
// import Pool from './lib/Pool';

import {loadOmeTiff, isOmeTiff} from './ome/load-ome-tiff';
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
export async function loadGeoTiff(
  source: string | Blob | GeoTIFF,
  opts: GeoTIFFOptions = {}
): Promise<GeoTIFFData> {
  const {headers, offsets} = opts;

  // Create tiff source
  let tiff: GeoTIFF;
  if (source instanceof GeoTIFF) {
    tiff = source;
  } else if (typeof source === 'string') {
    tiff = await fromUrl(source, headers);
  } else {
    tiff = await fromBlob(source);
  }

  // if (pool) {
  /*
   * Creates a worker pool to decode tiff tiles. Wraps tiff
   * in a Proxy that injects 'pool' into `tiff.readRasters`.
   */
  // tiff = createPoolProxy(tiff, new Pool());
  // }

  if (offsets) {
    /*
     * Performance enhancement. If offsets are provided, we
     * create a proxy that intercepts calls to `tiff.getImage`
     * and injects the pre-computed offsets.
     */
    tiff = createOffsetsProxy(tiff, offsets);
  }

  /*
   * Inspect tiff source for our performance enhancing proxies.
   * Prints warnings to console if `offsets` or `pool` are missing.
   */
  checkProxies(tiff);

  const firstImage = await tiff.getImage(0);

  if (isOmeTiff(firstImage)) {
    return loadOmeTiff(tiff, firstImage);
  }

  throw new Error('GeoTIFF not recognized.');
}
