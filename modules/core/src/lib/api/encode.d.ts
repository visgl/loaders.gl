import {WriterObject} from '../common';

export function encode(data: any, writer: WriterObject, options?: object, url?: string): Promise<ArrayBuffer>;

export function encodeSync(data: any, writer: WriterObject, options?: object, url?: string): ArrayBuffer;

export function encodeInBatches(data: any, writer: WriterObject, options?: object, url?: string): AsyncIterator<ArrayBuffer>;
