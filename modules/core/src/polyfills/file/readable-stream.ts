// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {ReadableStream as NodeReadableStream} from 'node:stream/web';

/** Compatibility stream class backed by Node's native Web Streams implementation. */
export class ReadableStreamPolyfill<T> extends NodeReadableStream<T> {}
