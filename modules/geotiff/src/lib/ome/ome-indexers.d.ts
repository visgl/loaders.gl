import type { GeoTIFFImage, GeoTIFF } from 'geotiff';
import type { OMEXML } from '../ome/omexml';
export declare type OmeTiffSelection = {
    t: number;
    c: number;
    z: number;
};
export declare type OmeTiffIndexer = (sel: OmeTiffSelection, z: number) => Promise<GeoTIFFImage>;
export declare function getOmeLegacyIndexer(tiff: GeoTIFF, rootMeta: OMEXML): OmeTiffIndexer;
export declare function getOmeSubIFDIndexer(tiff: GeoTIFF, rootMeta: OMEXML): OmeTiffIndexer;
