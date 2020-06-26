import {DataType, SyncDataType, BatchableDataType} from '../common';

export function getUrlFromData(data: DataType, url): string;
export function getArrayBufferOrStringFromDataSync(data: SyncDataType, loader): ArrayBuffer | string;
export function getArrayBufferOrStringFromData(data: DataType, loader): Promise<ArrayBuffer | string>;
export function getAsyncIteratorFromData(data: BatchableDataType): Promise<AsyncIterable<ArrayBuffer>>;
