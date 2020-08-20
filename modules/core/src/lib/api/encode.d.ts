import {WriterObject} from '@loaders.gl/loader-utils';

/**
 * Encode loaded data into a binary ArrayBuffer using the specified Writer.
 */
export function encode(data: any, writer: WriterObject, options?: object, url?: string): Promise<ArrayBuffer>;

/**
 * Encode loaded data into a binary ArrayBuffer using the specified Writer.
 */
export function encodeSync(data: any, writer: WriterObject, options?: object, url?: string): ArrayBuffer;

/**
 * Encode loaded data into a sequence (iterator) of binary ArrayBuffers using the specified Writer.
 */
export function encodeInBatches(data: any, writer: WriterObject, options?: object, url?: string): AsyncIterable<ArrayBuffer>;

/**
 * Encode data stored in a file (on disk) to another file.
 * @note Node.js only. This function enables using command-line converters as "writers".
 */
export function encodeURLtoURL(inputUrl, outputUrl, writer: WriterObject, options);

/**
 * Encode loaded data to text using the specified Writer 
 * @note This is a convenience function not intended for production use on large input data.
 * It is not optimized for performance. Data maybe converted from text to binary and back.
 * @throws if the writer does not generate text output
 */
export function encodeText(data: any, writer: WriterObject, options?: object, url?: string): Promise<string>;
