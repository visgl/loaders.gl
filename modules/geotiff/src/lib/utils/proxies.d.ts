import type { GeoTIFF } from 'geotiff';
import type Pool from './Pool';
export declare function checkProxies(tiff: GeoTIFF): void;
export declare function createOffsetsProxy(tiff: GeoTIFF, offsets: number[]): GeoTIFF;
export declare function createPoolProxy(tiff: GeoTIFF, pool: Pool): GeoTIFF;
