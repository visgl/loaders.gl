# AsyncIterators

Streaming functionality in loaders.gl is built on the ES2018 `AsyncIterator` concept. This page gives some background on AsyncIterator since it is a recently introduced concept (at least as part of the JavaScript standard).


## Availability

`AsyncIterator` is a standard JavaScript ES2018 feature and is well supported by recent evergreen browsers and Node.js versions.

The `for await of` iteration syntax is supported as well as the babel transpiler.



## Batched Parsing and Endcoding using AsyncIterators

The input and output from streaming loaders and writers can both be expressed in terms of async iterators.


## Using AsyncIterator

Remember tyhat an async iterator can be consumed (iterated over) via the for-await construct:

```js
for await (const x of asyncIterable) {}
```


## Using Streams as AsyncIterators

With a little effort, streams in JavaScript can be treated as AsyncIterators. As the section about [Javascript Streams](docs/developer-guide/streams.md) explains, instead of registering callbacks on the stream, you can now work with streams in this way:

```js
for await (const buf of fs.createReadStream('foo.txt')) {
  // do something
}
```


## Creating AsyncIterators

Remember that any object in JavaScript that implements the `[Symbol.asyncIterator]()` method is an `AsyncIterable`. And the async generator syntax can be used to generate new async iterators

```js
async function* asyncIterator() {
  yield new Promise(...)
}

for await (const x of asyncIterator()) {} // Notice parens after 'asyncIterator'
```
