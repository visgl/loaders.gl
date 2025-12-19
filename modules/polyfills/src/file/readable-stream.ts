// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {ReadableStream as WSPReadableStream} from 'web-streams-polyfill';

// @ts-ignore
export class ReadableStreamPolyfill<T> extends WSPReadableStream<T> implements ReadableStream {}
