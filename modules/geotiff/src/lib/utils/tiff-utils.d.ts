import type { PixelSource } from '../../types';
export declare function ensureArray<T>(x: T | T[]): T[];
export declare function intToRgba(int: number): [number, number, number, number];
export declare function isInterleaved(shape: number[]): boolean;
export declare function getImageSize<T extends string[]>(source: PixelSource<T>): {
    height: number;
    width: number;
};
export declare const SIGNAL_ABORTED = "__vivSignalAborted";
