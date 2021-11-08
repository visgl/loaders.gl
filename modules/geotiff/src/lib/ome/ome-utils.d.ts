import type { OMEXML, UnitsLength } from './omexml';
export declare const DTYPE_LOOKUP: {
    readonly uint8: "Uint8";
    readonly uint16: "Uint16";
    readonly uint32: "Uint32";
    readonly float: "Float32";
    readonly double: "Float64";
    readonly int8: "Int8";
    readonly int16: "Int16";
    readonly int32: "Int32";
};
export declare function getOmePixelSourceMeta({ Pixels }: OMEXML[0]): {
    labels: import("../../types").Labels<["t", "c", "z"] | ["c", "t", "z"] | ["z", "t", "c"] | ["t", "z", "c"] | ["z", "c", "t"] | ["c", "z", "t"]>;
    getShape: (level: number) => number[];
    physicalSizes: {
        [k: string]: {
            size: number;
            unit: UnitsLength;
        };
    };
    dtype: "Uint8" | "Uint16" | "Uint32" | "Float32" | "Float64" | "Int8" | "Int16" | "Int32";
} | {
    labels: import("../../types").Labels<["t", "c", "z"] | ["c", "t", "z"] | ["z", "t", "c"] | ["t", "z", "c"] | ["z", "c", "t"] | ["c", "z", "t"]>;
    getShape: (level: number) => number[];
    dtype: "Uint8" | "Uint16" | "Uint32" | "Float32" | "Float64" | "Int8" | "Int16" | "Int32";
    physicalSizes?: undefined;
};
