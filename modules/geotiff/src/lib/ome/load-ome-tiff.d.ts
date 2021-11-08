import type { GeoTIFF, GeoTIFFImage } from 'geotiff';
import TiffPixelSource from '../tiff-pixel-source';
export declare const isOmeTiff: (img: GeoTIFFImage) => boolean;
export declare function loadOmeTiff(tiff: GeoTIFF, firstImage: GeoTIFFImage): Promise<{
    data: TiffPixelSource<["t", "c", "z"] | ["c", "t", "z"] | ["z", "t", "c"] | ["t", "z", "c"] | ["z", "c", "t"] | ["c", "z", "t"]>[];
    metadata: {
        format(): {
            'Acquisition Date': string;
            'Dimensions (XY)': string;
            'Pixels Type': "uint8" | "uint16" | "uint32" | "float" | "double" | "int8" | "int16" | "int32" | "bit" | "complex" | "double-complex";
            'Pixels Size (XYZ)': string;
            'Z-sections/Timepoints': string;
            Channels: number;
        };
        AquisitionDate: string;
        Description: string;
        Pixels: {
            Channels: ({
                Color: [number, number, number, number];
                ID: string;
                SamplesPerPixel: number;
                Name?: string | undefined;
            } | {
                ID: string;
                SamplesPerPixel: number;
                Name?: string | undefined;
            })[];
            PhysicalSizeX: number;
            PhysicalSizeY: number;
            PhysicalSizeZ: number;
            SignificantBits: number;
            SizeX: number;
            SizeY: number;
            SizeZ: number;
            SizeT: number;
            SizeC: number;
            PhysicalSizeXUnit: import("./omexml").UnitsLength;
            PhysicalSizeYUnit: import("./omexml").UnitsLength;
            PhysicalSizeZUnit: import("./omexml").UnitsLength;
            BigEndian: boolean;
            Interleaved: boolean;
            ID: string;
            DimensionOrder: import("./omexml").DimensionOrder;
            Type: "uint8" | "uint16" | "uint32" | "float" | "double" | "int8" | "int16" | "int32" | "bit" | "complex" | "double-complex";
        };
        ID: string;
        Name: string;
    };
}>;
