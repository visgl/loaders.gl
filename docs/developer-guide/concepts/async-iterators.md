# AsyncIterators

Streaming functionality in loaders.gl is built on the ES2018 `AsyncIterator` concept. 
This page gives some background on `AsyncIterator`.

## Availability

`AsyncIterator` and the `for await of` iteration syntax are standard JavaScript ES2018 features and are supported by all recent evergreen browsers and Node.js versions as well as e.g. the babel transpiler.

## Iterators and TypeScript

There are multiple similar-sounding types supporting the type safe use of iterators which can be a source of confusion to users, so some information is provided here:

| Type               | Async Type              | Type Parameters |
 Description                                                                                                                              |
| ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `Iterator`         | `AsyncIterator`         | `<...>` | An iterator has `next()`, ... methods                                                                                                    |
| `Iterable`         | `AsyncIterable`         | `<...>` | An iterable is a class that has a `[Symbol.iterator]` or `[Symbol.asyncIterator]` property that returns an `Iterator` or `AsyncIterator` |
| `Generator`        | `AsyncGenerator`        | `<...>` | A generator is a function that takes some parameters and when called returns an `Iterator` or `AsyncIterator`                            |
| `IterableIterator` | `AsyncIterableIterator` | `<...>` | It is convenient to define `Iterator`s that are also `Iterable`. Most built in container classes return this type.                       |

An `IterableIterator` can
- be used in a for..of loop
- be spread into an array
- be spread into a parameter list
- be used in APIs that accept iterables like `Array.from()`, `new Set()`, `new Map()`

```typescript
interface Iterable {
    [Symbol.iterator]() : Iterator;
}
interface Iterator {
    next() : IteratorResult;
    return?(value? : any) : IteratorResult;
}
interface IteratorResult {
    value: any;
    done: boolean;
}
```

https://exploringjs.com/es6/ch_iteration.html#sec_implementing-iterables 

## Batched Parsing and Endcoding using AsyncIterators

The input and output from streaming loaders and writers can both be expressed in terms of async iterators.

## Using AsyncIterators

Remember that an `AsyncIterator` or `AsyncIterable` can be consumed (iterated over) via the for-await construct:

```typescript
for await (const x of asyncIterable) {
}
```

## Using Streams as AsyncIterators

With a little effort, streams in JavaScript can be treated as AsyncIterators. As the section about [Javascript Streams](/docs/developer-guide/concepts/streaming) explains, instead of registering callbacks on the stream, you can now work with streams in this way:

```typescript
for await (const buf of fs.createReadStream('foo.txt')) {
  // do something
}
```

## Creating AsyncIterators

Remember that any object in JavaScript that implements the `[Symbol.asyncIterator]()` method is an `AsyncIterable`. 

And the async **generator** syntax `async function *` can be used to generate new async iterators

```typescript
async function * makeAsyncIterator() {
  yield new Promise(...)
}

for await (const x of makeAsyncIterator()) {} // Notice parens after 'makeAsyncIterator'
```
