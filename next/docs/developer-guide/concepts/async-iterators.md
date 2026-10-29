Developer guide · iteration

# Process batches with ordinary JavaScript.

loaders.gl uses ES2018 async iterators as the common shape for streamed input, parsed batches, transforms, and output. If you can use for await...of, you already know the central control flow.

[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)[Streaming concepts](https://loaders.gl/next/docs/developer-guide/concepts/streaming.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/streaming.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

The iterator model

## One pull-based loop for files, streams, and batches.

An iterable describes how values are obtained; an async iterable allows each next value to wait for I/O. loaders.gl uses that distinction to keep streaming behavior portable across browsers and Node.js.

01

Iterator

next() returns one IteratorResult

02

Iterable

Provides a Symbol.iterator or async counterpart

03

Generator

Produces values through function syntax

04

Pipeline

Consume or produce batches with for await...of

Detailed guide

## Async iterator details

The sections below explain TypeScript iterator types, batched parsing and encoding, stream interoperability, and custom async generators.

Streaming functionality in loaders.gl is built on the ES2018 `AsyncIterator` concept. This page gives some background on `AsyncIterator`.

## Availability[​](#availability "Direct link to Availability")

`AsyncIterator` and the `for await of` iteration syntax are standard JavaScript ES2018 features and are supported by all recent evergreen browsers and Node.js versions as well as e.g. the babel transpiler.

## Iterators and TypeScript[​](#iterators-and-typescript "Direct link to Iterators and TypeScript")

There are multiple similar-sounding types supporting the type safe use of iterators which can be a source of confusion to users, so some information is provided here:

| Synchronous type      | Asynchronous type          | Meaning                                                                   |
| --------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `Iterator<T>`         | `AsyncIterator<T>`         | Supplies `next()` results, directly or through promises.                  |
| `Iterable<T>`         | `AsyncIterable<T>`         | Supplies an iterator through `Symbol.iterator` or `Symbol.asyncIterator`. |
| `Generator<T>`        | `AsyncGenerator<T>`        | An iterator produced by a generator function; also iterable.              |
| `IterableIterator<T>` | `AsyncIterableIterator<T>` | An iterator that also implements the corresponding iterable protocol.     |

An `IterableIterator` can

* be used in a for..of loop
* be spread into an array
* be spread into a parameter list
* be used in APIs that accept iterables like `Array.from()`, `new Set()`, `new Map()`

```
interface Iterable {

  [Symbol.iterator](): Iterator;

}

interface Iterator {

  next(): IteratorResult;

  return?(value?: any): IteratorResult;

}

interface IteratorResult {

  value: any;

  done: boolean;

}
```

<https://exploringjs.com/es6/ch_iteration.html#sec_implementing-iterables>

## Batched Parsing and Encoding using AsyncIterators[​](#batched-parsing-and-encoding-using-asynciterators "Direct link to Batched Parsing and Encoding using AsyncIterators")

The input and output from streaming loaders and writers can both be expressed in terms of async iterators.

## Using AsyncIterators[​](#using-asynciterators "Direct link to Using AsyncIterators")

Remember that an `AsyncIterator` or `AsyncIterable` can be consumed (iterated over) via the for-await construct:

```
for await (const x of asyncIterable) {

}
```

## Using Streams as AsyncIterators[​](#using-streams-as-asynciterators "Direct link to Using Streams as AsyncIterators")

With a little effort, streams in JavaScript can be treated as AsyncIterators. As the section about [Javascript Streams](https://loaders.gl/next/docs/developer-guide/concepts/streaming.md) explains, instead of registering callbacks on the stream, you can now work with streams in this way:

```
for await (const buf of fs.createReadStream('foo.txt')) {

  // do something

}
```

## Creating AsyncIterators[​](#creating-asynciterators "Direct link to Creating AsyncIterators")

Remember that any object in JavaScript that implements the `[Symbol.asyncIterator]()` method is an `AsyncIterable`.

And the async **generator** syntax `async function *` can be used to generate new async iterators

```
async function * makeAsyncIterator() {

  yield new Promise(...)

}



for await (const x of makeAsyncIterator()) {} // Notice parens after 'makeAsyncIterator'
```
