import {DataType, SyncDataType, BatchableDataType} from '@loaders.gl/loader-utils';

export function getInitialDataSync(data: SyncDataType): ArrayBuffer | string | null;
export function getArrayBufferOrStringFromDataSync(
  data: SyncDataType,
  loader
): ArrayBuffer | string;
export function getArrayBufferOrStringFromData(
  data: DataType,
  loader
): Promise<ArrayBuffer | string>;
export function getAsyncIteratorFromData(
  data: BatchableDataType
): Promise<AsyncIterable<ArrayBuffer>>;
export function getReadableStream(data: BatchableDataType): Promise<ReadableStream>;
