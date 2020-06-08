export function makeTextEncoderIterator(textIterator: AsyncIterator<string>, options?: object): AsyncIterable<ArrayBuffer>;
export function makeTextDecoderIterator(arrayBufferIterator: AsyncIterator<ArrayBuffer>, options?: object): AsyncIterable<string>;
export function makeLineIterator(textIteratortextIterator: AsyncIterator<string>): AsyncIterable<string>;
export function makeNumberedLineIterator(lineIterator: AsyncIterator<string>): AsyncIterable<object>;
