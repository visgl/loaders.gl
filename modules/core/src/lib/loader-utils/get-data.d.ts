export function getUrlFromData(data, url): string;
export function getArrayBufferOrStringFromDataSync(data, loader): ArrayBuffer | string;
export function getArrayBufferOrStringFromData(data, loader): Promise<ArrayBuffer | string>;
export function getAsyncIteratorFromData(data): Promise<AsyncIterator<any>>;
export function getIteratorFromData(data);