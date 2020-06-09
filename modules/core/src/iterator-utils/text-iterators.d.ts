export function makeTextEncoderIterator(textIterator: AsyncIterable<string>, options?: object): AsyncIterable<ArrayBuffer>;
export function makeTextDecoderIterator(arrayBufferIterator: AsyncIterable<ArrayBuffer>, options?: object): AsyncIterable<string>;
export function makeLineIterator(textIteratortextIterator: AsyncIterable<string>): AsyncIterable<string>;
export function makeNumberedLineIterator(lineIterator: AsyncIterable<string>): AsyncIterable<{counter: number; line: string}>;
