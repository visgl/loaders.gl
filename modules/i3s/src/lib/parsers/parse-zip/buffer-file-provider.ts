import { FileProvider } from "./file-provider";

export class BufferFileProvider implements FileProvider {
    file: DataView;

    constructor(file: DataView){
        this.file = file;
    };
    getUint8(offset: number): Promise<number> {
        return Promise.resolve(this.file.getUint8(offset));
    }
    getUint16(offset: number): Promise<number> {
        return Promise.resolve(this.file.getUint16(offset, true));
    }
    getUint32(offset: number): Promise<number> {
        return Promise.resolve(this.file.getUint32(offset, true));
    }
    slice(startOffsset: number, endOffset: number): Promise<ArrayBuffer> {
        return Promise.resolve(this.file.buffer.slice(startOffsset, endOffset));
    }
    get length() {
        return this.file.byteLength;
    }

}