export declare function fromString(str: string): {
    format(): {
        'Acquisition Date': string;
        'Dimensions (XY)': string;
        'Pixels Type': PixelType;
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
        PhysicalSizeXUnit: UnitsLength;
        PhysicalSizeYUnit: UnitsLength;
        PhysicalSizeZUnit: UnitsLength;
        BigEndian: boolean;
        Interleaved: boolean;
        ID: string;
        DimensionOrder: DimensionOrder;
        Type: PixelType;
    };
    ID: string;
    Name: string;
}[];
export declare type OMEXML = ReturnType<typeof fromString>;
export declare type DimensionOrder = 'XYZCT' | 'XYZTC' | 'XYCTZ' | 'XYCZT' | 'XYTCZ' | 'XYTZC';
declare type PixelType = 'int8' | 'int16' | 'int32' | 'uint8' | 'uint16' | 'uint32' | 'float' | 'bit' | 'double' | 'complex' | 'double-complex';
export declare type UnitsLength = 'Ym' | 'Zm' | 'Em' | 'Pm' | 'Tm' | 'Gm' | 'Mm' | 'km' | 'hm' | 'dam' | 'm' | 'dm' | 'cm' | 'mm' | 'µm' | 'nm' | 'pm' | 'fm' | 'am' | 'zm' | 'ym' | 'Å' | 'thou' | 'li' | 'in' | 'ft' | 'yd' | 'mi' | 'ua' | 'ly' | 'pc' | 'pt' | 'pixel' | 'reference frame';
export {};
