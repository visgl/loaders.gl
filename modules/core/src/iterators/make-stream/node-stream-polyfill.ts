import type {Readable} from 'stream';
import stream from 'stream';

// Make things work under bundlers like vite and rollup
class Dummy {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(options) {}
}

// @ts-expect-error
let ReadableStream: typeof Readable = Dummy;
try {
  ReadableStream = stream.Readable;
} catch {
  // eslint-disable-next-line no-empty
}

export type {ReadableOptions, Readable} from 'stream';
export {ReadableStream};
