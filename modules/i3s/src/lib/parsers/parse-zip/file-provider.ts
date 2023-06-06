export interface FileProvider {
    getUint8(offset: number): Promise<number>;
    getUint16(offset: number): Promise<number>;
    getUint32(offset: number): Promise<number>;
    slice(startOffsset: number, endOffset: number): Promise<ArrayBuffer>;
    length: number;
}