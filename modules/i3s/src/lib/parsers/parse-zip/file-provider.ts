export interface FileProvider {
    getUint8(offset: number): number;
    getUint16(offset: number): number;
    getUint32(offset: number): number;
    slice(startOffsset: number, endOffset: number): ArrayBuffer;
    length: number;
}